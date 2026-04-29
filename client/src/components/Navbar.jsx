import { Link } from "react-router-dom";
import { useState } from "react";
import { isLoggedIn, clearAuth } from "../api";
import "./Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);

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
          <button className="links logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
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