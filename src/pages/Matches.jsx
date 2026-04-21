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
        {
      id: 3,
      name: "Kwame",
      age: 30,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s have fun tonight!",
      online: false,
    },
            {
      id: 4,
      name: "Kwabena",
      age: 35,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s go to church!",
      online: true,
    },

            {
      id: 5,
      name: "Kwabenya",
      age: 39,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s do things!",
      online: false,
    },

      {
      id: 6,
      name: "Kwabenya",
      age: 20,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s do movie night!",
      online: true,
      },

            {
      id: 7,
      name: "Korsi",
      age: 22,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s do movie night!",
      online: true,
      },
            {
      id: 7,
      name: "Kwabenya",
      age: 25,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s do movie night!",
      online: false,
      },
            {
      id: 8,
      name: "Kwabenya",
      age: 28,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s do movie night!",
      online: true,
      },

      // extra five
            {
      id: 9,
      name: "Kordzo",
      age: 20,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s do movie night!",
      online: true,
      },
            {
      id: 10,
      name: "Kweku",
      age: 20,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s do movie night!",
      online: true,
      },
            {
      id: 11,
      name: "Kobby",
      age: 20,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s do movie night!",
      online: true,
      },
            {
      id: 12,
      name: "Kelvin",
      age: 21,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s do movie night!",
      online: true,
      },
            {
      id: 13,
      name: "Kwesi",
      age: 26,
      image: "https://via.placeholder.com/300",
      lastMessage: "Let’s do movie night!",
      online: false,
      }
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