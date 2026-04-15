import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Matches.css";

export default function Matches() {
  const navigate = useNavigate();

  const [matches] = useState([
    {
      id: "self",
      name: "My Notes",
      image: "https://via.placeholder.com/300?text=Me",
      lastMessage: "Write something...",
      online: true,
      isSelf: true,
    },
    {
      id: 1,
      name: "Ama",
      age: 24,
      image: "https://via.placeholder.com/300",
      lastMessage: "Hey, how are you?",
      online: true,
    },
    {
      id: 2,
      name: "Kofi",
      age: 27,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s meet this weekend!",
      online: false,
    },
  ]);

  const openChat = (match) => {
    if (match.isSelf) {
      navigate("/self-chat");
    } else {
      navigate(`/chat/${match.id}`, { state: match });
    }
  };

  return (
    <div className="matches-container">
      <h1 className="matches-title">Messages</h1>

      <div className="matches-grid">
        {matches.map((match) => (
          <div key={match.id} className="match-card">

            <div className="match-image-wrapper">
              <img src={match.image} alt={match.name} />

              <span className={`status-dot ${match.online ? "online" : "offline"}`}></span>

              {match.isSelf && <span className="self-badge">You</span>}
            </div>

            <div className="match-info">
              <h2>
                {match.name}
                {match.age && `, ${match.age}`}
              </h2>

              <p className="last-message">
                {match.isSelf
                  ? match.lastMessage
                  : match.online
                  ? "Active now 🟢"
                  : match.lastMessage}
              </p>
            </div>

            {/* ✅ CLEAN CHAT BUTTON */}
            <button
              className="chat-btn"
              onClick={() => openChat(match)}
            >
              💬 {match.isSelf ? "Open Notes" : "Chat"}
            </button>

          </div>
        ))}
      </div>
    </div>
  );
}