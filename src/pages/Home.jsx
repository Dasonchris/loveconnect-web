import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  const [users, setUsers] = useState(
    Array.from({ length: 20 }, (_, i) => i + 1)
  );

  const [showPopup, setShowPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  // ❌ Remove card
  const handleDislike = (id) => {
    setUsers((prev) => prev.filter((u) => u !== id));
  };

  // ❤️ Like + open popup
  const handleLike = (id) => {
    setSelectedUser(id);
    setShowPopup(true);
  };

  // Close popup
  const closePopup = () => {
    setShowPopup(false);
  };

  // Handle input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 Register & go to chat
  const handleRegister = () => {
    if (!form.name || !form.email || !form.password) {
      alert("Please fill all fields");
      return;
    }

    // optional: store user info
    localStorage.setItem("userInfo", JSON.stringify(form));

    // remove card after like
    setUsers((prev) => prev.filter((u) => u !== selectedUser));

    // go to chat page
    navigate(`/chat/${selectedUser}`);
  };

  return (
    <>
      <div className="container">
        {users.slice(0, 6).map((u) => (
          <div key={u} className="card">
            <img
              src={`https://via.placeholder.com/300?text=User+${u}`}
              alt={`User ${u}`}
            />

            <h2>User {u}</h2>
            <p>Loves music & vibes</p>

            <div className="actions">
              <button
                className="dislike"
                onClick={() => handleDislike(u)}
              >
                ❌
              </button>

              <button
                className="like"
                onClick={() => handleLike(u)}
              >
                ❤️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* POPUP */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Register to chat with User {selectedUser}</h2>

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              onChange={handleChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Create password"
              onChange={handleChange}
            />

            <button className="register-btn" onClick={handleRegister}>
              Register & Chat
            </button>

            <button className="close-btn" onClick={closePopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}