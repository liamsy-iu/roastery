import { useState, useEffect } from "react";
import { CartProvider } from "./context/CartContext";
import Admin from "./pages/Admin";
import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import Hero from "./components/Hero";
import OurStory from "./components/OurStory";
import Shop from "./components/Shop";
import WhyUs from "./components/WhyUs";
import Wholesale from "./components/Wholesale";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import "./index.css";

const isAdmin = window.location.pathname.startsWith("/admin");

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [darkMode, setDarkMode] = useState(() => {
    // Persist preference in localStorage
    const saved = localStorage.getItem("65-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("65-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (isAdmin) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { threshold: 0.3 }
    );
    ["home", "story", "shop", "wholesale", "contact"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  if (isAdmin) return <Admin />;

  return (
    <CartProvider>
      <div className="app">
        <Navbar active={activeSection} darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)} />
        <CartDrawer />
        <main>
          <section id="home"><Hero /></section>
          <section id="story"><OurStory /></section>
          <section id="shop"><Shop /></section>
          <section id="wholesale"><Wholesale /></section>
          <WhyUs />
          <section id="contact"><ContactSection /></section>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
