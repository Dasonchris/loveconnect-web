import { Link } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
        

        {/* Desktop Menu */}
         {/* Logo */}
        <h1 className="logo">
          LoveConnect
        </h1>
        <div className="navbar">
          <Link className="links" to="/">Home</Link>
          <Link className="links" to="/matches">Matches</Link>
          <Link className="links" to="/blind">Blind Date</Link>
          <Link className="links" to="/marketplace">Marketplace</Link>
          <Link className="links" to="/community">Community</Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-gray-700 text-xl"
        >
        </button>
      </div>

      {/* Mobile Dropdown */}
      {open && (
        <div className="md:hidden bg-white shadow-md px-4 pb-4 flex flex-col gap-3">
          <Link onClick={() => setOpen(false)} to="/">Home</Link>
          <Link onClick={() => setOpen(false)} to="/matches">Matches</Link>
          <Link onClick={() => setOpen(false)} to="/blind">Blind Date</Link>
          <Link onClick={() => setOpen(false)} to="/marketplace">Marketplace</Link>
          <Link onClick={() => setOpen(false)} to="/community">Community</Link>
        </div>
      )}
    </nav>
  );
}