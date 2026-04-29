// client/src/api.js

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";


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
        "Cannot connect to server. Make sure the backend is running on port 5000."
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
    request("/auth/register", "POST", {
      name:     formData.name?.trim(),
      email:    formData.email?.trim().toLowerCase(),
      password: formData.password,
    }),

  // POST /api/auth/login
  login: (formData) =>
    request("/auth/login", "POST", {
      email:    formData.email?.trim().toLowerCase(),
      password: formData.password,
    }),

  // GET /api/auth/me  ← get current logged in user
  getMe: () => request("/auth/me"),

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
  getUsers: () => request("/matches/users"),

  // GET /api/matches  ← Matches.jsx list
  getMatches: () => request("/matches"),

  // POST /api/matches/like/:id  ← ❤️ button
  likeUser: (id) => request(`/matches/like/${id}`, "POST"),

  // POST /api/matches/dislike/:id  ← ❌ button
  dislikeUser: (id) => request(`/matches/dislike/${id}`, "POST"),
};


// ════════════════════════════════════════════════════════
//  CHAT  →  /api/chat/...
// ════════════════════════════════════════════════════════
export const chatAPI = {

  // GET /api/chat/:userId  ← load messages in Chat.jsx
  getMessages: (userId) =>
    request(`/chat/${userId}`),

  // POST /api/chat/send  ← send message
  sendMessage: (receiverId, text, isBlindDate = false) =>
    request("/chat/send", "POST", {
      receiverId,
      text:        text?.trim(),
      isBlindDate,
    }),

  // DELETE /api/chat/:id  ← delete message
  deleteMessage: (id) =>
    request(`/chat/${id}`, "DELETE"),

  // PUT /api/chat/read/:userId  ← mark messages as read
  markAsRead: (userId) =>
    request(`/chat/read/${userId}`, "PUT"),

  // GET /api/chat/unread/count  ← unread badge on Matches
  getUnreadCount: () =>
    request("/chat/unread/count"),
};


// ════════════════════════════════════════════════════════
//  SELF NOTES  →  /api/chat/notes/...
// ════════════════════════════════════════════════════════
export const notesAPI = {

  // GET /api/chat/notes  ← SelfChat.jsx load
  getNotes: () => request("/chat/notes"),

  // POST /api/chat/notes  ← SelfChat.jsx send
  addNote: (text, time) =>
    request("/chat/notes", "POST", {
      text: text?.trim(),
      time,
    }),

  // DELETE /api/chat/notes/:id  ← SelfChat.jsx delete
  deleteNote: (id) =>
    request(`/chat/notes/${id}`, "DELETE"),
};


// ════════════════════════════════════════════════════════
//  COMMUNITY  →  /api/community/...
// ════════════════════════════════════════════════════════
export const communityAPI = {

  // GET /api/community?page=1  ← Community.jsx feed
  getPosts: (page = 1) =>
    request(`/community?page=${page}`),

  // POST /api/community  ← create post
  createPost: (text) =>
    request("/community", "POST", { text: text?.trim() }),

  // PUT /api/community/like/:id  ← toggle like
  likePost: (id) =>
    request(`/community/like/${id}`, "PUT"),

  // POST /api/community/comment/:id  ← add comment
  addComment: (id, text) =>
    request(`/community/comment/${id}`, "POST", {
      text: text?.trim(),
    }),

  // DELETE /api/community/:id  ← delete own post
  deletePost: (id) =>
    request(`/community/${id}`, "DELETE"),
};


// ════════════════════════════════════════════════════════
//  MARKETPLACE  →  /api/marketplace/...
// ════════════════════════════════════════════════════════
export const marketplaceAPI = {

  // GET /api/marketplace?search=...  ← product grid
  getProducts: (search = "") =>
    request(
      `/marketplace${search ? `?search=${encodeURIComponent(search)}` : ""}`
    ),

  // POST /api/marketplace/purchase/:id  ← buy product
  purchaseProduct: (id, name, message = "") =>
    request(`/marketplace/purchase/${id}`, "POST", {
      name:    name?.trim(),
      message: message?.trim(),
    }),

  // POST /api/marketplace  ← seller adds product
  addProduct: (data) =>
    request("/marketplace", "POST", {
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
  findMatch: () => request("/blind/match"),

  // POST /api/blind/upgrade  ← upgrade to premium
  upgradeToPremium: () =>
    request("/blind/upgrade", "POST").then(data => {
      localStorage.setItem("isPremium", "true");
      return data;
    }),

  // GET /api/blind/status  ← check if user is premium
  getPremiumStatus: () => request("/blind/status"),
};


// ════════════════════════════════════════════════════════
//  PREMIUM / PAYMENT  →  /api/premium/...
// ════════════════════════════════════════════════════════
export const premiumAPI = {

  // POST /api/premium/pay  ← start payment (Paystack/Stripe)
  pay: (amount = 9.99, currency = "USD") =>
    request("/premium/pay", "POST", { amount, currency }),

  // POST /api/premium/verify  ← verify after redirect
  verify: (reference) =>
    request("/premium/verify", "POST", { reference }),

  // GET /api/premium/status
  getStatus: () => request("/premium/status"),

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
  getProfile: (id) => request(`/users/${id}`),

  // PUT /api/users/profile  ← edit own profile
  updateProfile: (data) =>
    request("/users/profile", "PUT", {
      name:     data.name?.trim(),
      bio:      data.bio?.trim()      || "",
      age:      Number(data.age)      || undefined,
      location: data.location?.trim() || "",
      hobbies:  Array.isArray(data.hobbies) ? data.hobbies : [],
    }),

  // PUT /api/users/photo  ← update profile photo URL
  updatePhoto: (photoUrl) =>
    request("/users/photo", "PUT", { photo: photoUrl }),

  // PUT /api/users/online  ← update online status
  setOnlineStatus: (isOnline) =>
    request("/users/online", "PUT", { isOnline }),

  // DELETE /api/users/account  ← delete account
  deleteAccount: () =>
    request("/users/account", "DELETE").then(() => clearAuth()),
};