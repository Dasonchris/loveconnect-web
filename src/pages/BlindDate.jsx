import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BlindDate() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("locked");
  const [match, setMatch] = useState(null);

  const startMatching = () => {
    setStatus("matching");

    setTimeout(() => {
      setMatch({
        id: "blind-1",
        name: "Anonymous Match",
        vibe: "Calm & Funny 😌",
        compatibility: 91,
      });

      setStatus("match_found");
    }, 2000);
  };

  const openChat = () => {
    navigate(`/chat/${match.id}`, {
      state: {
        match,
        isPremium: false,
        messageLimit: 5,
      },
    });
  };

  return (
    <div className="blind-container">

      <h1>Blind Date System 🔒</h1>

      {status === "locked" && (
        <div className="card">
          <p>Discover your anonymous match 👀</p>
          <button onClick={startMatching}>Start Matching</button>
        </div>
      )}

      {status === "matching" && (
        <div className="card">
          <p>Finding your perfect match...</p>
        </div>
      )}

      {status === "match_found" && match && (
        <div className="card">
          <h2>Match Found 👀</h2>

          <p><b>Vibe:</b> {match.vibe}</p>
          <p><b>Compatibility:</b> {match.compatibility}%</p>

          <p>Identity hidden until chat begins 🔐</p>

          <button onClick={openChat}>
            Start Chat 💬
          </button>
        </div>
      )}

    </div>
  );
}