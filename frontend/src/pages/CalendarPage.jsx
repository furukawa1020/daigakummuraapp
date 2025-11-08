import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { calendarApi } from '../utils/api';
import './CalendarPage.css';

const CalendarPage = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    allDay: false,
    location: '',
    color: '#3b82f6',
  });

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const data = await calendarApi.getEvents({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    if (!newEvent.title || !newEvent.startTime) {
      setError('タイトルと開始時刻は必須です');
      return;
    }

    try {
      setError('');
      await calendarApi.createEvent(newEvent);
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        allDay: false,
        location: '',
        color: '#3b82f6',
      });
      await loadEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteEvent = async (eventId, eventType) => {
    if (eventType !== 'personal') {
      return;
    }

    if (!confirm('このイベントを削除しますか？')) {
      return;
    }

    try {
      await calendarApi.deleteEvent(eventId);
      await loadEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days in month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openCreateModal = (date) => {
    setSelectedDate(date);
    setNewEvent(prev => ({
      ...prev,
      startTime: date.toISOString().slice(0, 16),
    }));
    setShowCreateModal(true);
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      personal: '個人',
      quest: 'クエスト',
      checkin: 'チェックイン',
    };
    return labels[type] || type;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (loading) {
    return (
      <div className="calendar-page">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header glass-card">
        <div className="header-content">
          <h1>カレンダー</h1>
          <p>イベント、クエスト、チェックイン履歴を統合管理</p>
        </div>
        <button onClick={() => openCreateModal(new Date())} className="btn btn-primary">
          イベント作成
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="calendar-controls surface-card">
        <button onClick={goToPreviousMonth} className="btn btn-outline">
          前月
        </button>
        <div className="current-month">
          <h2>
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
          </h2>
        </div>
        <button onClick={goToNextMonth} className="btn btn-outline">
          次月
        </button>
        <button onClick={goToToday} className="btn btn-secondary">
          今日
        </button>
      </div>

      <div className="calendar-grid surface-card">
        <div className="weekdays">
          <div className="weekday">日</div>
          <div className="weekday">月</div>
          <div className="weekday">火</div>
          <div className="weekday">水</div>
          <div className="weekday">木</div>
          <div className="weekday">金</div>
          <div className="weekday">土</div>
        </div>

        <div className="days-grid">
          {getCalendarDays().map((date, index) => {
            const dayEvents = date ? getEventsForDate(date) : [];
            
            return (
              <div
                key={index}
                className={`day-cell ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''}`}
                onClick={() => date && openCreateModal(date)}
              >
                {date && (
                  <>
                    <div className="day-number">{date.getDate()}</div>
                    <div className="day-events">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`event-indicator ${event.type}`}
                          style={{ borderLeftColor: event.color }}
                          title={event.title}
                        >
                          <span className="event-title">{event.title}</span>
                          <span className="event-type">{getEventTypeLabel(event.type)}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="more-events">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content surface-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新しいイベント</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="event-form">
              <div className="form-group">
                <label htmlFor="title">タイトル *</label>
                <input
                  id="title"
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">説明</label>
                <textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="input textarea"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startTime">開始時刻 *</label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">終了時刻</label>
                  <input
                    id="endTime"
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">場所</label>
                <input
                  id="location"
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="color">色</label>
                <input
                  id="color"
                  type="color"
                  value={newEvent.color}
                  onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                  className="color-input"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newEvent.allDay}
                    onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
                  />
                  終日イベント
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
