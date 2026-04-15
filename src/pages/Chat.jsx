import { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import "./Chat.css";

export default function Chat() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ SAFE USER FALLBACK (prevents blank screen)
  const user = state?.match ?? {
    name: `User ${id}`,
    image: "https://via.placeholder.com/100",
  };

  // 🔥 GOVERNING RULES (CORE SYSTEM)
  const isPremium = state?.isPremium || false;
  const messageLimit = state?.messageLimit || 5;

  // 💬 STATE
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [locked, setLocked] = useState(false);

  const bottomRef = useRef(null);

  // 📌 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🚀 SEND MESSAGE (WITH RULE ENFORCEMENT)
  const sendMessage = () => {
    if (!input.trim()) return;

    // 🔒 RULE: block after limit if not premium
    if (!isPremium && messages.length >= messageLimit) {
      setLocked(true);
      return;
    }

    const newMessage = {
      id: Date.now(),
      text: input,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  // ⌨️ ENTER KEY SUPPORT
  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chat-container">

      {/* 🔹 HEADER */}
      <div className="chat-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ←
        </button>

        <img src={user.image} alt={user.name} />

        <div>
          <h3>{user.name}</h3>
          <span className="status-text">
            {isPremium ? "Premium Chat 🔓" : "Free Chat 🔒"}
          </span>
        </div>
      </div>

      {/* 🔹 CHAT BOX */}
      <div className="chat-box">

        {messages.length === 0 && (
          <p className="empty">Start your conversation 👋</p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="message my-message">
            <span>{msg.text}</span>
            <small>{msg.time}</small>
          </div>
        ))}

        {/* 🔒 LOCK WARNING */}
        {locked && !isPremium && (
          <div className="lock-warning">
            🔒 Message limit reached ({messageLimit} messages)
            <br />
            Upgrade to Premium to continue chatting 💳
          </div>
        )}

        <div ref={bottomRef}></div>
      </div>

      {/* 🔹 INPUT AREA */}
      <div className="chat-input">

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            locked && !isPremium
              ? "Upgrade to continue chatting..."
              : "Type a message..."
          }
          disabled={locked && !isPremium}
        />

        <button onClick={sendMessage}>
          Send
        </button>

      </div>

    </div>
  );
}