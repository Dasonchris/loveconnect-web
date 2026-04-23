// client/src/pages/Chat.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { matchAPI } from "../api";
import "./Chat.css";

export default function Chat() {
  const { state }  = useLocation();
  const { id }     = useParams();
  const navigate   = useNavigate();

  const user         = state ?? { name: `User ${id}`, photo: '' };
  const isPremium    = state?.isPremium    || false;
  const messageLimit = state?.messageLimit || 5;

  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [locked,   setLocked]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const bottomRef  = useRef(null);

  // Load existing messages
  useEffect(() => {
    matchAPI.getMessages(id)
      .then(data => {
        setMessages(data);
        if (!isPremium && data.length >= messageLimit) setLocked(true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!isPremium && messages.length >= messageLimit) {
      setLocked(true);
      return;
    }

    try {
      const isBlindDate = state?.match?.isBlindDate || false;
      const msg = await matchAPI.sendMessage(id, input, isBlindDate);
      setMessages(prev => [...prev, msg]);
      setInput('');

      if (!isPremium && messages.length + 1 >= messageLimit) {
        setLocked(true);
      }
    } catch (err) {
      if (err.message.includes('limit')) setLocked(true);
      console.error(err);
    }
  };

  const deleteMessage = async (msgId) => {
    try {
      await matchAPI.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={() => navigate(-1)} className="back-btn">←</button>
        <img
          src={user.photo || `https://ui-avatars.com/api/?name=${user.name}&background=ff4d6d&color=fff`}
          alt={user.name}
        />
        <div>
          <h3>{user.name}</h3>
          <span className="status-text">
            {isPremium ? 'Premium Chat 🔓' : `Free Chat (${messages.length}/${messageLimit}) 🔒`}
          </span>
        </div>
      </div>

      <div className="chat-box">
        {loading && <p className="empty">Loading messages...</p>}

        {!loading && messages.length === 0 && (
          <p className="empty">Start your conversation 👋</p>
        )}

        {messages.map((msg) => (
          <div key={msg._id} className="message my-message">
            <span>{msg.text}</span>
            <div className="message-footer">
              <small>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
              <button onClick={() => deleteMessage(msg._id)}>🗑️</button>
            </div>
          </div>
        ))}

        {locked && !isPremium && (
          <div className="lock-warning">
            🔒 Message limit reached ({messageLimit} messages)
            <br />Upgrade to Premium to continue 💳
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={locked ? 'Upgrade to continue...' : 'Type a message...'}
          disabled={locked && !isPremium}
        />
        <button onClick={sendMessage} disabled={locked && !isPremium}>
          Send
        </button>
      </div>
    </div>
  );
}