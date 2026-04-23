// client/src/pages/Matches.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { matchAPI } from "../api";
import "./Matches.css";

export default function Matches() {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await matchAPI.getMatches();

        // handle different backend formats
        const result = data.matches || data || [];

        setMatches(result);
      } catch (err) {
        console.error("❌ Failed to load matches:", err);
        setError(err.message || "Failed to load matches");
        setMatches([]); // prevent crash
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const openChat = (match) => {
    if (!match?._id) return;
    navigate(`/chat/${match._id}`, { state: match });
  };

  if (loading) {
    return (
      <div className="matches-container">
        <p>Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="matches-container">
      <h1 className="matches-title">Messages</h1>

      {/* Error but still render UI if possible */}
      {error && matches.length === 0 && (
        <p className="error-text">⚠️ {error}</p>
      )}

      {matches.length === 0 ? (
        <p className="empty-state">
          No matches yet — go like someone! ❤️
        </p>
      ) : (
        <div className="matches-grid">
          {matches.map((match) => {
            const image =
              match.photo ||
              `https://ui-avatars.com/api/?name=${match.name}&background=ff4d6d&color=fff`;

            return (
              <div key={match._id} className="match-card">
                <div className="match-image-wrapper">
                  <img
                    src={image}
                    alt={match.name}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${match.name}`;
                    }}
                  />

                  <span
                    className={`status-dot ${
                      match.isOnline ? "online" : "offline"
                    }`}
                  />
                </div>

                <div className="match-info">
                  <h2>
                    {match.name}
                    {match.age && `, ${match.age}`}
                  </h2>

                  <p className="last-message">
                    {match.isOnline
                      ? "Active now 🟢"
                      : match.lastMessage || "Tap to chat"}
                  </p>
                </div>

                <button
                  className="chat-btn"
                  onClick={() => openChat(match)}
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