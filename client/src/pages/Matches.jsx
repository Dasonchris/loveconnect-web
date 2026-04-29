// client/src/pages/Matches.jsx
import { useState, useEffect }              from "react";
import { useNavigate }                      from "react-router-dom";
import { matchAPI, chatAPI, getCurrentUser } from "../api";
import "./Matches.css";

export default function Matches() {
  const navigate    = useNavigate();
  const currentUser = getCurrentUser();

  const [matches,     setMatches]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [unreadMap,   setUnreadMap]   = useState({});  // { matchId: count }

  // ── Load matches ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data   = await matchAPI.getMatches();
        const result = data.matches || data || [];
        setMatches(result);

        // Load unread counts for each match
        const counts = {};
        await Promise.allSettled(
          result.map(async (m) => {
            try {
              const res = await chatAPI.getUnreadCount(m._id);
              counts[m._id] = res?.count || 0;
            } catch {
              counts[m._id] = 0;
            }
          })
        );
        setUnreadMap(counts);

      } catch (err) {
        console.error("❌ Failed to load matches:", err);
        setError(err.message || "Failed to load matches");
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Filter by search ─────────────────────────────────
  const filtered = matches.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Open chat ─────────────────────────────────────────
  const openChat = (match) => {
    if (!match?._id) return;
    // Clear unread badge locally
    setUnreadMap(prev => ({ ...prev, [match._id]: 0 }));
    navigate(`/chat/${match._id}`, { state: match });
  };

  // ── Open self notes ───────────────────────────────────
  const openSelfNotes = () => navigate("/self-chat");

  // ── Format time ──────────────────────────────────────
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now  = new Date();
    const diff = now - date;

    if (diff < 60000)        return "just now";
    if (diff < 3600000)      return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000)     return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // ─────────────────────────────────────────────────────
  if (loading) return (
    <div className="matches-container">
      <div className="matches-loading">
        <div className="matches-spinner" />
        <p>Loading matches...</p>
      </div>
    </div>
  );

  return (
    <div className="matches-container">

      {/* ── Header ── */}
      <div className="matches-header">
        <h1 className="matches-title">Messages</h1>
        {matches.length > 0 && (
          <span className="matches-count">{matches.length}</span>
        )}
      </div>

      {/* ── Search ── */}
      {matches.length > 0 && (
        <div className="matches-search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search matches..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="matches-search"
          />
          {search && (
            <button
              className="search-clear"
              onClick={() => setSearch("")}
            >✕</button>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {error && matches.length === 0 && (
        <div className="matches-error">⚠️ {error}</div>
      )}

      {/* ── Self Notes Card ── */}
      <div className="match-card self-card" onClick={openSelfNotes}>
        <div className="match-image-wrapper">
          <div className="self-avatar">
            {currentUser?.name?.[0]?.toUpperCase() || "📝"}
          </div>
          <span className="status-dot online" />
        </div>

        <div className="match-info">
          <h2>My Notes</h2>
          <p className="last-message">Tap to write something... 📝</p>
        </div>

        <button className="chat-btn self-btn">
          📝 Open
        </button>
      </div>

      {/* ── Empty State ── */}
      {matches.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">💔</div>
          <p>No matches yet</p>
          <span>Go like someone on the home page!</span>
          <button
            className="empty-action-btn"
            onClick={() => navigate("/")}
          >
            Find Matches ❤️
          </button>
        </div>
      )}

      {/* ── No search results ── */}
      {matches.length > 0 && filtered.length === 0 && (
        <div className="no-search-result">
          <p>No match found for "<b>{search}</b>"</p>
        </div>
      )}

      {/* ── Matches Grid ── */}
      {filtered.length > 0 && (
        <div className="matches-grid">
          {filtered.map(match => {
            const image   = match.photo ||
              `https://ui-avatars.com/api/?name=${match.name}&background=ff4d6d&color=fff`;
            const unread  = unreadMap[match._id] || 0;

            return (
              <div
                key={match._id}
                className="match-card"
                onClick={() => openChat(match)}
              >
                {/* Image + status */}
                <div className="match-image-wrapper">
                  <img
                    src={image}
                    alt={match.name}
                    onError={e => {
                      e.target.src = `https://ui-avatars.com/api/?name=${match.name}&background=ff4d6d&color=fff`;
                    }}
                  />
                  <span className={`status-dot ${match.isOnline ? "online" : "offline"}`} />

                  {/* Unread badge */}
                  {unread > 0 && (
                    <span className="unread-badge">{unread > 99 ? "99+" : unread}</span>
                  )}
                </div>

                {/* Info */}
                <div className="match-info">
                  <div className="match-info-top">
                    <h2>
                      {match.name}
                      {match.age && <span className="match-age">, {match.age}</span>}
                    </h2>
                    {match.lastMessageAt && (
                      <span className="match-time">
                        {formatTime(match.lastMessageAt)}
                      </span>
                    )}
                  </div>

                  <p className={`last-message ${unread > 0 ? "unread" : ""}`}>
                    {match.isOnline
                      ? "Active now 🟢"
                      : match.lastMessage || "Tap to chat 💬"}
                  </p>

                  {/* Hobby tags */}
                  {match.hobbies?.length > 0 && (
                    <div className="match-hobbies">
                      {match.hobbies.slice(0, 2).map(h => (
                        <span key={h} className="match-hobby-tag">{h}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat button */}
                <button
                  className={`chat-btn ${unread > 0 ? "chat-btn-active" : ""}`}
                  onClick={e => { e.stopPropagation(); openChat(match); }}
                >
                  💬 Chat
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}