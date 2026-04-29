// client/src/pages/Chat.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { chatAPI } from "../api";           // ← fix: was matchAPI
import "./Chat.css";

// ── Phone number detection ───────────────────────────
const PHONE_REGEX = /(\+?[\d\s\-().]{7,15}\d)/g;
const containsPhone  = (text) => PHONE_REGEX.test(text);
const maskNumbers    = (text) => text.replace(PHONE_REGEX, "📵 [Number Hidden]");

export default function Chat() {
  const { state }  = useLocation();
  const { id }     = useParams();
  const navigate   = useNavigate();

  // ── Derive user info safely ──────────────────────────
  const user         = state?.match ?? state ?? { name: `User ${id}`, photo: "" };
  const isPremium    = state?.isPremium    || localStorage.getItem("isPremium") === "true";
  const messageLimit = state?.messageLimit || 5;
  const isBlindDate  = state?.isBlindDate  || false;

  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState("");
  const [locked,       setLocked]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [phoneWarning, setPhoneWarning] = useState(false);
  const [showPaywall,  setShowPaywall]  = useState(false);
  const [sendError,    setSendError]    = useState("");

  const bottomRef = useRef(null);

  // ── Load messages ────────────────────────────────────
  useEffect(() => {
    chatAPI.getMessages(id)
      .then(data => {
        setMessages(data);
        if (!isPremium && isBlindDate && data.length >= messageLimit) {
          setLocked(true);
        }
      })
      .catch(err => {
        console.error("Failed to load messages:", err);
        // Fallback to empty — don't crash
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Auto scroll ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ─────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim()) return;
    setSendError("");

    // Check message limit for blind date free users
    if (!isPremium && isBlindDate && messages.length >= messageLimit) {
      setLocked(true);
      setShowPaywall(true);
      return;
    }

    // Block phone numbers in blind date
    if (isBlindDate && containsPhone(input)) {
      setPhoneWarning(true);
      setTimeout(() => setPhoneWarning(false), 3000);
      return;
    }

    // Mask numbers even for premium (safety)
    const safeText = isBlindDate ? maskNumbers(input) : input;

    try {
      const msg = await chatAPI.sendMessage(id, safeText, isBlindDate);
      setMessages(prev => [...prev, msg]);
      setInput("");

      // Lock after hitting limit
      if (!isPremium && isBlindDate && messages.length + 1 >= messageLimit) {
        setLocked(true);
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes("limit")) {
        setLocked(true);
        setShowPaywall(true);
      } else {
        setSendError(err.message || "Failed to send message");
      }
      console.error(err);
    }
  };

  // ── Delete message ───────────────────────────────────
  const deleteMessage = async (msgId) => {
    try {
      await chatAPI.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m._id !== msgId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const handleUpgrade = () => {
    setShowPaywall(false);
    navigate("/blind");
  };

  // ────────────────────────────────────────────────────
  return (
    <div className="chat-container">

      {/* ── Header ── */}
      <div className="chat-header">
        <button onClick={() => navigate(-1)} className="back-btn">←</button>

        <img
          src={
            user.photo ||
            `https://ui-avatars.com/api/?name=${user.name}&background=ff4d6d&color=fff`
          }
          alt={user.name}
          onError={e => {
            e.target.src = `https://ui-avatars.com/api/?name=${user.name}&background=ff4d6d&color=fff`;
          }}
        />

        <div className="header-info">
          <h3>{user.name}</h3>
          <span className="status-text">
            {isPremium
              ? "Premium Chat ✨"
              : isBlindDate
              ? `Free: ${messages.length}/${messageLimit} msgs 🔒`
              : "Chat 💬"}
          </span>
        </div>

        {isPremium && (
          <span className="chat-premium-badge">✨ Premium</span>
        )}
      </div>

      {/* ── Chat Box ── */}
      <div className="chat-box">

        {/* Loading */}
        {loading && <p className="empty">Loading messages...</p>}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <p className="empty">Start your conversation 👋</p>
        )}

        {/* Messages */}
        {messages.map(msg => (
          <div key={msg._id || msg.id} className="message my-message">
            <span className="message-text">{msg.text}</span>
            <div className="message-footer">
              <small>
                {msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour:   "2-digit",
                      minute: "2-digit",
                    })
                  : msg.time || ""}
              </small>
              <button
                className="delete-btn"
                onClick={() => deleteMessage(msg._id)}
                aria-label="Delete message"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {/* Phone warning */}
        {phoneWarning && (
          <div className="phone-warning">
            📵 Phone numbers are not allowed in blind date chats
          </div>
        )}

        {/* Send error */}
        {sendError && (
          <div className="send-error">
            ⚠️ {sendError}
          </div>
        )}

        {/* Locked warning */}
        {locked && !isPremium && (
          <div className="lock-warning">
            <p>🔒 You've used all <b>{messageLimit}</b> free messages</p>
            <button
              className="upgrade-inline-btn"
              onClick={() => setShowPaywall(true)}
            >
              ✨ Upgrade to Premium
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input Area ── */}
      <div className="chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            locked && !isPremium
              ? "Upgrade to keep chatting..."
              : isBlindDate
              ? "Type a message... (no phone numbers)"
              : "Type a message..."
          }
          disabled={locked && !isPremium}
        />
        <button
          onClick={sendMessage}
          disabled={locked && !isPremium}
        >
          Send
        </button>
      </div>

      {/* ══ PAYWALL MODAL ══ */}
      {showPaywall && (
        <div
          className="paywall-overlay"
          onClick={() => setShowPaywall(false)}
        >
          <div
            className="paywall-box"
            onClick={e => e.stopPropagation()}
          >
            <div className="paywall-icon">🔒</div>

            <h2>Free Limit Reached</h2>

            <p className="paywall-sub">
              You've used all <b>{messageLimit}</b> free messages.
              Upgrade to keep chatting!
            </p>

            <ul className="paywall-features">
              <li>✅ Unlimited messages</li>
              <li>✅ Reveal match identity</li>
              <li>✅ Priority matching</li>
              <li>🚫 Phone numbers blocked for safety</li>
            </ul>

            <div className="paywall-price">
              <span className="price-amount">$9.99</span>
              <span className="price-period">/ month</span>
            </div>

            <button
              className="paywall-upgrade-btn"
              onClick={handleUpgrade}
            >
              ✨ Upgrade Now
            </button>

            <button
              className="paywall-cancel-btn"
              onClick={() => setShowPaywall(false)}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

    </div>
  );
}