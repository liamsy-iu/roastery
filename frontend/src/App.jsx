import { useState, useEffect } from "react";
import { CartProvider } from "./context/CartContext";
import Admin from "./pages/Admin";
import Navbar from "./components/Navbar";
import CartDrawer from "./components/CartDrawer";
import Hero from "./components/Hero";
import OurStory from "./components/OurStory";
import Shop from "./components/Shop";
import WhyUs from "./components/WhyUs";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import "./index.css";

// Simple client-side routing — no dependency needed
const isAdmin = window.location.pathname.startsWith("/admin");

export default function App() {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    if (isAdmin) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { threshold: 0.3 },
    );
    ["home", "story", "shop", "contact"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  if (isAdmin) {
    return <Admin />;
  }

  return (
    <CartProvider>
      <div className="app">
        <Navbar active={activeSection} />
        <CartDrawer />
        <main>
          <section id="home">
            <Hero />
          </section>
          <section id="story">
            <OurStory />
          </section>
          <section id="shop">
            <Shop />
          </section>
          <WhyUs />
          <section id="contact">
            <ContactSection />
          </section>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}
