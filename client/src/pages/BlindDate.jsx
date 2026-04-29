import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { blindAPI, isLoggedIn } from "../api";
import "./BlindDate.css";

// ── Premium upgrade price ─────────────────────────────────
const PREMIUM_PRICE = 9.99;

// ✅ ADD: generate valid Mongo-style ObjectId
// const generateSafeId = () =>
//   Array.from({ length: 24 }, () =>
//     Math.floor(Math.random() * 16).toString(16)
//   ).join("");

export default function BlindDate() {
  const navigate = useNavigate();

  const [status,        setStatus]        = useState("locked");
  const [match,         setMatch]         = useState(null);
  const [progress,      setProgress]      = useState(0);
  const [isPremium,     setIsPremium]     = useState(
    () => localStorage.getItem("isPremium") === "true"
  );
  const [messageLimit,  setMessageLimit]  = useState(6);
  const [showPaywall,   setShowPaywall]   = useState(false);
  const [payLoading,    setPayLoading]    = useState(false);
  const [paySuccess,    setPaySuccess]    = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [paymentProvider, setPaymentProvider] = useState("MTN");
  const [account,       setAccount]       = useState("");
  const [accountName,   setAccountName]   = useState("");
  const [paymentError,  setPaymentError]  = useState("");

  // ── Go to blind chat ────────────────────────────────────
  const openChat = () => {
    navigate(`/chat/${match.id}`, {
      state: {
        match,
        isPremium,
        messageLimit:  isPremium ? 9999 : 6,
        isBlindDate:   true,
      },
    });
  };

  useEffect(() => {
    const loadStatus = async () => {
      if (!isLoggedIn()) return;
      try {
        const status = await blindAPI.getPremiumStatus();
        setIsPremium(status.isPremium);
        setMessageLimit(status.isPremium ? 999 : 6);
      } catch (err) {
        console.error("Failed to load premium status:", err);
      }
    };
    loadStatus();
  }, []);

  const startMatching = () => {
    setStatus("matching");
    setProgress(0);
    setPaymentError("");

    let p = 0;
    const iv = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) clearInterval(iv);
    }, 100);

    setTimeout(async () => {
      try {
        if (!isLoggedIn()) {
          setStatus("locked");
          setPaymentError("Please register or log in before using Blind Date.");
          return;
        }

        const data = await blindAPI.findMatch();
        setMatch({
          id:            data.id,
          name:          data.name,
          vibe:          data.vibe,
          compatibility: data.compatibility,
        });
        setIsPremium(data.isPremium);
        setMessageLimit(data.messageLimit || 6);
        setStatus("match_found");
      } catch (err) {
        console.error(err);
        setStatus("locked");
        setPaymentError(err.message || "Unable to find a match right now.");
      }
    }, 2000);
  };

  const handlePayment = async () => {
    setPaymentError("");
    if (!account.trim() || !accountName.trim()) {
      setPaymentError("Enter your account number and account name.");
      return;
    }

    setPayLoading(true);
    try {
      await blindAPI.upgradeToPremium({
        method:      paymentMethod,
        provider:    paymentProvider,
        account:     account.trim(),
        accountName: accountName.trim(),
      });

      localStorage.setItem("isPremium", "true");
      setIsPremium(true);
      setMessageLimit(999);
      setPaySuccess(true);
      setTimeout(() => {
        setShowPaywall(false);
        setPaySuccess(false);
      }, 1800);
    } catch (err) {
      setPaymentError(err.message || "Payment failed. Please try again.");
      console.error(err);
    } finally {
      setPayLoading(false);
    }
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
              <span>🆓 Free: 6 messages</span>
              <span>✨ Premium: Unlimited + reveal identity</span>
            </div>
          )}
          {paymentError && (
            <div className="error-text">⚠️ {paymentError}</div>
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
                🆓 Free chat — <b>6 messages</b> then upgrade to continue
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

                <div className="paywall-tabs">
                  <button
                    className={paymentMethod === "momo" ? "pay-tab active" : "pay-tab"}
                    onClick={() => setPaymentMethod("momo")}
                    disabled={payLoading}
                  >
                    Mobile Money
                  </button>
                  <button
                    className={paymentMethod === "bank" ? "pay-tab active" : "pay-tab"}
                    onClick={() => setPaymentMethod("bank")}
                    disabled={payLoading}
                  >
                    Bank Transfer
                  </button>
                </div>

                {paymentMethod === "momo" ? (
                  <div className="payment-fields">
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
                    <label>
                      Phone Number
                      <input
                        value={account}
                        onChange={e => setAccount(e.target.value)}
                        placeholder="e.g. 0244123456"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="payment-fields">
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
                    <label>
                      Account Number
                      <input
                        value={account}
                        onChange={e => setAccount(e.target.value)}
                        placeholder="e.g. 0123456789"
                      />
                    </label>
                  </div>
                )}

                <label>
                  Account Name
                  <input
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="Your full name"
                  />
                </label>

                {paymentError && (
                  <div className="payment-error">⚠️ {paymentError}</div>
                )}

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