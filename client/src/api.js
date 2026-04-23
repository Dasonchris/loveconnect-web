// client/src/api.js

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Helper to get token ─────────────────────────────
const getToken = () => localStorage.getItem("token");

// ── Generic request handler ─────────────────────────
const request = async (endpoint, method = "GET", body = null) => {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    // Handle non-JSON responses safely
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(data?.message || `Request failed: ${res.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${method} ${endpoint}]:`, err.message);
    throw err;
  }
};

// ── Auth API ────────────────────────────────────────
export const authAPI = {
  register: (formData) =>
    request("/auth/register", "POST", formData),

  login: (formData) =>
    request("/auth/login", "POST", formData),
};

// ── Match API ───────────────────────────────────────
export const matchAPI = {
  // swipe users
  getUsers: () =>
    request("/users"),

  likeUser: (userId) =>
    request(`/users/${userId}/like`, "POST"),

  dislikeUser: (userId) =>
    request(`/users/${userId}/dislike`, "POST"),

  // ✅ FIX: matches endpoint
  getMatches: () =>
    request("/matches"),
};