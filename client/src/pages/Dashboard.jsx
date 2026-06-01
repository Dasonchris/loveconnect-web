import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, getCurrentUser } from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authAPI.isLoggedIn()) {
      navigate("/");
      return;
    }

    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setLoading(false);
      return;
    }

    const loadMe = async () => {
      try {
        const userData = await authAPI.getMe();
        setUser(userData);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-loading">Loading your dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-error">Could not load your profile. Please log in again.</div>
      </div>
    );
  }

  const totals = {
    messagesSent: user.messagesSent ?? 0,
    messagesReceived: user.messagesReceived ?? 0,
    activities: user.activities ?? 0,
  };

  const matchCount = Array.isArray(user.matches)
    ? user.matches.length
    : typeof user.matches === 'number'
      ? user.matches
      : 0;

  const firstMatchId = Array.isArray(user.matches) && user.matches.length
    ? user.matches[0]
    : "";

  const chatTarget = firstMatchId ? `/chat/${firstMatchId}` : "/matches";
  const chatButtonText = firstMatchId ? "Chat Now" : "View Matches";

  return (
    <div className="dashboard-shell">
      <div className="dashboard-card">
        <div className="dashboard-head">
          <div>
            <h1>Welcome back, {user.name || "Member"} 👋</h1>
            <p>Your secure dashboard is ready. Edit your profile, upload a photo, and keep your matches close.</p>
          </div>
          <button className="dashboard-edit-btn" onClick={() => navigate("/profile")}>Edit Profile</button>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-tile">
            <span className="tile-title">Matches</span>
            <strong>{matchCount}</strong>
          </div>
          <div className="dashboard-tile">
            <span className="tile-title">Likes Received</span>
            <strong>{user.likes ?? 0}</strong>
          </div>
          <div className="dashboard-tile">
            <span className="tile-title">Messages Sent</span>
            <strong>{totals.messagesSent ?? 0}</strong>
          </div>
          <div className="dashboard-tile">
            <span className="tile-title">Messages Received</span>
            <strong>{totals.messagesReceived ?? 0}</strong>
          </div>
          <div className="dashboard-tile">
            <span className="tile-title">Activity Logs</span>
            <strong>{totals.activities ?? 0}</strong>
          </div>
          <div className="dashboard-tile">
            <span className="tile-title">Premium Status</span>
            <strong>{user.isPremium ? "Active" : "Free"}</strong>
          </div>
        </div>

        <div className="dashboard-quick-actions">
          <button onClick={() => navigate("/matches")}>See Matches</button>
          <button onClick={() => navigate("/community")}>Open Community</button>
          <button onClick={() => navigate(chatTarget)} disabled={matchCount === 0}>{chatButtonText}</button>
        </div>
      </div>
    </div>
  );
}
