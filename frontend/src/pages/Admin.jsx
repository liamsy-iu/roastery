import { useState, useEffect, useCallback } from "react";
import "./Admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders(user, pass) {
  return { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${user}:${pass}`) };
}

const EMPTY_FORM = {
  name: "", category: "whole-bean", description: "", origin: "",
  flavor_notes: "", price: "", weight: "250g", image: "", badge: "", in_stock: true,
};

const STATUS_LABELS = {
  new:        { label: "New",        color: "status-new" },
  confirmed:  { label: "Confirmed",  color: "status-confirmed" },
  dispatched: { label: "Dispatched", color: "status-dispatched" },
  delivered:  { label: "Delivered",  color: "status-delivered" },
  cancelled:  { label: "Cancelled",  color: "status-cancelled" },
};

const STATUS_FLOW = ["new", "confirmed", "dispatched", "delivered"];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
    + " · " + d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function Invoice({ order }) {
  return (
    <div className="invoice-doc">
      <div className="invoice-header">
        <div>
          <div className="invoice-brand-name">65°</div>
          <div className="invoice-brand-sub">Specialty Coffee Roastery</div>
          <div className="invoice-brand-addr">
            Nairobi, Kenya<br />
            hello@sixtyfivedegrees.com<br />
            +254 700 000 000
          </div>
        </div>
        <div className="invoice-meta">
          <h2>Invoice</h2>
          <div className="invoice-meta-row">
            <span className="invoice-meta-label">Invoice No.</span>
            <span className="invoice-meta-value">{order.order_number}</span>
          </div>
          <div className="invoice-meta-row">
            <span className="invoice-meta-label">Date</span>
            <span className="invoice-meta-value">{formatDateShort(order.created_at)}</span>
          </div>
          <div className="invoice-meta-row">
            <span className="invoice-meta-label">Status</span>
            <span className="invoice-meta-value">{STATUS_LABELS[order.status]?.label}</span>
          </div>
        </div>
      </div>

      <div className="invoice-bill-to">
        <div className="invoice-section-title">Billed To</div>
        <div className="invoice-customer-name">{order.customer_name}</div>
        <div className="invoice-customer-detail">
          {order.customer_city}<br />{order.customer_phone}
        </div>
        {order.notes && (
          <div className="invoice-customer-detail" style={{ marginTop: 8, fontStyle: "italic" }}>
            Note: {order.notes}
          </div>
        )}
      </div>

      <table className="invoice-items">
        <thead>
          <tr>
            <th>Item</th>
            <th>Unit Price</th>
            <th>Qty</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td>{item.product_name}</td>
              <td>KES {item.price.toLocaleString()}</td>
              <td>{item.quantity}</td>
              <td>KES {(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-totals">
        <div className="invoice-total-row">
          <span className="invoice-total-label">Subtotal</span>
          <span className="invoice-total-value">KES {order.total.toLocaleString()}</span>
        </div>
        <div className="invoice-total-row">
          <span className="invoice-total-label">Delivery</span>
          <span className="invoice-total-value">Free</span>
        </div>
        <div className="invoice-total-row grand">
          <span className="invoice-total-label">Total</span>
          <span className="invoice-total-value">KES {order.total.toLocaleString()}</span>
        </div>
      </div>

      <div className="invoice-footer">
        <div className="invoice-footer-note">
          Thank you for your order!<br />Payment due upon delivery.
        </div>
        <div className="invoice-footer-brand">65° Roastery</div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed]         = useState(false);
  const [creds, setCreds]           = useState({ user: "", pass: "" });
  const [loginError, setLoginError] = useState("");
  const [tab, setTab]               = useState("orders");
  const [toast, setToast]           = useState("");

  const [products, setProducts]               = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [modal, setModal]                     = useState(null);
  const [form, setForm]                       = useState(EMPTY_FORM);
  const [editId, setEditId]                   = useState(null);
  const [saving, setSaving]                   = useState(false);
  const [uploading, setUploading]             = useState(false);
  const [deleteConfirm, setDeleteConfirm]     = useState(null);

  const [orders, setOrders]                         = useState([]);
  const [ordersLoading, setOrdersLoading]           = useState(false);
  const [expandedOrder, setExpandedOrder]           = useState(null);
  const [statusFilter, setStatusFilter]             = useState("all");
  const [deleteOrderConfirm, setDeleteOrderConfirm] = useState(null);
  const [invoiceOrder, setInvoiceOrder]             = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${API}/admin/products`, { headers: authHeaders(creds.user, creds.pass) });
      if (res.status === 401) { setAuthed(false); return; }
      setProducts(await res.json());
    } catch { showToast("Failed to load products."); }
    finally { setProductsLoading(false); }
  }, [creds]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/admin/orders`, { headers: authHeaders(creds.user, creds.pass) });
      if (res.status === 401) { setAuthed(false); return; }
      setOrders(await res.json());
    } catch { showToast("Failed to load orders."); }
    finally { setOrdersLoading(false); }
  }, [creds]);

  useEffect(() => { if (authed) { fetchOrders(); fetchProducts(); } }, [authed, fetchOrders, fetchProducts]);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError("");
    try {
      const res = await fetch(`${API}/admin/products`, { headers: authHeaders(creds.user, creds.pass) });
      if (res.ok) { setAuthed(true); } else { setLoginError("Incorrect username or password."); }
    } catch { setLoginError("Could not reach the server."); }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API}/admin/orders/${orderId}/status`, {
        method: "PATCH", headers: authHeaders(creds.user, creds.pass),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      showToast("Status updated."); fetchOrders();
    } catch { showToast("Failed to update status."); }
  };

  const handleDeleteOrder = async (id) => {
    try {
      const res = await fetch(`${API}/admin/orders/${id}`, { method: "DELETE", headers: authHeaders(creds.user, creds.pass) });
      if (!res.ok) throw new Error();
      showToast("Order deleted."); setDeleteOrderConfirm(null); fetchOrders();
    } catch { showToast("Failed to delete order."); }
  };


  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await fetch(`${API}/admin/upload-image`, {
        method: "POST",
        headers: { Authorization: "Basic " + btoa(`${creds.user}:${creds.pass}`) },
        body: data,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      setForm((f) => ({ ...f, image: json.url }));
      showToast("Image uploaded!");
    } catch {
      showToast("Image upload failed. Try a URL instead.");
    } finally {
      setUploading(false);
    }
  };

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setModal("add"); };
  const openEdit = (p) => { setForm({ ...p, flavor_notes: p.flavor_notes.join(", "), badge: p.badge || "" }); setEditId(p.id); setModal("edit"); };
  const handleFormChange = (e) => { const { name, value, type, checked } = e.target; setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value })); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, price: parseFloat(form.price), flavor_notes: form.flavor_notes.split(",").map((n) => n.trim()).filter(Boolean), badge: form.badge.trim() || null };
    try {
      const url = modal === "edit" ? `${API}/admin/products/${editId}` : `${API}/admin/products`;
      const res = await fetch(url, { method: modal === "edit" ? "PUT" : "POST", headers: authHeaders(creds.user, creds.pass), body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      showToast(modal === "edit" ? "Product updated!" : "Product added!"); setModal(null); fetchProducts();
    } catch { showToast("Failed to save product."); }
    finally { setSaving(false); }
  };

  const handleDeleteProduct = async (id) => {
    try {
      const res = await fetch(`${API}/admin/products/${id}`, { method: "DELETE", headers: authHeaders(creds.user, creds.pass) });
      if (!res.ok) throw new Error();
      showToast("Product deleted."); setDeleteConfirm(null); fetchProducts();
    } catch { showToast("Failed to delete product."); }
  };

  const handleToggleStock = async (id) => {
    try { await fetch(`${API}/admin/products/${id}/stock`, { method: "PATCH", headers: authHeaders(creds.user, creds.pass) }); fetchProducts(); }
    catch { showToast("Failed to update stock."); }
  };

  const handlePrint = () => window.print();

  const filteredOrders = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);
  const orderStats = {
    total: orders.length,
    new: orders.filter(o => o.status === "new").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    dispatched: orders.filter(o => o.status === "dispatched").length,
    revenue: orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0),
  };

  if (!authed) return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-logo">
          <span className="admin-logo-deg">65°</span>
          <span className="admin-logo-label">Admin</span>
        </div>
        <h1>Sign in</h1>
        <p>Product & order management</p>
        <form onSubmit={handleLogin} className="login-form">
          <div className="admin-field">
            <label>Username</label>
            <input type="text" value={creds.user} onChange={(e) => setCreds({ ...creds, user: e.target.value })} placeholder="admin" autoComplete="username" required />
          </div>
          <div className="admin-field">
            <label>Password</label>
            <input type="password" value={creds.pass} onChange={(e) => setCreds({ ...creds, pass: e.target.value })} placeholder="••••••••" autoComplete="current-password" required />
          </div>
          {loginError && <p className="admin-error">{loginError}</p>}
          <button type="submit" className="admin-btn-primary">Sign In</button>
        </form>
        <a href="/" className="admin-back-link">← Back to store</a>
      </div>
    </div>
  );

  return (
    <div className="admin-wrap">
      {toast && <div className="admin-toast">{toast}</div>}

      {/* Hidden print area for invoice */}
      {invoiceOrder && (
        <div className="invoice-print-area">
          <Invoice order={invoiceOrder} />
        </div>
      )}

      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-logo-deg">65°</span>
          <nav className="admin-tabs">
            <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
              Orders
              {orderStats.new > 0 && <span className="admin-tab-badge">{orderStats.new}</span>}
            </button>
            <button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>
              Products
            </button>
          </nav>
        </div>
        <div className="admin-header-right">
          <a href="/" className="admin-btn-ghost" target="_blank" rel="noreferrer">Store ↗</a>
          <button className="admin-btn-ghost" onClick={() => setAuthed(false)}>Sign Out</button>
        </div>
      </header>

      <main className="admin-main">

        {/* ── ORDERS ─────────────────────────────────────────────────────── */}
        {tab === "orders" && (
          <>
            <div className="admin-stats-row">
              <div className="admin-stat-card"><span className="stat-label">Total</span><span className="stat-value">{orderStats.total}</span></div>
              <div className="admin-stat-card highlight"><span className="stat-label">New</span><span className="stat-value">{orderStats.new}</span></div>
              <div className="admin-stat-card"><span className="stat-label">Confirmed</span><span className="stat-value">{orderStats.confirmed}</span></div>
              <div className="admin-stat-card"><span className="stat-label">Dispatched</span><span className="stat-value">{orderStats.dispatched}</span></div>
              <div className="admin-stat-card revenue"><span className="stat-label">Revenue</span><span className="stat-value">KES {orderStats.revenue.toLocaleString()}</span></div>
            </div>

            <div className="admin-toolbar">
              <div className="admin-status-filters">
                {["all", "new", "confirmed", "dispatched", "delivered", "cancelled"].map(s => (
                  <button key={s} className={`filter-pill ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
                    {s === "all" ? "All" : STATUS_LABELS[s].label}
                    {s !== "all" && s !== "delivered" && s !== "cancelled" && (
                      <span className="filter-count">{orders.filter(o => o.status === s).length}</span>
                    )}
                  </button>
                ))}
              </div>
              <button className="admin-btn-ghost-dark" onClick={fetchOrders}>↻ Refresh</button>
            </div>

            {ordersLoading ? (
              <div className="admin-loading"><div className="admin-spinner" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="admin-empty">
                <p>{statusFilter === "all" ? "No orders yet. They'll appear here when customers place orders." : `No ${statusFilter} orders.`}</p>
              </div>
            ) : (
              <div className="admin-orders-list">
                {filteredOrders.map(order => {
                  const st = STATUS_LABELS[order.status];
                  const isExpanded = expandedOrder === order.id;
                  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
                  return (
                    <div key={order.id} className={`admin-order-card ${isExpanded ? "expanded" : ""}`}>
                      <div className="admin-order-header" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                        <div className="admin-order-meta">
                          <span className="order-number">{order.order_number}</span>
                          <span className={`order-status-badge ${st.color}`}>{st.label}</span>
                        </div>
                        <div className="admin-order-customer">
                          <span className="order-customer-name">{order.customer_name}</span>
                          <span className="order-customer-sub">{order.customer_city} · {order.customer_phone}</span>
                        </div>
                        <div className="admin-order-right">
                          <span className="order-total">KES {order.total.toLocaleString()}</span>
                          <span className="order-date">{formatDate(order.created_at)}</span>
                        </div>
                        <span className="order-chevron">{isExpanded ? "▲" : "▼"}</span>
                      </div>

                      {isExpanded && (
                        <div className="admin-order-body">
                          <div className="order-items-list">
                            <p className="order-section-label">Items</p>
                            {order.items.map((item, i) => (
                              <div key={i} className="order-item-row">
                                <span className="order-item-name">{item.product_name}</span>
                                <span className="order-item-qty">× {item.quantity}</span>
                                <span className="order-item-price">KES {(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="order-item-row order-total-row">
                              <span>Total</span><span /><span>KES {order.total.toLocaleString()}</span>
                            </div>
                          </div>

                          {order.notes && (
                            <div className="order-notes">
                              <p className="order-section-label">Notes</p>
                              <p>{order.notes}</p>
                            </div>
                          )}

                          <div className="order-actions">
                            {nextStatus && (
                              <button className="admin-btn-advance" onClick={() => handleStatusChange(order.id, nextStatus)}>
                                Mark as {STATUS_LABELS[nextStatus].label} →
                              </button>
                            )}
                            {order.status !== "cancelled" && order.status !== "delivered" && (
                              <button className="admin-btn-cancel-order" onClick={() => handleStatusChange(order.id, "cancelled")}>Cancel</button>
                            )}
                            <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="admin-btn-whatsapp">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              Message
                            </a>
                            <button className="admin-btn-invoice" onClick={() => setInvoiceOrder(order)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                              </svg>
                              Invoice
                            </button>
                            <button className="admin-btn-delete-sm" onClick={() => setDeleteOrderConfirm(order)}>Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── PRODUCTS ────────────────────────────────────────────────────── */}
        {tab === "products" && (
          <>
            <div className="admin-toolbar">
              <div>
                <h2 className="admin-section-title">Products</h2>
                <p className="admin-section-sub">{products.length} product{products.length !== 1 ? "s" : ""} in catalog</p>
              </div>
              <button className="admin-btn-primary" onClick={openAdd}>+ Add Product</button>
            </div>

            {productsLoading ? (
              <div className="admin-loading"><div className="admin-spinner" /></div>
            ) : (
              <>
                {/* Desktop: scrollable table */}
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Product</th><th>Category</th><th>Origin</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="admin-product-cell">
                              <img src={p.image} alt={p.name} className="admin-product-thumb" />
                              <div>
                                <p className="admin-product-name">{p.name}</p>
                                {p.badge && <span className="admin-badge">{p.badge}</span>}
                              </div>
                            </div>
                          </td>
                          <td><span className="admin-category-tag">{p.category}</span></td>
                          <td className="admin-origin">{p.origin}</td>
                          <td className="admin-price">KES {p.price.toLocaleString()}</td>
                          <td>
                            <button className={`admin-stock-toggle ${p.in_stock ? "in" : "out"}`} onClick={() => handleToggleStock(p.id)}>
                              {p.in_stock ? "In Stock" : "Out of Stock"}
                            </button>
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button className="admin-btn-edit" onClick={() => openEdit(p)}>Edit</button>
                              <button className="admin-btn-delete" onClick={() => setDeleteConfirm(p)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: stacked cards */}
                <div className="admin-product-cards">
                  {products.map((p) => (
                    <div key={p.id} className="admin-product-mobile-card">
                      <img src={p.image} alt={p.name} className="admin-product-mobile-img" />
                      <div className="admin-product-mobile-body">
                        <div className="admin-product-mobile-row">
                          <p className="admin-product-name">{p.name}</p>
                          {p.badge && <span className="admin-badge">{p.badge}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 300 }}>{p.origin}</p>
                        <div className="admin-product-mobile-row" style={{ marginTop: 4 }}>
                          <span className="admin-price" style={{ fontSize: 15 }}>KES {p.price.toLocaleString()}</span>
                          <span className="admin-category-tag">{p.category}</span>
                        </div>
                        <div className="admin-product-mobile-actions">
                          <button className={`admin-stock-toggle ${p.in_stock ? "in" : "out"}`} onClick={() => handleToggleStock(p.id)}>
                            {p.in_stock ? "In Stock" : "Out of Stock"}
                          </button>
                          <button className="admin-btn-edit" onClick={() => openEdit(p)}>Edit</button>
                          <button className="admin-btn-delete" onClick={() => setDeleteConfirm(p)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* ── Invoice Modal ─────────────────────────────────────────────────── */}
      {invoiceOrder && (
        <div className="admin-modal-backdrop" onClick={() => setInvoiceOrder(null)}>
          <div className="admin-modal invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Invoice — {invoiceOrder.order_number}</h3>
              <button className="admin-modal-close" onClick={() => setInvoiceOrder(null)}>✕</button>
            </div>
            <div className="invoice-preview">
              <Invoice order={invoiceOrder} />
            </div>
            <div className="invoice-modal-actions">
              <button className="admin-btn-ghost-dark" onClick={() => setInvoiceOrder(null)}>Close</button>
              <button className="admin-btn-primary" onClick={handlePrint}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                  <polyline points="6 9 6 2 18 2 18 9"/>
                  <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                  <rect x="6" y="14" width="12" height="8"/>
                </svg>
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Modal ─────────────────────────────────────────────────── */}
      {modal && (
        <div className="admin-modal-backdrop" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modal === "edit" ? "Edit Product" : "Add New Product"}</h3>
              <button className="admin-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-form">
              <div className="admin-form-grid">
                <div className="admin-field span-2">
                  <label>Product Name *</label>
                  <input name="name" value={form.name} onChange={handleFormChange} placeholder="e.g. Kenya AA Kiambu" required />
                </div>
                <div className="admin-field">
                  <label>Category *</label>
                  <select name="category" value={form.category} onChange={handleFormChange}>
                    <option value="whole-bean">Whole Bean</option>
                    <option value="ground">Ground</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>Price (KES) *</label>
                  <input type="number" name="price" value={form.price} onChange={handleFormChange} placeholder="1800" required />
                </div>
                <div className="admin-field">
                  <label>Weight</label>
                  <input name="weight" value={form.weight} onChange={handleFormChange} placeholder="250g" />
                </div>
                <div className="admin-field">
                  <label>Origin *</label>
                  <input name="origin" value={form.origin} onChange={handleFormChange} placeholder="Kiambu, Kenya" required />
                </div>
                <div className="admin-field span-2">
                  <label>Description *</label>
                  <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Describe the coffee..." required />
                </div>
                <div className="admin-field span-2">
                  <label>Flavor Notes <span className="admin-field-hint">(comma separated)</span></label>
                  <input name="flavor_notes" value={form.flavor_notes} onChange={handleFormChange} placeholder="Blackcurrant, Brown sugar, Citrus" />
                </div>
                <div className="admin-field">
                  <label>Badge <span className="admin-field-hint">(optional)</span></label>
                  <input name="badge" value={form.badge} onChange={handleFormChange} placeholder="Staff Pick, New, Limited..." />
                </div>
                <div className="admin-field span-2">
                  <label>Product Image</label>
                  <div className="admin-image-upload-wrap">
                    <label className={`admin-upload-btn ${uploading ? "uploading" : ""}`}>
                      {uploading ? "Uploading..." : "📁 Upload from device"}
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={uploading} style={{ display: "none" }} />
                    </label>
                    <span className="admin-upload-or">or</span>
                    <input
                      name="image"
                      value={form.image}
                      onChange={handleFormChange}
                      placeholder="Paste image URL (https://...)"
                      className="admin-upload-url-input"
                    />
                  </div>
                  {form.image && (
                    <img src={form.image} alt="preview" className="admin-img-preview" style={{ marginTop: 10 }} onError={(e) => e.target.style.display = "none"} />
                  )}
                </div>
                <div className="admin-field span-2">
                  <label className="admin-checkbox-label">
                    <input type="checkbox" name="in_stock" checked={form.in_stock} onChange={handleFormChange} />
                    <span>In Stock</span>
                  </label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-ghost-dark" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? "Saving..." : modal === "edit" ? "Save Changes" : "Add Product"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm delete product ────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Delete Product</h3>
              <button className="admin-modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="admin-delete-body"><p>Delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p></div>
            <div className="admin-modal-footer">
              <button className="admin-btn-ghost-dark" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="admin-btn-delete-confirm" onClick={() => handleDeleteProduct(deleteConfirm.id)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete order ──────────────────────────────────────────── */}
      {deleteOrderConfirm && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteOrderConfirm(null)}>
          <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Delete Order</h3>
              <button className="admin-modal-close" onClick={() => setDeleteOrderConfirm(null)}>✕</button>
            </div>
            <div className="admin-delete-body"><p>Delete order <strong>{deleteOrderConfirm.order_number}</strong> from {deleteOrderConfirm.customer_name}? This cannot be undone.</p></div>
            <div className="admin-modal-footer">
              <button className="admin-btn-ghost-dark" onClick={() => setDeleteOrderConfirm(null)}>Cancel</button>
              <button className="admin-btn-delete-confirm" onClick={() => handleDeleteOrder(deleteOrderConfirm.id)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
