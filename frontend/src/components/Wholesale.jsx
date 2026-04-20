import { useState } from "react";
import "./Wholesale.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TIERS = [
  {
    name: "Starter",
    weight: "5 – 10 kg",
    price: "KES 1,800",
    unit: "/ kg",
    description:
      "Perfect for small cafés and offices just getting started with specialty coffee.",
    perks: ["Free delivery in Nairobi", "Grind to spec", "Brew guide included"],
    highlight: false,
  },
  {
    name: "Business",
    weight: "11 – 25 kg",
    price: "KES 1,600",
    unit: "/ kg",
    description:
      "Our most popular tier for restaurants and mid-size offices with daily brewing needs.",
    perks: [
      "Free delivery nationwide",
      "Custom grind profile",
      "Priority roasting",
      "Monthly tasting notes",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    weight: "25 kg+",
    price: "Custom",
    unit: "pricing",
    description:
      "Tailored pricing and scheduling for hotel chains, large offices, and distributors.",
    perks: [
      "Dedicated account manager",
      "Custom packaging & labelling",
      "Flexible billing",
      "Quarterly farm visits",
    ],
    highlight: false,
  },
];

const CLIENTS = [
  { icon: "☕", label: "Cafés & Coffee Shops" },
  { icon: "🍽️", label: "Restaurants & Hotels" },
  { icon: "🏢", label: "Offices & Co-working" },
  { icon: "🛒", label: "Retailers & Delis" },
];

const VOLUMES = [
  "5 – 10 kg / month",
  "11 – 25 kg / month",
  "25 – 50 kg / month",
  "50 kg+ / month",
];

const EMPTY_FORM = {
  name: "",
  business_name: "",
  phone: "",
  city: "",
  volume: "",
  message: "",
};

export default function Wholesale() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle");
  const [waUrl, setWaUrl] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`${API}/wholesale/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setWaUrl(data.whatsapp_url);
      setStatus("sent");
    } catch {
      const msg = `*65° Wholesale Enquiry*\n\nName: ${form.name}\nBusiness: ${form.business_name}\nPhone: ${form.phone}\nCity: ${form.city}\nVolume: ${form.volume}`;
      setWaUrl(`https://wa.me/254742471824?text=${encodeURIComponent(msg)}`);
      setStatus("sent");
    }
  };

  return (
    <div className="wholesale">
      <div className="container">
        {/* Header */}
        <div className="wholesale-header">
          <p className="section-label">Wholesale Programme</p>
          <h2 className="wholesale-heading">
            Specialty coffee for
            <br />
            <em>businesses that care.</em>
          </h2>
          <p className="wholesale-sub">
            We supply cafés, restaurants, hotels, and offices across Kenya with
            freshly roasted specialty coffee — starting from 5 kg per order.
            Every batch roasted to order, never stale.
          </p>
        </div>

        {/* Who we serve */}
        <div className="wholesale-clients">
          {CLIENTS.map((c) => (
            <div className="wholesale-client" key={c.label}>
              <span className="client-icon">{c.icon}</span>
              <span className="client-label">{c.label}</span>
            </div>
          ))}
        </div>

        {/* Pricing tiers */}
        <div className="wholesale-tiers">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`wholesale-tier ${tier.highlight ? "highlighted" : ""}`}
            >
              {tier.highlight && (
                <div className="tier-popular-badge">Most Popular</div>
              )}
              <div className="tier-header">
                <h3 className="tier-name">{tier.name}</h3>
                <div className="tier-weight">{tier.weight}</div>
              </div>
              <div className="tier-price">
                <span className="tier-amount">{tier.price}</span>
                <span className="tier-unit">{tier.unit}</span>
              </div>
              <p className="tier-desc">{tier.description}</p>
              <ul className="tier-perks">
                {tier.perks.map((perk) => (
                  <li key={perk}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                className={`tier-cta ${tier.highlight ? "tier-cta-primary" : "tier-cta-outline"}`}
                onClick={() => setShowForm(true)}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="wholesale-form-wrap">
            {status === "sent" ? (
              <div className="wholesale-form-success">
                <div className="ws-success-icon">✓</div>
                <h3>Enquiry received!</h3>
                <p>
                  We've saved your details and will be in touch within 24 hours.
                </p>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="wholesale-banner-btn"
                >
                  WhatsApp Us Now
                </a>
                <button
                  className="ws-reset-btn"
                  onClick={() => {
                    setStatus("idle");
                    setForm(EMPTY_FORM);
                    setShowForm(false);
                  }}
                >
                  Submit another enquiry
                </button>
              </div>
            ) : (
              <>
                <div className="wholesale-form-header">
                  <h3>Get a wholesale quote</h3>
                  <button
                    className="ws-close-btn"
                    onClick={() => setShowForm(false)}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="wholesale-form">
                  <div className="ws-form-grid">
                    <div className="ws-field">
                      <label>Your Name *</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="ws-field">
                      <label>Business Name *</label>
                      <input
                        name="business_name"
                        value={form.business_name}
                        onChange={handleChange}
                        placeholder="Café / Restaurant / Office..."
                        required
                      />
                    </div>
                    <div className="ws-field">
                      <label>Phone Number *</label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+254 7XX XXX XXX"
                        required
                      />
                    </div>
                    <div className="ws-field">
                      <label>City *</label>
                      <input
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        placeholder="Nairobi, Mombasa..."
                        required
                      />
                    </div>
                    <div className="ws-field ws-span-2">
                      <label>Monthly Volume *</label>
                      <select
                        name="volume"
                        value={form.volume}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select volume...</option>
                        {VOLUMES.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="ws-field ws-span-2">
                      <label>Additional notes (optional)</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Preferred origins, grind requirements..."
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="ws-submit-btn"
                    disabled={status === "sending"}
                  >
                    {status === "sending" ? "Sending..." : "Submit Enquiry"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* Bottom banner */}
        <div className="wholesale-banner">
          <div className="wholesale-banner-text">
            <h3>Not sure which tier fits?</h3>
            <p>
              Message us on WhatsApp and we'll figure out the right volume,
              grind, and schedule for your business — no commitment needed.
            </p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="wholesale-banner-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Chat with us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
