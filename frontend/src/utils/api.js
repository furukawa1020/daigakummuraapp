const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Fetch wrapper with credentials (for cookies)
 */
async function fetchWithAuth(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
    throw new Error(error.error?.message || 'Request failed');
  }
  
  return response.json();
}

// Auth API
export const authApi = {
  register: (data) => fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  login: (data) => fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  logout: () => fetchWithAuth('/auth/logout', {
    method: 'POST',
  }),
  
  getMe: () => fetchWithAuth('/me'),
};

// Checkin API
export const checkinApi = {
  checkin: (lat, lng) => fetchWithAuth('/checkins', {
    method: 'POST',
    body: JSON.stringify({ lat, lng }),
  }),
  
  checkout: () => fetchWithAuth('/checkins/checkout', {
    method: 'POST',
  }),
  
  getActiveLatest: () => fetchWithAuth('/checkins/active-latest'),
  
  getActiveUsers: () => fetch(`${API_BASE_URL}/checkins/public/active`)
    .then(res => res.json()),
};

// Stats API
export const statsApi = {
  getPublicStats: () => fetch(`${API_BASE_URL}/public/stats`)
    .then(res => res.json()),
  
  getUserSummary: (userId) => fetch(`${API_BASE_URL}/users/${userId}/summary`)
    .then(res => res.json()),
  
  getLeaderboard: (type = 'visits', limit = 50) => 
    fetch(`${API_BASE_URL}/leaderboard?type=${type}&limit=${limit}`)
      .then(res => res.json()),
};

// Avatar API
export const avatarApi = {
  getParts: () => fetchWithAuth('/avatar/parts'),
  
  getMyParts: () => fetchWithAuth('/avatar/my-parts'),
  
  unlockPart: (partId) => fetchWithAuth(`/avatar/unlock/${partId}`, {
    method: 'POST',
  }),
  
  saveAvatar: (avatarState) => fetchWithAuth('/avatar/save', {
    method: 'POST',
    body: JSON.stringify({ avatarState }),
  }),
  
  autoUnlock: () => fetchWithAuth('/avatar/auto-unlock', {
    method: 'POST',
  }),
};

// Quest API
export const questApi = {
  createQuest: (data) => fetchWithAuth('/quests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getQuests: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/quests${queryString ? `?${queryString}` : ''}`);
  },
  
  getQuest: (questId) => fetchWithAuth(`/quests/${questId}`),
  
  updateQuest: (questId, data) => fetchWithAuth(`/quests/${questId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteQuest: (questId) => fetchWithAuth(`/quests/${questId}`, {
    method: 'DELETE',
  }),
  
  joinQuest: (questId) => fetchWithAuth(`/quests/${questId}/join`, {
    method: 'POST',
  }),
  
  completeQuest: (questId, reflection) => fetchWithAuth(`/quests/${questId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ reflection }),
  }),
  
  cancelQuest: (questId) => fetchWithAuth(`/quests/${questId}/cancel`, {
    method: 'POST',
  }),
};

// Diary API
export const diaryApi = {
  createPost: (data) => fetchWithAuth('/diary', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getPosts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return fetchWithAuth(`/diary${queryString ? `?${queryString}` : ''}`);
  },
  
  getPost: (postId) => fetchWithAuth(`/diary/${postId}`),
  
  updatePost: (postId, data) => fetchWithAuth(`/diary/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deletePost: (postId) => fetchWithAuth(`/diary/${postId}`, {
    method: 'DELETE',
  }),
  
  reactToPost: (postId, reactionType) => fetchWithAuth(`/diary/${postId}/react`, {
    method: 'POST',
    body: JSON.stringify({ reaction_type: reactionType }),
  }),
};

// Chat API
export const chatApi = {
  getChannels: () => fetchWithAuth('/chat/channels'),
  
  getMessages: (channelId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/chat/channels/${channelId}/messages${query ? `?${query}` : ''}`);
  },
  
  sendMessage: (channelId, data) => fetchWithAuth(`/chat/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  createDM: (targetUserId) => fetchWithAuth('/chat/channels/dm', {
    method: 'POST',
    body: JSON.stringify({ targetUserId }),
  }),
  
  deleteMessage: (messageId) => fetchWithAuth(`/chat/messages/${messageId}`, {
    method: 'DELETE',
  }),
};

// Calendar API
export const calendarApi = {
  getEvents: (params) => {
    const query = new URLSearchParams(params).toString();
    return fetchWithAuth(`/calendar/events?${query}`);
  },
  
  createEvent: (data) => fetchWithAuth('/calendar/events', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateEvent: (eventId, data) => fetchWithAuth(`/calendar/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  deleteEvent: (eventId) => fetchWithAuth(`/calendar/events/${eventId}`, {
    method: 'DELETE',
  }),
};
