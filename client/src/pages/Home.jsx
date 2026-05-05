// client/src/pages/Home.jsx
import { useState, useEffect }          from "react";
import { useNavigate }                  from "react-router-dom";
import { matchAPI, authAPI, saveSession, isLoggedIn } from "../api";
import "./Home.css";

// ── Static users ─────────────────────────────────────
const DUMMY_USERS = [
  { _id: 1,  name: "Ama",    age: 24, bio: "Sunset chaser & deep talker 🌅",          photo: "", hobbies: ["Hiking","Photography","Yoga"],    location: "Accra, GH"      },
  { _id: 2,  name: "Kofi",   age: 27, bio: "Foodie on a mission to eat everything 🍕", photo: "", hobbies: ["Cooking","Football","Travel"],     location: "Kumasi, GH"     },
  { _id: 3,  name: "Sofia",  age: 23, bio: "Art, coffee & good vibes only ☕🎨",       photo: "", hobbies: ["Painting","Reading","Dancing"],    location: "Takoradi, GH"   },
  { _id: 4,  name: "Kwame",  age: 30, bio: "Music producer by night, bookworm by day 🎧📚", photo: "", hobbies: ["Music","Reading","Gaming"], location: "Accra, GH"      },
  { _id: 5,  name: "Layla",  age: 26, bio: "Traveller collecting passport stamps ✈️",  photo: "", hobbies: ["Travel","Yoga","Cooking"],        location: "Tema, GH"       },
  { _id: 6,  name: "Ethan",  age: 28, bio: "Dog dad & gym enthusiast 🐶💪",            photo: "", hobbies: ["Gym","Hiking","Football"],         location: "Accra, GH"      },
  { _id: 7,  name: "Zara",   age: 22, bio: "Fashion lover & late-night movie person 🎬👗", photo: "", hobbies: ["Fashion","Movies","Dancing"], location: "Kumasi, GH"     },
  { _id: 8,  name: "Marcus", age: 29, bio: "Chef in training & beach bum 🍳🏖️",       photo: "", hobbies: ["Cooking","Swimming","Travel"],    location: "Cape Coast, GH" },
  { _id: 9,  name: "Nina",   age: 25, bio: "Plants, tea & cozy vibes 🌿🍵",            photo: "", hobbies: ["Gardening","Reading","Yoga"],     location: "Accra, GH"      },
  { _id: 10, name: "David",  age: 31, bio: "Gamer & amateur photographer 📷🎮",        photo: "", hobbies: ["Gaming","Photography","Music"],   location: "Tema, GH"       },
  { _id: 11, name: "Abena",  age: 24, bio: "Dancer with a love for Afrobeats 💃🎶",   photo: "", hobbies: ["Dancing","Music","Travel"],        location: "Accra, GH"      },
  { _id: 12, name: "Yaw",    age: 26, bio: "Tech guy who also loves nature 💻🌿",      photo: "", hobbies: ["Coding","Hiking","Gaming"],        location: "Kumasi, GH"     },
];

const HOBBY_COLORS = {
  Hiking: "#dcf8c6", Photography: "#fde68a", Yoga: "#ddd6fe",
  Cooking: "#fed7aa", Football: "#bbf7d0",  Travel: "#bfdbfe",
  Painting: "#fecaca", Reading: "#e9d5ff",  Dancing: "#fbcfe8",
  Music: "#a5f3fc",  Gaming: "#d1fae5",     Gym: "#fee2e2",
  Fashion: "#fce7f3", Movies: "#e0e7ff",    Swimming: "#cffafe",
  Gardening: "#d1fae5", Coding: "#ede9fe",
};

export default function Home() {
  const navigate = useNavigate();

  const [users,        setUsers]        = useState([]);
  const [showPopup,    setShowPopup]    = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [errors,       setErrors]       = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [likedCards,   setLikedCards]   = useState([]);
  const [matchPopup,   setMatchPopup]   = useState(null);  // shows "It's a match!" screen
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dateOfBirth: "",
    occupation: "",
  });

  // Debug: Log current auth state
  useEffect(() => {
    console.log("🔐 Auth state check:");
    console.log("  Token:", localStorage.getItem("token") ? "✅ Found" : "❌ Not found");
    console.log("  isLoggedIn():", isLoggedIn());
  }, []);

  // ── Load users ───────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!isLoggedIn()) {
        setUsers(DUMMY_USERS);
        setLoading(false);
        return;
      }
      try {
        const data    = await matchAPI.getUsers();
        const list    = data.users || data || [];
        const enriched = list.map((u, i) => ({
          ...u,
          hobbies:  u.hobbies  || DUMMY_USERS[i % DUMMY_USERS.length].hobbies,
          location: u.location || DUMMY_USERS[i % DUMMY_USERS.length].location,
        }));
        setUsers(enriched.length ? enriched : DUMMY_USERS);
      } catch {
        setUsers(DUMMY_USERS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Like button ──────────────────────────────────────
  const handleLike = async (user) => {
    console.log("❤️ Like clicked for:", user.name);
    console.log("Is logged in?", isLoggedIn());
    
    setSelectedUser(user);
    setLikedCards(prev => [...prev, user._id]);

    // Not logged in → show register popup
    if (!isLoggedIn()) {
      console.log("Not logged in - showing popup");
      setShowPopup(true);  // Remove setTimeout for immediate display
      return;
    }

    // Already logged in → like directly
    try {
      const res = await matchAPI.likeUser(user._id);

      // Remove card from view
      setTimeout(() => {
        setUsers(prev => prev.filter(u => u._id !== user._id));
        setLikedCards(prev => prev.filter(id => id !== user._id));
      }, 400);

      // Mutual match found → open chat immediately
      if (res.match) {
        navigate(`/chat/${user._id}`, { state: user });
        return;
      }
    } catch (err) {
      console.error("Like error:", err);
      setLikedCards(prev => prev.filter(id => id !== user._id));
    }
  };

  // ── Dislike button ───────────────────────────────────
  const handleDislike = async (id) => {
    setUsers(prev => prev.filter(u => u._id !== id));
    if (isLoggedIn()) {
      matchAPI.dislikeUser(id).catch(console.error);
    }
  };

  // ── Form input change ────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // ── Validate form ────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())                        e.name        = "Name is required";
    if (!form.email.trim())                       e.email       = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))   e.email       = "Invalid email";
    if (!form.password)                           e.password    = "Password is required";
    else if (form.password.length < 6)            e.password    = "Min 6 characters";
    if (!form.dateOfBirth)                        e.dateOfBirth = "Date of birth is required";
    else {
      const dob = new Date(form.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear() - (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
      if (Number.isNaN(dob.getTime()))           e.dateOfBirth = "Invalid date";
      else if (age < 18)                         e.dateOfBirth = "You must be at least 18 years old";
    }
    if (!form.occupation.trim())                  e.occupation  = "Occupation is required";
    return e;
  };

  // ── Register then like then navigate ─────────────────
  const handleRegister = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSubmitting(true);
    try {
      // 1️⃣ Register user
      const data = await authAPI.register(form);

      // 2️⃣ Save token + user info
      saveSession(data.token, data.user);

      // 3️⃣ Like the selected user now that we have a token
      let isMatch = false;
      if (selectedUser?._id) {
        try {
          const likeRes = await matchAPI.likeUser(selectedUser._id);
          isMatch = likeRes?.match || false;
        } catch (likeErr) {
          console.error("Like after register failed:", likeErr);
        }
      }

      // 4️⃣ Remove card from home grid
      setUsers(prev => prev.filter(u => u._id !== selectedUser?._id));
      setLikedCards(prev => prev.filter(id => id !== selectedUser?._id));

      // 5️⃣ Close register popup
      setShowPopup(false);
      setForm({ name: "", email: "", password: "", dateOfBirth: "", occupation: "" });

      // 6️⃣ Show match popup or go to matches
      if (isMatch) {
        navigate(`/chat/${selectedUser._id}`, { state: selectedUser });
        return;
      }

      // Show success then redirect to matches
      setMatchPopup({ ...selectedUser, pendingMatch: true });

    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Close register popup ─────────────────────────────
  const closePopup = () => {
    setShowPopup(false);
    setErrors({});
    setForm({ name: "", email: "", password: "", dateOfBirth: "", occupation: "" });
    setLikedCards(prev => prev.filter(id => id !== selectedUser?._id));
  };

  // ── Go to Matches page ───────────────────────────────
  const goToMatches = () => {
    setMatchPopup(null);
    navigate("/matches");
  };

  // ── Go to Chat with this match ───────────────────────
  const goToChat = () => {
    setMatchPopup(null);
    navigate(`/chat/${matchPopup._id}`, { state: matchPopup });
  };

  // ─────────────────────────────────────────────────────
  if (loading) return (
    <div className="container loading-screen">
      <div className="loading-spinner" />
      <p>Finding people near you...</p>
    </div>
  );

  return (
    <>
      {/* ══ CARD GRID ══ */}
      <div className="container">
        {users.length === 0 ? (
          <div className="no-users">
            <p>😔 No more profiles to show</p>
            <button onClick={() => setUsers(DUMMY_USERS)}>Refresh ↺</button>
          </div>
        ) : (
          users.slice(0, 6).map(user => (
            <div
              key={user._id}
              className={`card ${likedCards.includes(user._id) ? "card-liked" : ""}`}
            >
              {/* Image */}
              <div className="card-img-wrapper">
                <img
                  src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=ff4d6d&color=fff&size=300`}
                  alt={user.name}
                  onError={e => {
                    e.target.src = `https://ui-avatars.com/api/?name=${user.name}&background=ff4d6d&color=fff&size=300`;
                  }}
                />
                <div className="card-img-overlay">
                  <span className="card-name-overlay">{user.name}</span>
                  {user.location && (
                    <span className="card-location">📍 {user.location}</span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="card-body">
                <div className="card-top">
                  <h2>
                    {user.name}
                    {user.age && <span className="card-age">, {user.age}</span>}
                  </h2>
                </div>
                <p className="card-bio">{user.bio}</p>

                {/* Hobby Tags */}
                {user.hobbies?.length > 0 && (
                  <div className="hobby-tags">
                    {user.hobbies.map(hobby => (
                      <span
                        key={hobby}
                        className="hobby-tag"
                        style={{ background: HOBBY_COLORS[hobby] || "#f3f4f6" }}
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="actions">
                <button
                  className="dislike"
                  onClick={() => handleDislike(user._id)}
                  aria-label="Dislike"
                >❌</button>
                <button
                  className="like"
                  onClick={() => handleLike(user)}
                  aria-label="Like"
                >❤️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ══ REGISTER POPUP ══ */}
      {showPopup && selectedUser && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup" onClick={e => e.stopPropagation()}>

            {/* Avatar */}
            <div className="popup-avatar-wrapper">
              <img
                src={selectedUser.photo || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=ff4d6d&color=fff&size=120`}
                alt={selectedUser.name}
                className="popup-avatar"
                onError={e => {
                  e.target.src = `https://ui-avatars.com/api/?name=${selectedUser.name}&background=ff4d6d&color=fff&size=120`;
                }}
              />
            </div>

            <h2>
              You liked <span className="popup-name">{selectedUser.name}</span>! 🎉
            </h2>
            <p className="popup-sub">
              Create a free account to match & chat 💬
            </p>

            {/* Their hobbies */}
            {selectedUser.hobbies?.length > 0 && (
              <div className="hobby-tags popup-hobbies">
                {selectedUser.hobbies.map(hobby => (
                  <span
                    key={hobby}
                    className="hobby-tag"
                    style={{ background: HOBBY_COLORS[hobby] || "#f3f4f6" }}
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            )}

            {/* What happens after */}
            <div className="register-steps">
              <div className="register-step">
                <span className="step-icon">✅</span>
                <span>Your like is saved</span>
              </div>
              <div className="register-step">
                <span className="step-icon">💘</span>
                <span>If they like back — it's a match!</span>
              </div>
              <div className="register-step">
                <span className="step-icon">💬</span>
                <span>You'll appear in their Matches</span>
              </div>
            </div>

            {/* General error */}
            {errors.general && (
              <p className="error-msg general">{errors.general}</p>
            )}

            {/* Name */}
            <div className="input-group">
              <input
                name="name"
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && <span className="error-msg">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="input-group">
              <input
                name="email"
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <span className="error-msg">{errors.email}</span>}
            </div>

            {/* Occupation */}
            <div className="input-group">
              <input
                name="occupation"
                type="text"
                placeholder="Your occupation"
                value={form.occupation}
                onChange={handleChange}
                className={errors.occupation ? "input-error" : ""}
              />
              {errors.occupation && <span className="error-msg">{errors.occupation}</span>}
            </div>

            {/* Date of birth */}
            <div className="input-group">
              <input
                name="dateOfBirth"
                type="date"
                placeholder="Date of birth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className={errors.dateOfBirth ? "input-error" : ""}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.dateOfBirth && <span className="error-msg">{errors.dateOfBirth}</span>}
            </div>

            {/* Password of user*/}
            <div className="input-group">
              <input
                name="password"
                type="password"
                placeholder="Create password (min 6)"
                value={form.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
              />
              {errors.password && <span className="error-msg">{errors.password}</span>}
            </div>

            <button
              className="register-btn"
              onClick={handleRegister}
              disabled={submitting}
            >
              {submitting ? (
                <span className="btn-loading">
                  <span className="btn-spinner" /> Registering...
                </span>
              ) : (
                "Register & Send Like 💌"
              )}
            </button>

            <button className="close-btn" onClick={closePopup}>
              Maybe Later
            </button>

          </div>
        </div>
      )}

      {/* ══ MATCH / LIKED CONFIRMATION POPUP ══ */}
      {matchPopup && (
        <div className="popup-overlay" onClick={() => setMatchPopup(null)}>
          <div className="popup match-result-popup" onClick={e => e.stopPropagation()}>

            {matchPopup.pendingMatch ? (
              // ── Liked but not yet mutual ──────────────
              <>
                <div className="match-result-icon">💌</div>
                <h2>Like Sent!</h2>
                <p className="popup-sub">
                  Your like has been sent to{" "}
                  <span className="popup-name">{matchPopup.name}</span>.
                  <br />
                  If they like you back — it's a match! 🎉
                </p>

                <div className="match-result-avatar">
                  <img
                    src={matchPopup.photo || `https://ui-avatars.com/api/?name=${matchPopup.name}&background=ff4d6d&color=fff`}
                    alt={matchPopup.name}
                  />
                  <div className="match-result-status pending">Pending ⏳</div>
                </div>

                <button className="register-btn" onClick={goToMatches}>
                  View My Matches 💞
                </button>
                <button className="close-btn" onClick={() => setMatchPopup(null)}>
                  Keep Swiping
                </button>
              </>
            ) : (
              // ── Mutual match! ─────────────────────────
              <>
                <div className="match-result-icon">💘</div>
                <h2 className="match-title">It's a Match!</h2>
                <p className="popup-sub">
                  You and <span className="popup-name">{matchPopup.name}</span> liked
                  each other 🎉
                </p>

                <div className="match-result-avatar">
                  <img
                    src={matchPopup.photo || `https://ui-avatars.com/api/?name=${matchPopup.name}&background=ff4d6d&color=fff`}
                    alt={matchPopup.name}
                  />
                  <div className="match-result-status matched">Matched ✅</div>
                </div>

                {/* Their hobbies */}
                {matchPopup.hobbies?.length > 0 && (
                  <div className="hobby-tags popup-hobbies">
                    {matchPopup.hobbies.map(hobby => (
                      <span
                        key={hobby}
                        className="hobby-tag"
                        style={{ background: HOBBY_COLORS[hobby] || "#f3f4f6" }}
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                )}

                <button className="register-btn" onClick={goToChat}>
                  Start Chatting 💬
                </button>
                <button className="close-btn" onClick={goToMatches}>
                  See All Matches 💞
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}