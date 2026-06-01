// client/src/api.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";


// ════════════════════════════════════════════════════════
//  LOCAL STORAGE HELPERS
// ════════════════════════════════════════════════════════
export const getToken      = () => localStorage.getItem("token");
export const getIsPremium  = () => localStorage.getItem("isPremium") === "true";

export const getCurrentUser = () => {
  try {
    const info = localStorage.getItem("userInfo");
    return info ? JSON.parse(info) : null;
  } catch {
    return null;
  }
};

export const saveSession = (token, user, isPremium = false) => {
  localStorage.setItem("token",    token);
  localStorage.setItem("userInfo", JSON.stringify(user));
  if (isPremium) localStorage.setItem("isPremium", "true");
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userInfo");
  localStorage.removeItem("isPremium");
};

export const isLoggedIn = () => !!getToken();


// ════════════════════════════════════════════════════════
//  CORE REQUEST HANDLER
// ════════════════════════════════════════════════════════
const request = async (endpoint, method = "GET", body = null) => {
  const token = getToken();

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);

    // Read raw text first — prevents crash on empty responses
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    // ── Status handlers ───────────────────────────────
    if (res.status === 401) {
      // Token expired → clear everything and go home
      clearAuth();
      window.location.href = "/";
      throw new Error("Session expired. Please log in again.");
    }

    if (res.status === 402 || data?.upgrade) {
      // Payment required
      throw new Error("UPGRADE_REQUIRED");
    }

    if (res.status === 403) {
      throw new Error(data?.message || "Access denied.");
    }

    if (res.status === 404) {
      throw new Error(data?.message || "Not found.");
    }

    if (!res.ok) {
      throw new Error(data?.message || `Request failed: ${res.status}`);
    }

    return data;

  } catch (err) {
    // Server is down or no internet
    if (err.message === "Failed to fetch") {
      throw new Error(
        "Cannot connect to server. Make sure the backend is running on port 5000 or set VITE_API_URL."
      );
    }
    console.error(`❌ API [${method} ${endpoint}]:`, err.message);
    throw err;
  }
};


// ════════════════════════════════════════════════════════
//  AUTH  →  /api/auth/...
// ════════════════════════════════════════════════════════
export const authAPI = {

  // POST /api/auth/register  ← Home.jsx popup
  register: (formData) =>
    request("/api/auth/register", "POST", {
      name:        formData.name?.trim() || "",
      email:       formData.email?.trim().toLowerCase() || "",
      password:    formData.password || "",
      dateOfBirth: formData.dateOfBirth || "",
      occupation:  formData.occupation?.trim() || "",
    }),

  // POST /api/auth/login
  login: (formData) =>
    request("/api/auth/login", "POST", {
      email:    formData.email?.trim().toLowerCase(),
      password: formData.password,
    }),

  // GET /api/auth/me  ← get current logged in user
  getMe: () => request("/api/auth/me"),

  // Helper — check if logged in
  isLoggedIn: () => isLoggedIn(),

  // Helper — save after register or login
  saveSession: (token, user, isPremium = false) =>
    saveSession(token, user, isPremium),

  // Helper — logout
  logout: () => {
    clearAuth();
    window.location.href = "/";
  },
};


// ════════════════════════════════════════════════════════
//  MATCHES  →  /api/matches/...
// ════════════════════════════════════════════════════════
export const matchAPI = {

  // GET /api/matches/users  ← swipeable cards on Home.jsx
  getUsers: () => request("/api/matches/users"),

  // GET /api/matches  ← Matches.jsx list
  getMatches: () => request("/api/matches"),

  // POST /api/matches/like/:id  ← ❤️ button
  likeUser: (id) => request(`/api/matches/like/${id}`, "POST"),

  // POST /api/matches/dislike/:id  ← ❌ button
  dislikeUser: (id) => request(`/api/matches/dislike/${id}`, "POST"),
};


export const chatAPI = {

  // GET /api/chat/:userId  ← load messages in Chat.jsx
  getMessages: (userId) =>
    request(`/api/chat/${userId}`),

  // POST /api/chat/send  ← send message with photos
  sendMessage: (receiverId, text, isBlindDate = false, photos = []) =>
    request("/api/chat/send", "POST", {
      receiverId,
      text:        text?.trim(),
      isBlindDate,
      photos,
    }),

  // DELETE /api/chat/:id  ← delete message
  deleteMessage: (id) =>
    request(`/api/chat/${id}`, "DELETE"),

  // PUT /api/chat/reaction/:id  ← add emoji reaction
  addReaction: (id, emoji) =>
    request(`/api/chat/reaction/${id}`, "PUT", { emoji }),

  // PUT /api/chat/read/:userId  ← mark messages as read
  markAsRead: (userId) =>
    request(`/api/chat/read/${userId}`, "PUT"),

  // PUT /api/chat/typing/:userId  ← notify typing
  setTyping: (userId, typing) =>
    request(`/api/chat/typing/${userId}`, "PUT", { typing }),

  // GET /api/chat/unread/:userId  ← unread badge on Matches
  getUnreadCount: (userId) =>
    request(`/api/chat/unread/${userId}`),
};


// ════════════════════════════════════════════════════════
//  SELF NOTES  →  /api/chat/notes/...
// ════════════════════════════════════════════════════════
export const notesAPI = {

  // GET /api/chat/notes  ← SelfChat.jsx load
  getNotes: () => request("/api/chat/notes"),

  // POST /api/chat/notes  ← SelfChat.jsx send
  addNote: (text, time) =>
    request("/api/chat/notes", "POST", {
      text: text?.trim(),
      time,
    }),

  // DELETE /api/chat/notes/:id  ← SelfChat.jsx delete
  deleteNote: (id) =>
    request(`/api/chat/notes/${id}`, "DELETE"),
};


// ════════════════════════════════════════════════════════
//  COMMUNITY  →  /api/community/...
// ════════════════════════════════════════════════════════
export const communityAPI = {

  // GET /api/community?page=1  ← Community.jsx feed
  getPosts: (page = 1) =>
    request(`/api/community?page=${page}`),

  // POST /api/community  ← create post with photos
  createPost: (text, photos = []) =>
    request("/api/community", "POST", { 
      text: text?.trim(),
      photos,
    }),

  // PUT /api/community/like/:id  ← toggle like
  likePost: (id) =>
    request(`/api/community/like/${id}`, "PUT"),

  // PUT /api/community/reaction/:id  ← add emoji reaction
  addReaction: (id, emoji) =>
    request(`/api/community/reaction/${id}`, "PUT", { emoji }),

  // POST /api/community/comment/:id  ← add comment
  addComment: (id, text, photo = '') =>
    request(`/api/community/comment/${id}`, "POST", {
      text: text?.trim(),
      photo,
    }),

  // DELETE /api/community/:id/photo/:photoIndex  ← delete photo
  deletePhoto: (id, photoIndex) =>
    request(`/api/community/${id}/photo/${photoIndex}`, "DELETE"),

  // DELETE /api/community/:id  ← delete own post
  deletePost: (id) =>
    request(`/api/community/${id}`, "DELETE"),
};


// ════════════════════════════════════════════════════════
//  MARKETPLACE  →  /api/marketplace/...
// ════════════════════════════════════════════════════════
export const marketplaceAPI = {

  // GET /api/marketplace?search=...  ← product grid
  getProducts: (search = "") =>
    request(
      `/api/marketplace${search ? `?search=${encodeURIComponent(search)}` : ""}`
    ),

  // GET featured products for adverts
  getFeatured: (limit = 5) => request(`/api/marketplace/featured?limit=${limit}`),

  // POST /api/marketplace/purchase/:id  ← buy product
  purchaseProduct: (id, name, message = "") =>
    request(`/api/marketplace/purchase/${id}`, "POST", {
      name:    name?.trim(),
      message: message?.trim(),
    }),

  // POST /api/marketplace  ← seller adds product
  addProduct: (data) =>
    request("/api/marketplace", "POST", {
      name:        data.name?.trim(),
      price:       Number(data.price),
      description: data.description?.trim() || "",
      image:       data.image              || "",
      category:    data.category           || "other",
    }),
};


// ════════════════════════════════════════════════════════
//  BLIND DATE  →  /api/blind/...
// ════════════════════════════════════════════════════════
export const blindAPI = {

  // GET /api/blind/match  ← BlindDate.jsx find match
  findMatch: () => request("/api/blind/match"),

  // POST /api/blind/upgrade  ← upgrade to premium
  upgradeToPremium: ({ method, provider, account, accountName } = {}) =>
    request("/api/blind/upgrade", "POST", {
      method,
      provider,
      account,
      accountName,
    }).then(data => {
      localStorage.setItem("isPremium", "true");
      return data;
    }),

  // GET /api/blind/status  ← check if user is premium
  getPremiumStatus: () => request("/api/blind/status"),
};


// ════════════════════════════════════════════════════════
//  PREMIUM / PAYMENT  →  /api/premium/...
// ════════════════════════════════════════════════════════
export const premiumAPI = {

  // POST /api/premium/pay  ← start payment (Paystack/Stripe)
  pay: (amount = 9.99, currency = "USD") =>
    request("/api/premium/pay", "POST", { amount, currency }),

  // POST /api/premium/verify  ← verify after redirect
  verify: (reference) =>
    request("/api/premium/verify", "POST", { reference }),

  // GET /api/premium/status
  getStatus: () => request("/api/premium/status"),

  // Local check (no API call)
  isPremium: () => getIsPremium(),

  // Activate locally (after successful payment)
  activateLocally: () => {
    localStorage.setItem("isPremium", "true");
  },
};


// ════════════════════════════════════════════════════════
//  USER PROFILE  →  /api/users/...
// ════════════════════════════════════════════════════════
export const userAPI = {

  // GET /api/users/:id  ← view any profile
  getProfile: (id) => request(`/api/users/${id}`),

  // PUT /api/users/profile  ← edit own profile
  updateProfile: (data) =>
    request("/api/users/profile", "PUT", {
      name:     data.name?.trim(),
      bio:      data.bio?.trim()      || "",
      age:      Number(data.age)      || undefined,
      location: data.location?.trim() || "",
      hobbies:  Array.isArray(data.hobbies) ? data.hobbies : [],
    }),

  // PUT /api/users/photo  ← update profile photo URL
  updatePhoto: (photoUrl) =>
    request("/api/users/photo", "PUT", { photo: photoUrl }),

  // PUT /api/users/online  ← update online status
  setOnlineStatus: (isOnline) =>
    request("/api/users/online", "PUT", { isOnline }),

  // DELETE /api/users/account  ← delete account
  deleteAccount: () =>
    request("/api/users/account", "DELETE").then(() => clearAuth()),
};


// ════════════════════════════════════════════════════════
//  ADMIN API (uses adminToken in localStorage)
// ════════════════════════════════════════════════════════
const getAdminToken = () => localStorage.getItem('adminToken');

const adminRequest = async (endpoint, method = 'GET', body = null) => {
  const token = getAdminToken();
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data?.message || `Admin request failed: ${res.status}`);
  return data;
};

export const adminAPI = {
  // GET /api/admin/messages?page=&limit=&search=&includeDeleted=true
  getMessages: (opts = {}) => {
    const params = new URLSearchParams();
    if (opts.page) params.set('page', opts.page);
    if (opts.limit) params.set('limit', opts.limit);
    if (opts.search) params.set('search', opts.search);
    if (opts.includeDeleted) params.set('includeDeleted', 'true');
    return adminRequest(`/api/admin/messages?${params.toString()}`);
  },

  getStats: () => adminRequest('/api/admin/stats'),
  getUsers: () => adminRequest('/api/admin/users'),
  getPayments: () => adminRequest('/api/admin/payments'),
  getActivityLogs: () => adminRequest('/api/admin/activity-logs'),
  verifyUser: (userId) => adminRequest(`/api/admin/users/${userId}/verify`, 'POST'),
  deleteUser: (userId) => adminRequest(`/api/admin/users/${userId}`, 'DELETE'),
  resetUserPassword: (userId) => adminRequest(`/api/admin/users/${userId}/reset-password`, 'POST'),
  deleteMessage: (id) => adminRequest(`/api/admin/messages/${id}`, 'DELETE'),
  markMessageRead: (id) => adminRequest(`/api/admin/messages/${id}/mark-read`, 'POST'),
  restoreMessage: (id) => adminRequest(`/api/admin/messages/${id}/restore`, 'POST'),
};