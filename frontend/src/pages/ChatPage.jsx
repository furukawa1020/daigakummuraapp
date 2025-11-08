import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { chatApi } from '../utils/api';
import './ChatPage.css';

const ChatPage = () => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('message:new', ({ channelId, message }) => {
      if (selectedChannel?.id === channelId) {
        setMessages(prev => [...prev, message]);
      }
      
      // Update last message in channel list
      setChannels(prev => prev.map(ch => 
        ch.id === channelId 
          ? { ...ch, last_message: message, unread_count: ch.id === selectedChannel?.id ? 0 : (ch.unread_count || 0) + 1 }
          : ch
      ));
    });

    // Listen for typing indicators
    socket.on('typing:user', ({ channelId, userId, username }) => {
      if (selectedChannel?.id === channelId && userId !== user.id) {
        setTypingUsers(prev => new Set([...prev, username]));
      }
    });

    socket.on('typing:stop', ({ channelId, userId }) => {
      if (selectedChannel?.id === channelId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    });

    return () => {
      socket.off('message:new');
      socket.off('typing:user');
      socket.off('typing:stop');
    };
  }, [socket, selectedChannel, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChannels = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getChannels();
      setChannels(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId) => {
    try {
      setError('');
      const data = await chatApi.getMessages(channelId);
      setMessages(data);
      
      // Join channel via socket
      if (socket) {
        socket.emit('join:channel', channelId);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
    await loadMessages(channel.id);
    
    // Reset unread count
    setChannels(prev => prev.map(ch => 
      ch.id === channel.id ? { ...ch, unread_count: 0 } : ch
    ));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChannel) return;

    try {
      setError('');
      
      // Send via socket for real-time delivery
      if (socket && connected) {
        socket.emit('message:send', {
          channelId: selectedChannel.id,
          content: newMessage.trim(),
        });
      } else {
        // Fallback to HTTP if socket not connected
        await chatApi.sendMessage(selectedChannel.id, {
          content: newMessage.trim(),
        });
        await loadMessages(selectedChannel.id);
      }
      
      setNewMessage('');
      
      // Stop typing indicator
      if (socket) {
        socket.emit('typing:stop', selectedChannel.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedChannel) return;

    // Send typing indicator
    socket.emit('typing:start', selectedChannel.id);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', selectedChannel.id);
    }, 3000);
  };

  const getChannelName = (channel) => {
    if (channel.type === 'global') return '全体チャット';
    if (channel.type === 'quest') return channel.quest_title || 'クエスト';
    if (channel.type === 'dm') {
      // For DM, show other user's name (would need to fetch this)
      return 'ダイレクトメッセージ';
    }
    return channel.name;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="chat-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-layout">
        <aside className="channels-sidebar surface-card">
          <div className="sidebar-header">
            <h2>チャンネル</h2>
            <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              {connected ? 'オンライン' : 'オフライン'}
            </div>
          </div>

          <div className="channels-list">
            {channels.length === 0 ? (
              <div className="empty-channels">
                <p>チャンネルがありません</p>
              </div>
            ) : (
              channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''}`}
                >
                  <div className="channel-info">
                    <div className="channel-name">{getChannelName(channel)}</div>
                    {channel.last_message && (
                      <div className="channel-preview">
                        {channel.last_message.content}
                      </div>
                    )}
                  </div>
                  {channel.unread_count > 0 && (
                    <div className="unread-badge">{channel.unread_count}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="chat-main">
          {selectedChannel ? (
            <>
              <div className="chat-header surface-card">
                <h2>{getChannelName(selectedChannel)}</h2>
              </div>

              <div className="messages-container">
                {error && (
                  <div className="error-message">{error}</div>
                )}

                <div className="messages-list">
                  {messages.map((message) => {
                    const isOwn = message.user_id === user.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`message ${isOwn ? 'own' : 'other'}`}
                      >
                        {!isOwn && (
                          <div className="message-avatar">
                            {message.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        <div className="message-content">
                          {!isOwn && (
                            <div className="message-author">{message.nickname || message.username}</div>
                          )}
                          <div className="message-bubble">
                            <p>{message.content}</p>
                          </div>
                          <div className="message-time">{formatTime(message.created_at)}</div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {typingUsers.size > 0 && (
                    <div className="typing-indicator">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="typing-text">
                        {Array.from(typingUsers).join(', ')}が入力中...
                      </span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  className="input message-input"
                  placeholder="メッセージを入力..."
                  disabled={!connected}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newMessage.trim() || !connected}
                >
                  送信
                </button>
              </form>
            </>
          ) : (
            <div className="no-channel-selected">
              <p>チャンネルを選択してください</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChatPage;
