// client/src/pages/Home.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { matchAPI, authAPI } from "../api";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // ── Load users ───────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");

    const dummyUsers = Array.from({ length: 6 }, (_, i) => ({
      _id: i + 1,
      name: `User ${i + 1}`,
      bio: "Loves music & good vibes",
      photo: "",
    }));

    const loadUsers = async () => {
      if (!token) {
        setUsers(dummyUsers);
        setLoading(false);
        return;
      }

      try {
        const data = await matchAPI.getUsers();
        setUsers(data.users || data || []);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setUsers(dummyUsers);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // ── LIKE USER (FIXED CORE LOGIC) ─────────────
  const handleLike = async (user) => {
    const token = localStorage.getItem("token");
    setSelectedUser(user);

    // Not logged in → register popup
    if (!token) {
      setShowPopup(true);
      return;
    }

    try {
      const res = await matchAPI.likeUser(user._id);

      // remove user from UI
      setUsers((prev) => prev.filter((u) => u._id !== user._id));

      // 🔥 MATCH FOUND
      if (res.match) {
        alert("💘 It's a match!");

        navigate(`/chat/${user._id}`, { state: user });
      }

    } catch (err) {
      console.error("Like error:", err);
    }
  };

  // ── DISLIKE ───────────────────────────────────
  const handleDislike = async (id) => {
    setUsers((prev) => prev.filter((u) => u._id !== id));

    const token = localStorage.getItem("token");
    if (token) {
      await matchAPI.dislikeUser(id).catch(console.error);
    }
  };

  // ── REGISTER ──────────────────────────────────
  const handleRegister = async () => {
    const e = {};
    if (!form.name) e.name = "Name required";
    if (!form.email) e.email = "Email required";
    if (!form.password) e.password = "Password required";

    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    try {
      const data = await authAPI.register(form);

      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data.user));

      setShowPopup(false);

      // 🔥 After register → auto-like selected user
      if (selectedUser?._id) {
        const res = await matchAPI.likeUser(selectedUser._id);

        setUsers((prev) =>
          prev.filter((u) => u._id !== selectedUser._id)
        );

        if (res.match) {
          alert("💘 It's a match!");
        }

        navigate(`/chat/${selectedUser._id}`, {
          state: selectedUser,
        });
      }

    } catch (err) {
      console.error(err);
      setErrors({ general: err.message });
    }
  };

  // ── INPUT CHANGE ──────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  if (loading)
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );

  return (
    <>
      <div className="container">
        {users.slice(0, 6).map((user) => (
          <div key={user._id} className="card">
            <img
              src={
                user.photo ||
                `https://ui-avatars.com/api/?name=${user.name}&background=ff4d6d&color=fff&size=300`
              }
              alt={user.name}
            />

            <h2>{user.name}</h2>
            <p>{user.bio}</p>

            <div className="actions">
              <button onClick={() => handleDislike(user._id)}>
                ❌
              </button>

              <button onClick={() => handleLike(user)}>
                ❤️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* REGISTER POPUP */}
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <h2>Register to continue 💬</h2>

            <input
              name="name"
              placeholder="Name"
              onChange={handleChange}
            />
            {errors.name && <p>{errors.name}</p>}

            <input
              name="email"
              placeholder="Email"
              onChange={handleChange}
            />
            {errors.email && <p>{errors.email}</p>}

            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
            />
            {errors.password && <p>{errors.password}</p>}

            <button onClick={handleRegister}>
              Register & Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
}