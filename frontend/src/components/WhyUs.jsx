import "./WhyUs.css";

const REASONS = [
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "Roasted to Order",
    body: "We never keep pre-roasted stock. Your coffee is roasted within 24 hours of your order — at peak freshness when it reaches you.",
  },
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: "Direct from Farmers",
    body: "We bypass middlemen and work directly with smallholder farms in Yemen, Ethiopia, Colombia and Indonesia. Better quality, fairer prices.",
  },
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: "Free Delivery",
    body: "We ship free across Nairobi and Kenya. Orders placed before noon are dispatched same day, and arrive within 48 hours.",
  },
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
    title: "Subscriptions with Soul",
    body: "Our monthly boxes aren't automated — each one is hand-picked by our head roaster with a tasting card and origin story.",
  },
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Quality Guaranteed",
    body: "Not happy? We'll replace your order or refund in full — no questions asked. We stand behind every bag we roast.",
  },
  {
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    title: "Roaster's Expertise",
    body: "Every roast profile is developed and tasted by our head roaster. We publish brew guides for every coffee we sell.",
  },
];

export default function WhyUs() {
  return (
    <div className="whyus">
      <div className="container">
        <div className="whyus-header">
          <p className="section-label">Why 65°</p>
          <h2 className="whyus-heading">
            Coffee roasted with
            <br />
            <em>intention.</em>
          </h2>
        </div>

        <div className="whyus-grid">
          {REASONS.map((r, i) => (
            <div className="whyus-card" key={i}>
              <div className="whyus-icon">{r.icon}</div>
              <h3 className="whyus-card-title">{r.title}</h3>
              <p className="whyus-card-body">{r.body}</p>
            </div>
          ))}
        </div>

        <div className="whyus-banner">
          <img
            src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1400&q=80"
            alt="Coffee farm"
          />
          <div className="whyus-banner-overlay">
            <blockquote>
              "We named ourselves after the temperature that unlocks the soul of
              every bean. That precision is in everything we do."
            </blockquote>
            <cite>— The 65° Team, Nairobi</cite>
          </div>
        </div>
      </div>
    </div>
  );
}
