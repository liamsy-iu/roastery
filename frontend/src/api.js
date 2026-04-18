const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchProducts(category) {
  const url = category ? `${BASE}/products?category=${category}` : `${BASE}/products`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function fetchProduct(id) {
  const res = await fetch(`${BASE}/products/${id}`);
  if (!res.ok) throw new Error("Product not found");
  return res.json();
}

export async function createWhatsAppOrder(order) {
  const res = await fetch(`${BASE}/orders/whatsapp-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) throw new Error("Failed to create order");
  return res.json();
}

export async function sendContact(msg) {
  const res = await fetch(`${BASE}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}
