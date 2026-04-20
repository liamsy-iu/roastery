import { useState } from "react";
import { useCart } from "../context/CartContext";
import "./CartDrawer.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const PHONE = "254742471824";

export default function CartDrawer() {
  const { open, items, total, count, dispatch } = useCart();
  const [step, setStep] = useState("cart"); // cart | form | saving | ready
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");

  const [codeInput, setCodeInput] = useState("");
  const [discount, setDiscount] = useState(null);
  const [codeError, setCodeError] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);

  const discountAmount = discount
    ? discount.type === "percent"
      ? Math.round((total * discount.value) / 100)
      : Math.min(discount.value, total)
    : 0;
  const finalTotal = total - discountAmount;

  const close = () => {
    dispatch({ type: "CLOSE" });
    setTimeout(() => {
      setStep("cart");
      setWhatsappUrl("");
      setDiscount(null);
      setCodeInput("");
      setCodeError("");
    }, 300);
  };

  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const buildFallbackUrl = () => {
    let msg = `*65 Degrees Coffee Roastery - New Order*\n\n`;
    msg += `Name: ${form.name}\nCity: ${form.city}\nPhone: ${form.phone}\n\nOrder:\n`;
    items.forEach((i) => {
      msg += `- ${i.name} x${i.quantity} - KES ${(i.price * i.quantity).toFixed(0)}\n`;
    });
    msg += `\nTotal: KES ${total.toFixed(0)}`;
    if (form.notes) msg += `\nNotes: ${form.notes}`;
    return `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
  };

  const handleApplyCode = async () => {
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeError("");
    try {
      const res = await fetch(`${API}/discounts/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      if (!res.ok) {
        setCodeError("Invalid or expired code.");
        setDiscount(null);
      } else {
        const d = await res.json();
        setDiscount(d);
      }
    } catch {
      setCodeError("Could not validate code. Try again.");
    } finally {
      setCodeLoading(false);
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
    setCodeInput("");
    setCodeError("");
  };

  const handlePrepareOrder = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.city) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setStep("saving");

    const order = {
      items: items.map((i) => ({
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      customer_name: form.name,
      customer_phone: form.phone,
      customer_email: form.email || "",
      customer_city: form.city,
      notes: form.notes || "",
      discount_code: discount?.code || "",
      discount_value: discount?.value || 0,
      discount_type: discount?.type || "",
    };

    try {
      const res = await fetch(`${API}/orders/whatsapp-link-v2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setWhatsappUrl(data.whatsapp_url);
    } catch {
      // Backend unreachable - build URL client-side as fallback
      setWhatsappUrl(buildFallbackUrl());
    }

    setStep("ready");
  };

  const handleSent = () => {
    dispatch({ type: "CLEAR" });
    close();
  };

  return (
    <>
      {open && <div className="cart-backdrop" onClick={close} />}
      <div className={`cart-drawer ${open ? "open" : ""}`}>
        <div className="cart-header">
          <div>
            <h3 className="cart-title">Your Cart</h3>
            {count > 0 && (
              <span className="cart-sub">
                {count} item{count > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <button className="cart-close" onClick={close}>
            ✕
          </button>
        </div>

        {/* ── Step 1: Cart ── */}
        {step === "cart" && (
          <>
            {items.length === 0 ? (
              <div className="cart-empty">
                <div className="empty-icon">☕</div>
                <p>Your cart is empty.</p>
                <button
                  className="btn-primary"
                  style={{ fontSize: "12px", padding: "12px 24px" }}
                  onClick={close}
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {items.map((item) => (
                    <div key={item.id} className="cart-item">
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-price">
                          KES {item.price.toFixed(0)} / {item.weight}
                        </p>
                        <div className="qty-control">
                          <button
                            onClick={() =>
                              dispatch({
                                type: "UPDATE_QTY",
                                id: item.id,
                                qty: item.quantity - 1,
                              })
                            }
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() =>
                              dispatch({
                                type: "UPDATE_QTY",
                                id: item.id,
                                qty: item.quantity + 1,
                              })
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="cart-item-right">
                        <span className="cart-item-subtotal">
                          KES {(item.price * item.quantity).toFixed(0)}
                        </span>
                        <button
                          className="remove-btn"
                          onClick={() =>
                            dispatch({ type: "REMOVE_ITEM", id: item.id })
                          }
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="discount-section">
                  {!discount ? (
                    <div className="discount-row">
                      <input
                        className="discount-input"
                        value={codeInput}
                        onChange={(e) =>
                          setCodeInput(e.target.value.toUpperCase())
                        }
                        placeholder="Discount code"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleApplyCode()
                        }
                      />
                      <button
                        className="discount-apply-btn"
                        onClick={handleApplyCode}
                        disabled={codeLoading}
                      >
                        {codeLoading ? "..." : "Apply"}
                      </button>
                    </div>
                  ) : (
                    <div className="discount-applied">
                      <span>
                        🏷️ <strong>{discount.code}</strong> —{" "}
                        {discount.type === "percent"
                          ? `${discount.value}% off`
                          : `KES ${discount.value} off`}
                      </span>
                      <button
                        onClick={removeDiscount}
                        className="discount-remove"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {codeError && <p className="discount-error">{codeError}</p>}
                </div>
                <div className="cart-footer">
                  {discountAmount > 0 && (
                    <div className="cart-total" style={{ opacity: 0.6 }}>
                      <span>Subtotal</span>
                      <span>KES {total.toFixed(0)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="cart-total" style={{ color: "#27ae60" }}>
                      <span>Discount</span>
                      <span>− KES {discountAmount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="cart-total">
                    <span>Total</span>
                    <span className="total-amount">
                      KES {finalTotal.toFixed(0)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Step 2: Customer form ── */}
        {step === "form" && (
          <form className="checkout-form" onSubmit={handlePrepareOrder}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Your name"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                placeholder="+254 7XX XXX XXX"
                required
              />
            </div>
            <div className="form-group">
              <label>
                Email{" "}
                <span
                  style={{
                    fontWeight: 300,
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  (for confirmation)
                </span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="you@email.com"
              />
            </div>
            <div className="form-group">
              <label>City *</label>
              <input
                name="city"
                value={form.city}
                onChange={handleFormChange}
                placeholder="Nairobi, Mombasa..."
                required
              />
            </div>
            <div className="form-group">
              <label>Order Notes (optional)</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleFormChange}
                placeholder="Grind preference, delivery notes..."
                rows={3}
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span className="total-amount">KES {total.toFixed(0)}</span>
              </div>
              <button
                type="button"
                className="btn-outline"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  marginBottom: "10px",
                }}
                onClick={() => setStep("cart")}
              >
                ← Back to Cart
              </button>
              <button type="submit" className="whatsapp-btn">
                Confirm Order →
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2.5: Saving spinner ── */}
        {step === "saving" && (
          <div className="cart-ready">
            <div className="saving-spinner" />
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Preparing your order...
            </p>
          </div>
        )}

        {/* ── Step 3: Ready — tap to open WhatsApp ── */}
        {step === "ready" && (
          <div className="cart-ready">
            <div className="ready-icon">✓</div>
            <h3>Your order is ready!</h3>
            <p>
              Tap below to open WhatsApp — your order is pre-filled and ready to
              send.
            </p>
            <div className="cart-footer">
              <a
                href={whatsappUrl}
                className="whatsapp-btn"
                target="_blank"
                rel="noreferrer"
                onClick={handleSent}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  textDecoration: "none",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Open WhatsApp & Send Order
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
