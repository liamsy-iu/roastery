from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json

app = FastAPI(title="65° Coffee Roastery API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class Product(BaseModel):
    id: int
    name: str
    category: str  # "whole-bean" | "ground" | "subscription"
    description: str
    origin: str
    flavor_notes: list[str]
    price: float
    weight: str
    image: str
    badge: Optional[str] = None
    in_stock: bool = True

class OrderItem(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    price: float

class Order(BaseModel):
    items: List[OrderItem]
    customer_name: str
    customer_phone: str
    customer_city: str
    notes: Optional[str] = ""

class ContactMessage(BaseModel):
    name: str
    email: str
    message: str

# --- Product Catalog ---
PRODUCTS = [
    {
        "id": 1,
        "name": "Ard Al Yaman",
        "category": "whole-bean",
        "description": "A rare Yemeni single-origin with centuries of heritage. Wild-grown at elevation, naturally processed on raised beds.",
        "origin": "Yemen",
        "flavor_notes": ["Dark chocolate", "Dried fig", "Cardamom"],
        "price": 85.00,
        "weight": "250g",
        "image": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80",
        "badge": "Single Origin",
        "in_stock": True,
    },
    {
        "id": 2,
        "name": "Ethiopian Yirgacheffe",
        "category": "whole-bean",
        "description": "Washed and sun-dried to perfection. Grown by small-holder farmers in the birthplace of coffee.",
        "origin": "Ethiopia",
        "flavor_notes": ["Jasmine", "Lemon zest", "Peach"],
        "price": 75.00,
        "weight": "250g",
        "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
        "badge": "Staff Pick",
        "in_stock": True,
    },
    {
        "id": 3,
        "name": "Sixty-Five Espresso",
        "category": "whole-bean",
        "description": "Our signature house blend, roasted to bring out rich body and smooth crema. The everyday cup, perfected.",
        "origin": "Brazil × Colombia",
        "flavor_notes": ["Hazelnut", "Caramel", "Dark cocoa"],
        "price": 65.00,
        "weight": "250g",
        "image": "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&q=80",
        "badge": "House Blend",
        "in_stock": True,
    },
    {
        "id": 4,
        "name": "Colombian Huila",
        "category": "ground",
        "description": "Medium-fine ground for drip and pour-over. Grown at high altitude in the Huila department.",
        "origin": "Colombia",
        "flavor_notes": ["Brown sugar", "Red apple", "Walnut"],
        "price": 60.00,
        "weight": "250g",
        "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
        "in_stock": True,
    },
    {
        "id": 5,
        "name": "Sumatra Mandheling",
        "category": "ground",
        "description": "Wet-hulled and medium-coarse ground, perfect for French press. Bold, earthy, and unforgettable.",
        "origin": "Indonesia",
        "flavor_notes": ["Cedar", "Dark chocolate", "Tobacco"],
        "price": 60.00,
        "weight": "250g",
        "image": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=600&q=80",
        "in_stock": True,
    },
    {
        "id": 6,
        "name": "The Explorer Box",
        "category": "subscription",
        "description": "Every month, two new single-origin coffees chosen by our head roaster. Whole bean. Free shipping. Cancel anytime.",
        "origin": "Rotating — 12+ countries/year",
        "flavor_notes": ["Varies monthly", "Curated", "Surprising"],
        "price": 120.00,
        "weight": "2 × 250g",
        "image": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
        "badge": "Monthly",
        "in_stock": True,
    },
    {
        "id": 7,
        "name": "The Roaster's Pick",
        "category": "subscription",
        "description": "Our most exclusive subscription. One exceptional micro-lot per month, hand-selected from auctions worldwide.",
        "origin": "Worldwide",
        "flavor_notes": ["Exclusive lots", "Limited quantity", "Premium"],
        "price": 180.00,
        "weight": "250g",
        "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
        "badge": "Limited",
        "in_stock": True,
    },
]

# --- Routes ---
@app.get("/")
def root():
    return {"message": "65° Coffee Roastery API", "version": "1.0"}

@app.get("/products", response_model=List[Product])
def get_products(category: Optional[str] = None):
    if category:
        return [p for p in PRODUCTS if p["category"] == category]
    return PRODUCTS

@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: int):
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/orders/whatsapp-link")
def create_whatsapp_order(order: Order):
    """Generate a WhatsApp pre-filled link for the order."""
    WHATSAPP_NUMBER = "966500000000"  # Replace with actual number

    lines = [f"🌿 *65° Coffee Roastery — New Order*", ""]
    lines.append(f"👤 Customer: {order.customer_name}")
    lines.append(f"📍 City: {order.customer_city}")
    lines.append(f"📱 Phone: {order.customer_phone}")
    lines.append("")
    lines.append("☕ *Order Details:*")

    total = 0
    for item in order.items:
        subtotal = item.quantity * item.price
        total += subtotal
        lines.append(f"  • {item.product_name} × {item.quantity} — SAR {subtotal:.2f}")

    lines.append("")
    lines.append(f"💰 *Total: SAR {total:.2f}*")

    if order.notes:
        lines.append(f"\n📝 Notes: {order.notes}")

    message = "\n".join(lines)
    import urllib.parse
    encoded = urllib.parse.quote(message)
    whatsapp_url = f"https://wa.me/{WHATSAPP_NUMBER}?text={encoded}"

    return {
        "whatsapp_url": whatsapp_url,
        "total": total,
        "message": "Order ready to send via WhatsApp"
    }

@app.post("/contact")
def send_contact(msg: ContactMessage):
    # In production: send email via SendGrid/SMTP
    return {"success": True, "message": "Message received. We'll be in touch within 24 hours."}
