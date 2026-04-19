import { useState } from "react";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

export default function Navbar({ active, darkMode, toggleDark }) {
  const { count, dispatch } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#home",      label: "Home",      id: "home" },
    { href: "#story",     label: "Our Story", id: "story" },
    { href: "#shop",      label: "Shop",      id: "shop" },
    { href: "#wholesale", label: "Wholesale", id: "wholesale" },
    { href: "#contact",   label: "Contact",   id: "contact" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <a href="#home" className="navbar-logo">
          <span className="logo-deg">65°</span>
          <span className="logo-text">Roastery</span>
        </a>

        <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {navLinks.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                className={active === link.id ? "active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          {/* Dark mode toggle */}
          <button
            className="dark-toggle"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              /* Sun icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              /* Moon icon */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>

          {/* Cart */}
          <button
            className="cart-btn"
            onClick={() => dispatch({ type: "TOGGLE" })}
            aria-label="Open cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && <span className="cart-count">{count}</span>}
          </button>

          <button
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
