import { useState, useEffect, useCallback } from "react";
import "./Admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders(user, pass) {
  return {
    "Content-Type": "application/json",
    Authorization: "Basic " + btoa(`${user}:${pass}`),
  };
}

const EMPTY_FORM = {
  name: "",
  category: "whole-bean",
  description: "",
  origin: "",
  flavor_notes: "",
  price: "",
  weight: "250g",
  image: "",
  badge: "",
  in_stock: true,
};

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [creds, setCreds] = useState({ user: "", pass: "" });
  const [loginError, setLoginError] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // null | "add" | "edit"
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/products`, {
        headers: authHeaders(creds.user, creds.pass),
      });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      setProducts(await res.json());
    } catch {
      showToast("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [creds]);

  useEffect(() => {
    if (authed) fetchProducts();
  }, [authed, fetchProducts]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${API}/admin/products`, {
        headers: authHeaders(creds.user, creds.pass),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setLoginError("Incorrect username or password.");
      }
    } catch {
      setLoginError("Could not reach the server. Check your connection.");
    }
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal("add");
  };

  const openEdit = (product) => {
    setForm({
      ...product,
      flavor_notes: product.flavor_notes.join(", "),
      badge: product.badge || "",
    });
    setEditId(product.id);
    setModal("edit");
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      price: parseFloat(form.price),
      flavor_notes: form.flavor_notes
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean),
      badge: form.badge.trim() || null,
    };
    try {
      const url =
        modal === "edit"
          ? `${API}/admin/products/${editId}`
          : `${API}/admin/products`;
      const method = modal === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(creds.user, creds.pass),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showToast(modal === "edit" ? "Product updated!" : "Product added!");
      setModal(null);
      fetchProducts();
    } catch {
      showToast("Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/admin/products/${id}`, {
        method: "DELETE",
        headers: authHeaders(creds.user, creds.pass),
      });
      if (!res.ok) throw new Error();
      showToast("Product deleted.");
      setDeleteConfirm(null);
      fetchProducts();
    } catch {
      showToast("Failed to delete product.");
    }
  };

  const handleToggleStock = async (id) => {
    try {
      const res = await fetch(`${API}/admin/products/${id}/stock`, {
        method: "PATCH",
        headers: authHeaders(creds.user, creds.pass),
      });
      if (!res.ok) throw new Error();
      fetchProducts();
    } catch {
      showToast("Failed to update stock.");
    }
  };

  // --- Login screen ---
  if (!authed) {
    return (
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          <div className="admin-logo">
            <span className="admin-logo-deg">65°</span>
            <span className="admin-logo-label">Admin</span>
          </div>
          <h1>Sign in</h1>
          <p>Product management for 65° Roastery</p>
          <form onSubmit={handleLogin} className="login-form">
            <div className="admin-field">
              <label>Username</label>
              <input
                type="text"
                value={creds.user}
                onChange={(e) => setCreds({ ...creds, user: e.target.value })}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
            <div className="admin-field">
              <label>Password</label>
              <input
                type="password"
                value={creds.pass}
                onChange={(e) => setCreds({ ...creds, pass: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            {loginError && <p className="admin-error">{loginError}</p>}
            <button type="submit" className="admin-btn-primary">
              Sign In
            </button>
          </form>
          <a href="/" className="admin-back-link">
            ← Back to store
          </a>
        </div>
      </div>
    );
  }

  // --- Main admin UI ---
  return (
    <div className="admin-wrap">
      {toast && <div className="admin-toast">{toast}</div>}

      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-logo-deg">65°</span>
          <span className="admin-header-title">Product Manager</span>
        </div>
        <div className="admin-header-right">
          <a
            href="/"
            className="admin-btn-ghost"
            target="_blank"
            rel="noreferrer"
          >
            View Store ↗
          </a>
          <button className="admin-btn-ghost" onClick={() => setAuthed(false)}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-toolbar">
          <div>
            <h2 className="admin-section-title">Products</h2>
            <p className="admin-section-sub">
              {products.length} product{products.length !== 1 ? "s" : ""} in
              catalog
            </p>
          </div>
          <button className="admin-btn-primary" onClick={openAdd}>
            + Add Product
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner" />
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Origin</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-product-cell">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="admin-product-thumb"
                        />
                        <div>
                          <p className="admin-product-name">{p.name}</p>
                          {p.badge && (
                            <span className="admin-badge">{p.badge}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-category-tag">{p.category}</span>
                    </td>
                    <td className="admin-origin">{p.origin}</td>
                    <td className="admin-price">
                      KES {p.price.toLocaleString()}
                    </td>
                    <td>
                      <button
                        className={`admin-stock-toggle ${p.in_stock ? "in" : "out"}`}
                        onClick={() => handleToggleStock(p.id)}
                        title="Click to toggle stock"
                      >
                        {p.in_stock ? "In Stock" : "Out of Stock"}
                      </button>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn-edit"
                          onClick={() => openEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn-delete"
                          onClick={() => setDeleteConfirm(p)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="admin-modal-backdrop" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{modal === "edit" ? "Edit Product" : "Add New Product"}</h3>
              <button
                className="admin-modal-close"
                onClick={() => setModal(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-form">
              <div className="admin-form-grid">
                <div className="admin-field span-2">
                  <label>Product Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Kenya AA Kiambu"
                    required
                  />
                </div>
                <div className="admin-field">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                  >
                    <option value="whole-bean">Whole Bean</option>
                    <option value="ground">Ground</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>
                <div className="admin-field">
                  <label>Price (KES) *</label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleFormChange}
                    placeholder="1800"
                    required
                  />
                </div>
                <div className="admin-field">
                  <label>Weight</label>
                  <input
                    name="weight"
                    value={form.weight}
                    onChange={handleFormChange}
                    placeholder="250g"
                  />
                </div>
                <div className="admin-field">
                  <label>Origin *</label>
                  <input
                    name="origin"
                    value={form.origin}
                    onChange={handleFormChange}
                    placeholder="Kiambu, Kenya"
                    required
                  />
                </div>
                <div className="admin-field span-2">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="Describe the coffee..."
                    required
                  />
                </div>
                <div className="admin-field span-2">
                  <label>
                    Flavor Notes{" "}
                    <span className="admin-field-hint">(comma separated)</span>
                  </label>
                  <input
                    name="flavor_notes"
                    value={form.flavor_notes}
                    onChange={handleFormChange}
                    placeholder="Blackcurrant, Brown sugar, Citrus"
                  />
                </div>
                <div className="admin-field">
                  <label>
                    Badge <span className="admin-field-hint">(optional)</span>
                  </label>
                  <input
                    name="badge"
                    value={form.badge}
                    onChange={handleFormChange}
                    placeholder="Staff Pick, New, Limited..."
                  />
                </div>
                <div className="admin-field">
                  <label>Image URL *</label>
                  <input
                    name="image"
                    value={form.image}
                    onChange={handleFormChange}
                    placeholder="https://..."
                    required
                  />
                </div>
                {form.image && (
                  <div className="admin-field span-2">
                    <label>Image Preview</label>
                    <img
                      src={form.image}
                      alt="preview"
                      className="admin-img-preview"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                )}
                <div className="admin-field span-2">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      name="in_stock"
                      checked={form.in_stock}
                      onChange={handleFormChange}
                    />
                    <span>In Stock</span>
                  </label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn-ghost"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : modal === "edit"
                      ? "Save Changes"
                      : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="admin-modal admin-modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>Delete Product</h3>
              <button
                className="admin-modal-close"
                onClick={() => setDeleteConfirm(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-delete-body">
              <p>
                Are you sure you want to delete{" "}
                <strong>{deleteConfirm.name}</strong>? This cannot be undone.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                className="admin-btn-ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="admin-btn-delete-confirm"
                onClick={() => handleDelete(deleteConfirm.id)}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
