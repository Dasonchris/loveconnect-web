import { useState, useEffect, useRef } from "react";
import "./SelfChat.css";

export default function SelfChat() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("selfMessages");
    return saved ? JSON.parse(saved) : [];
  });

  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // Save messages
  useEffect(() => {
    localStorage.setItem("selfMessages", JSON.stringify(messages));
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

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

  const deleteMessage = (id) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chat-container">
      <h2 className="chat-title">My Notes 📝</h2>

      <div className="chat-box">
        {messages.length === 0 ? (
          <p className="empty">No notes yet...</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="message">
              <div className="message-text">{msg.text}</div>
              <div className="message-footer">
                <small>{msg.time}</small>
                <button onClick={() => deleteMessage(msg.id)}>🗑️</button>
              </div>
            </div>
          ))
        )}

        <div ref={bottomRef}></div>
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Write something..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}