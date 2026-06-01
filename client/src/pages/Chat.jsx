// client/src/pages/Chat.jsx
import { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { chatAPI, blindAPI } from "../api";
import "./Chat.css";

// ── Phone number detection ───────────────────────────
const PHONE_REGEX = /(\+?[\d\s\-().]{7,15}\d)/g;
const containsPhone  = (text) => PHONE_REGEX.test(text);
const maskNumbers    = (text) => text.replace(PHONE_REGEX, "📵 [Number Hidden]");

export default function Chat() {
  const { state }  = useLocation();
  const { id }     = useParams();
  const navigate   = useNavigate();

  const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(value);

  // ── Derive user info safely ──────────────────────────
  const user         = state?.match ?? state ?? { name: `User ${id}`, photo: "" };
  const isPremium    = state?.isPremium    || localStorage.getItem("isPremium") === "true";
  const isBlindDate  = state?.isBlindDate  || false;
  const messageLimit = state?.messageLimit ?? (isBlindDate ? 6 : 5);

  const [messages,       setMessages]       = useState([]);
  const [input,          setInput]          = useState("");
  const [locked,         setLocked]         = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [phoneWarning,   setPhoneWarning]   = useState(false);
  const [showPaywall,    setShowPaywall]    = useState(false);
  const [paymentMethod,  setPaymentMethod]  = useState("momo");
  const [paymentProvider,setPaymentProvider]= useState("MTN");
  const [paymentAccount, setPaymentAccount] = useState("0598580995");
  const [paymentName,    setPaymentName]    = useState("");
  const [paymentError,   setPaymentError]   = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [sendError,      setSendError]      = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);

  const bottomRef = useRef(null);
  const emojis = ["❤️", "😂", "😮", "😢", "😡", "🔥", "👍", "🎉"];

  // ── Load messages ────────────────────────────────────
  useEffect(() => {
    if (!isValidObjectId(id)) {
      setSendError("Invalid chat session. Please go back and try again.");
      setLoading(false);
      return;
    }

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
  }, [id, isBlindDate, isPremium, messageLimit]);

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

  // ── Add reaction to message ──────────────────────────
  const addMessageReaction = async (msgId, emoji) => {
    try {
      await chatAPI.addReaction(msgId, emoji);
      const data = await chatAPI.getMessages(id);
      setMessages(data);
      setShowEmojiPicker(null);
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const submitPayment = async () => {
    setPaymentError("");
    if (!paymentAccount.trim() || !paymentName.trim()) {
      setPaymentError("Enter your payment account and account name.");
      return;
    }

    setPaymentLoading(true);
    try {
      await blindAPI.upgradeToPremium({
        method:      paymentMethod,
        provider:    paymentProvider,
        account:     paymentAccount.trim(),
        accountName: paymentName.trim(),
      });
      localStorage.setItem("isPremium", "true");
      setLocked(false);
      setShowPaywall(false);
    } catch (err) {
      setPaymentError(err.message || "Payment failed. Please try again.");
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
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
            <div className="message-content">
              <span className="message-text">{msg.text}</span>
              {msg.photos && msg.photos.length > 0 && (
                <div className="message-photos">
                  {msg.photos.map((photo, idx) => (
                    <img key={idx} src={photo} alt={`msg-${idx}`} />
                  ))}
                </div>
              )}
            </div>

            {msg.reactions && msg.reactions.length > 0 && (
              <div className="message-reactions">
                {msg.reactions.map((reaction, idx) => (
                  <span key={idx} className="reaction">
                    {reaction.emoji}
                  </span>
                ))}
              </div>
            )}

            <div className="message-footer">
              <small>
                {msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour:   "2-digit",
                      minute: "2-digit",
                    })
                  : msg.time || ""}
              </small>

              <div className="message-actions">
                <button
                  className="emoji-trigger"
                  onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                >
                  😊
                </button>

                {showEmojiPicker === msg._id && (
                  <div className="emoji-picker-popup">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        className="emoji-choice"
                        onClick={() => addMessageReaction(msg._id, emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  className="delete-btn"
                  onClick={() => deleteMessage(msg._id)}
                  aria-label="Delete message"
                >
                  🗑️
                </button>
              </div>
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

            <div className="paywall-tabs">
              <button
                className={paymentMethod === "momo" ? "pay-tab active" : "pay-tab"}
                onClick={() => {
                  setPaymentMethod("momo");
                  setPaymentAccount("0598580995");
                }}
                disabled={paymentLoading}
              >
                Mobile Money
              </button>
              <button
                className={paymentMethod === "bank" ? "pay-tab active" : "pay-tab"}
                onClick={() => {
                  setPaymentMethod("bank");
                  setPaymentAccount("12345567890123");
                }}
                disabled={paymentLoading}
              >
                Bank Transfer
              </button>
            </div>

            <div className="payment-fields">
              {paymentMethod === "momo" ? (
                <label>
                  Network
                  <select
                    value={paymentProvider}
                    onChange={e => setPaymentProvider(e.target.value)}
                  >
                    <option value="MTN">MTN Mobile Money</option>
                    <option value="Vodafone">Vodafone Cash</option>
                    <option value="AirtelTigo">AirtelTigo Money</option>
                    <option value="Orange">Orange Money</option>
                  </select>
                </label>
              ) : (
                <label>
                  Bank Name
                  <select
                    value={paymentProvider}
                    onChange={e => setPaymentProvider(e.target.value)}
                  >
                    <option value="Access Bank">Access Bank</option>
                    <option value="GCB Bank">GCB Bank</option>
                    <option value="Ecobank">Ecobank</option>
                    <option value="Stanbic Bank">Stanbic Bank</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                  </select>
                </label>
              )}

              <label>
                {paymentMethod === "momo" ? "Phone Number" : "Account Number"}
                <input
                  value={paymentAccount}
                  onChange={e => setPaymentAccount(e.target.value)}
                  placeholder={paymentMethod === "momo" ? "0598580995" : "12345567890123"}
                  readOnly
                />
              </label>

              <label>
                Account Name
                <input
                  value={paymentName}
                  onChange={e => setPaymentName(e.target.value)}
                  placeholder="Your full name"
                />
              </label>
            </div>

            {paymentError && (
              <div className="payment-error">⚠️ {paymentError}</div>
            )}

            <button
              className="paywall-upgrade-btn"
              onClick={submitPayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? "Processing..." : "✨ Pay and Unlock Premium"}
            </button>

            <button
              className="paywall-cancel-btn"
              onClick={() => setShowPaywall(false)}
              disabled={paymentLoading}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

    </div>
  );
}