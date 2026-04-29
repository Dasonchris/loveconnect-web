import { useState }    from "react";
import { useNavigate } from "react-router-dom";
import "./BlindDate.css";

// ── Simulated payment state (replace with real payment later) ──
const PREMIUM_PRICE = 9.99;

// ✅ ADD: generate valid Mongo-style ObjectId
// const generateSafeId = () =>
//   Array.from({ length: 24 }, () =>
//     Math.floor(Math.random() * 16).toString(16)
//   ).join("");

export default function BlindDate() {
  const navigate = useNavigate();

  const [status,     setStatus]     = useState("locked");
  const [match,      setMatch]      = useState(null);
  const [progress,   setProgress]   = useState(0);
  const [isPremium,  setIsPremium]  = useState(
    () => localStorage.getItem("isPremium") === "true"
  );
  const [showPaywall,  setShowPaywall]  = useState(false);
  const [payLoading,   setPayLoading]   = useState(false);
  const [paySuccess,   setPaySuccess]   = useState(false);

  const MATCHES = [
    { id: "blind-1", name: "Anonymous Match", vibe: "Calm & Funny 😌",       compatibility: 91 },
    { id: "blind-2", name: "Mystery Person",  vibe: "Adventurous & Bold 🔥", compatibility: 87 },
    { id: "blind-3", name: "Secret Admirer",  vibe: "Romantic & Deep 💫",    compatibility: 94 },
  ];

  // ── Find match ─────────────────────────────────────────
  const startMatching = () => {
    setStatus("matching");
    setProgress(0);

    let p = 0;
    const iv = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) clearInterval(iv);
    }, 100);

    setTimeout(() => {
      const random = MATCHES[Math.floor(Math.random() * MATCHES.length)];
      setMatch(random);
      setStatus("match_found");
    }, 2000);
  };

  // ── Go to blind chat ────────────────────────────────────
  const openChat = () => {
    navigate(`/chat/${match.id}`, {
      state: {
        match,
        isPremium,
        messageLimit:  isPremium ? 9999 : 5,
        isBlindDate:   true,
      },
    });
  };

  // ── Simulate payment ────────────────────────────────────
  const handlePayment = () => {
    setPayLoading(true);
    setTimeout(() => {
      localStorage.setItem("isPremium", "true");
      setIsPremium(true);
      setPayLoading(false);
      setPaySuccess(true);
      setTimeout(() => {
        setShowPaywall(false);
        setPaySuccess(false);
      }, 1800);
    }, 2000);
  };

  const tryAgain = () => {
    setMatch(null);
    setProgress(0);
    setStatus("locked");
  };

  // ────────────────────────────────────────────────────────
  return (
    <div className="blind-container">

      {/* ── Header ── */}
      <div className="blind-header">
        <h1>Blind Date 🔒</h1>
        {isPremium && <span className="premium-badge">✨ Premium</span>}
      </div>

      {/* ══ LOCKED ══ */}
      {status === "locked" && (
        <div className="blind-card fade-in">
          <div className="blind-icon">👤</div>
          <h2>Find Your Anonymous Match</h2>
          <p className="blind-sub">
            Chat anonymously — identity revealed only after upgrade 🔐
          </p>
          {!isPremium && (
            <div className="free-info">
              <span>🆓 Free: 5 messages</span>
              <span>✨ Premium: Unlimited + reveal identity</span>
            </div>
          )}
          <button className="blind-btn primary" onClick={startMatching}>
            Start Matching 🚀
          </button>
        </div>
      )}

      {/* ══ SEARCHING ══ */}
      {status === "matching" && (
        <div className="blind-card fade-in">
          <div className="blind-icon searching">🔍</div>
          <h2>Finding Your Match...</h2>
          <div className="blind-progress-track">
            <div className="blind-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <p className="blind-progress-label">{progress}%</p>
          <div className="dots-loader">
            <span /><span /><span />
          </div>
          <p className="blind-sub">Scanning for your perfect vibe ✨</p>
        </div>
      )}

      {/* ══ MATCH FOUND ══ */}
      {status === "match_found" && match && (
        <div className="blind-card fade-in match-glow">

          <div className="match-found-badge">✨ Match Found!</div>

          {/* Blurred avatar */}
          <div className="blind-avatar">
            <span>👤</span>
            <div className="blind-avatar-blur" />
          </div>

          <h2>{match.name}</h2>

          {/* Stats */}
          <div className="match-stats">
            <div className="stat-row">
              <span className="stat-label">Vibe</span>
              <span className="stat-value">{match.vibe}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Match</span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill"
                  style={{ width: `${match.compatibility}%` }}
                />
              </div>
              <span className="stat-value">{match.compatibility}%</span>
            </div>
          </div>

          {/* Message limit info */}
          <div className="limit-info">
            {isPremium ? (
              <p className="limit-premium">✨ Premium — Unlimited messages</p>
            ) : (
              <p className="limit-free">
                🆓 Free chat — <b>5 messages</b> then upgrade to continue
              </p>
            )}
          </div>

          <p className="blind-hint">🔐 Identity hidden until you upgrade</p>

          <button className="blind-btn primary pulse" onClick={openChat}>
            Start Chat 💬
          </button>

          {!isPremium && (
            <button
              className="blind-btn upgrade"
              onClick={() => setShowPaywall(true)}
            >
              ✨ Upgrade to Premium — ${PREMIUM_PRICE}
            </button>
          )}

          <button className="blind-btn secondary" onClick={tryAgain}>
            Try Another 🔄
          </button>

        </div>
      )}

      {/* ══ PAYWALL MODAL ══ */}
      {showPaywall && (
        <div className="paywall-overlay" onClick={() => !payLoading && setShowPaywall(false)}>
          <div className="paywall-box" onClick={e => e.stopPropagation()}>

            {paySuccess ? (
              <div className="pay-success">
                <div className="pay-success-icon">🎉</div>
                <h3>You're Premium!</h3>
                <p>Unlimited chats unlocked ✨</p>
              </div>
            ) : (
              <>
                <div className="paywall-icon">✨</div>
                <h2>Upgrade to Premium</h2>
                <p className="paywall-sub">
                  Unlock unlimited chatting and reveal your match's identity
                </p>

                {/* Features list */}
                <ul className="paywall-features">
                  <li>✅ Unlimited messages</li>
                  <li>✅ Reveal match identity</li>
                  <li>✅ Priority matching</li>
                  <li>🚫 Phone numbers blocked for safety</li>
                </ul>

                <div className="paywall-price">
                  <span className="price-amount">${PREMIUM_PRICE}</span>
                  <span className="price-period">/ month</span>
                </div>

                <button
                  className="blind-btn primary"
                  onClick={handlePayment}
                  disabled={payLoading}
                >
                  {payLoading ? (
                    <span className="pay-loading">
                      <span className="pay-spinner" /> Processing...
                    </span>
                  ) : (
                    `Pay $${PREMIUM_PRICE} Now 💳`
                  )}
                </button>

                <button
                  className="blind-btn secondary"
                  onClick={() => setShowPaywall(false)}
                  disabled={payLoading}
                >
                  Maybe Later
                </button>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}