import { Link } from "react-router-dom";
import { useState } from "react";
import { isLoggedIn, clearAuth, getCurrentUser } from "../api";
import "./Navbar.css";
import AdBanner from './AdBanner';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const user = getCurrentUser();

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/";
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <h1 className="logo">LoveConnect</h1>

      {/* Desktop Menu */}
      <div className={`nav-links ${open ? "open" : ""}`}>
        <Link className="links" to="/">Home</Link>
        <Link className="links" to="/matches">Matches</Link>
        <Link className="links" to="/blind">Blinddate</Link>
        <Link className="links" to="/marketplace">Marketplace</Link>
        <Link className="links" to="/community">Community</Link>
        {isLoggedIn() && (
          <>
            <Link className="links" to="/dashboard">Dashboard</Link>
            <Link className="links" to="/profile">Profile</Link>
            <button className="links logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
        {!isLoggedIn() && (
          <Link className="nav-register-btn animate" to="/?register=true">
            Register to save your profile
          </Link>
        )}
      </div>

      {/* Inline compact ad shown on all pages */}
      <div className="nav-ad">
        <AdBanner compact />
      </div>

      {/* Hamburger Button */}
      <button
        className="hamburger"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
}