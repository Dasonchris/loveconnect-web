// client/src/api/index.js

const BASE_URL = 'http://localhost:5000/api';

// ── Get token from localStorage ──────────────────────
const getToken = () => localStorage.getItem('token');

// ── Base fetch helper ─────────────────────────────────
const request = async (endpoint, options = {}) => {
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const res  = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

// ════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════
export const authAPI = {
  register: (form) =>
    request('/auth/register', {
      method: 'POST',
      body:   JSON.stringify(form),
    }),

  login: (form) =>
    request('/auth/login', {
      method: 'POST',
      body:   JSON.stringify(form),
    }),

  getMe: () => request('/auth/me'),
};

// ════════════════════════════════════════════════════
//  MATCHES / USERS
// ════════════════════════════════════════════════════
export const matchAPI = {
  getUsers:    ()         => request('/matches/users'),
  getMatches:  ()         => request('/matches'),
  likeUser:    (targetId) => request(`/matches/like/${targetId}`,    { method: 'POST' }),
  dislikeUser: (targetId) => request(`/matches/dislike/${targetId}`, { method: 'POST' }),
};

// ════════════════════════════════════════════════════
//  CHAT
// ════════════════════════════════════════════════════
export const chatAPI = {
  getMessages: (userId) => request(`/chat/${userId}`),

  sendMessage: (receiverId, text, isBlindDate = false) =>
    request('/chat/send', {
      method: 'POST',
      body:   JSON.stringify({ receiverId, text, isBlindDate }),
    }),

  deleteMessage: (id) =>
    request(`/chat/${id}`, { method: 'DELETE' }),
};

// ════════════════════════════════════════════════════
//  SELF NOTES
// ════════════════════════════════════════════════════
export const notesAPI = {
  getNotes: ()           => request('/chat/notes'),
  addNote:  (text, time) => request('/chat/notes', {
    method: 'POST',
    body:   JSON.stringify({ text, time }),
  }),
  deleteNote: (id)       => request(`/chat/notes/${id}`, { method: 'DELETE' }),
};

// ════════════════════════════════════════════════════
//  COMMUNITY
// ════════════════════════════════════════════════════
export const communityAPI = {
  getPosts:   ()         => request('/community'),
  createPost: (text)     => request('/community', {
    method: 'POST',
    body:   JSON.stringify({ text }),
  }),
  likePost:   (id)       => request(`/community/like/${id}`,    { method: 'PUT'  }),
  addComment: (id, text) => request(`/community/comment/${id}`, {
    method: 'POST',
    body:   JSON.stringify({ text }),
  }),
  deletePost: (id)       => request(`/community/${id}`, { method: 'DELETE' }),
};

// ════════════════════════════════════════════════════
//  MARKETPLACE
// ════════════════════════════════════════════════════
export const marketplaceAPI = {
  getProducts: (search = '') =>
    request(`/marketplace${search ? `?search=${search}` : ''}`),

  purchaseProduct: (id, name, message) =>
    request(`/marketplace/purchase/${id}`, {
      method: 'POST',
      body:   JSON.stringify({ name, message }),
    }),
};

// ════════════════════════════════════════════════════
//  BLIND DATE
// ════════════════════════════════════════════════════
export const blindAPI = {
  findMatch: () => request('/blind/match'),
};