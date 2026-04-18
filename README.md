# 65° Coffee Roastery — Full Stack Website

A complete specialty coffee e-commerce website built with **React** (frontend) and **Python/FastAPI** (backend), featuring a WhatsApp-based checkout flow.

---

## Project Structure

```
65degrees/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── components/    # All UI components
│   │   ├── context/       # CartContext (global state)
│   │   ├── api.js         # API calls to backend
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css      # Global styles & theme
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── backend/           # Python FastAPI
    ├── main.py
    └── requirements.txt
```

---

## Quick Start

### 1. Backend (Python API)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

API will be live at: `http://localhost:8000`
Swagger docs at: `http://localhost:8000/docs`

### 2. Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Site will be live at: `http://localhost:5173`

---

## Configuration

### WhatsApp Number

In `backend/main.py`, update line 78:

```python
WHATSAPP_NUMBER = "254700000000"  # Replace with your actual WhatsApp number
```

### Backend URL (Production)

In `frontend/src/api.js`, update:

```js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
```

Or create a `.env` file in the frontend folder:

```
VITE_API_URL=https://your-backend-domain.com
```

---

## Features

| Feature              | Details                                                      |
| -------------------- | ------------------------------------------------------------ |
| 🛒 Cart              | Add/remove items, adjust quantity, persistent during session |
| 📱 WhatsApp Checkout | Pre-filled order message sent to your WhatsApp               |
| 🔍 Product Filters   | Filter by Whole Bean / Ground / Subscriptions                |
| 📦 7 Products        | 3 whole bean, 2 ground, 2 subscription tiers                 |
| 📬 Contact Form      | Sends messages via `/contact` endpoint                       |
| 📱 Mobile Responsive | Works on all screen sizes                                    |
| ⚡ Fast              | Vite build, lazy-loaded images                               |

---

## API Endpoints

| Method | Endpoint                | Description                                    |
| ------ | ----------------------- | ---------------------------------------------- |
| GET    | `/products`             | All products (optional `?category=whole-bean`) |
| GET    | `/products/{id}`        | Single product                                 |
| POST   | `/orders/whatsapp-link` | Generate WhatsApp checkout URL                 |
| POST   | `/contact`              | Submit contact form                            |

---

## Deployment

### Frontend → Vercel / Netlify

```bash
cd frontend
npm run build
# Upload the `dist/` folder
```

### Backend → Railway / Render / VPS

```bash
# Set environment and run
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Customization

### Adding Products

Edit the `PRODUCTS` list in `backend/main.py`. Each product needs:

- `id`, `name`, `category`, `description`, `origin`
- `flavor_notes` (list of strings)
- `price` (in KES), `weight`, `image` (URL)
- Optional: `badge`, `in_stock`

### Brand Colors

Edit CSS variables in `frontend/src/index.css`:

```css
:root {
  --cream: #f5efe0;
  --brown-dark: #1c1008;
  --gold: #c8922a;
  /* ... */
}
```

---

Built with ☕ for 65° Coffee Roastery, Nairobi 🇰🇪
