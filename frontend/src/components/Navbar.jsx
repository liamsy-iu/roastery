import { useState } from "react";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

export default function Navbar({ active }) {
  const { count, dispatch } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "#home", label: "Home", id: "home" },
    { href: "#story", label: "Our Story", id: "story" },
    { href: "#shop", label: "Shop", id: "shop" },
    { href: "#contact", label: "Contact", id: "contact" },
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
