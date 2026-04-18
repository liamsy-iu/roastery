import "./Hero.css";

export default function Hero() {
  return (
    <div className="hero">
      <div className="hero-bg">
        <img
          src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1600&q=80"
          alt="Coffee roasting"
        />
        <div className="hero-overlay" />
      </div>

      <div className="hero-content container">
        <div className="hero-text">
          <p className="section-label" style={{ color: "var(--gold-light)" }}>
            Specialty Coffee Roastery — Nairobi
          </p>
          <h1 className="hero-headline">
            Coffee roasted
            <br />
            <em>at its finest</em>
            <br />
            moment.
          </h1>
          <p className="hero-sub">
            We source rare beans from Yemen, Ethiopia, Colombia and beyond —
            roasted to order and delivered to your door.
          </p>
          <div className="hero-actions">
            <a href="#shop" className="btn-primary">
              Shop Now
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href="#story"
              className="btn-outline"
              style={{
                borderColor: "rgba(245,239,224,0.4)",
                color: "var(--cream)",
              }}
            >
              Our Story
            </a>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num">65°</span>
            <span className="stat-label">
              Roast
              <br />
              precision
            </span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">12+</span>
            <span className="stat-label">
              Origins
              <br />
              sourced
            </span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num">48h</span>
            <span className="stat-label">
              Fresh
              <br />
              delivery
            </span>
          </div>
        </div>
      </div>

      <div className="hero-scroll-hint">
        <div className="scroll-line" />
        <span>Scroll</span>
      </div>
    </div>
  );
}
