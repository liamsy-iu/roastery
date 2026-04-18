from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from typing import List, Optional
import json, os, secrets, urllib.parse
from datetime import datetime

app = FastAPI(title="65° Coffee Roastery API", root_path="")
security = HTTPBasic()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Admin credentials ---
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "changeme123")

def require_admin(credentials: HTTPBasicCredentials = Depends(security)):
    ok_user = secrets.compare_digest(credentials.username, ADMIN_USER)
    ok_pass = secrets.compare_digest(credentials.password, ADMIN_PASS)
    if not (ok_user and ok_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# --- File persistence ---
BASE_DIR = os.path.dirname(__file__)
PRODUCTS_FILE = os.path.join(BASE_DIR, "products.json")
ORDERS_FILE = os.path.join(BASE_DIR, "orders.json")

DEFAULT_PRODUCTS = [
    {"id": 1, "name": "Kenya AA Kiambu", "category": "whole-bean", "description": "Our flagship Kenyan single-origin, sourced from small farms in Kiambu County. Washed and dried on raised beds under Nairobi's highland sun.", "origin": "Kiambu, Kenya", "flavor_notes": ["Blackcurrant", "Brown sugar", "Bright citrus"], "price": 1800.0, "weight": "250g", "image": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80", "badge": "Single Origin", "in_stock": True},
    {"id": 2, "name": "Ethiopian Yirgacheffe", "category": "whole-bean", "description": "Washed and sun-dried to perfection. Grown by small-holder farmers in the birthplace of coffee.", "origin": "Yirgacheffe, Ethiopia", "flavor_notes": ["Jasmine", "Lemon zest", "Peach"], "price": 1600.0, "weight": "250g", "image": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", "badge": "Staff Pick", "in_stock": True},
    {"id": 3, "name": "Sixty-Five Espresso", "category": "whole-bean", "description": "Our signature house blend, roasted to bring out rich body and smooth crema. The everyday cup, perfected.", "origin": "Brazil × Colombia", "flavor_notes": ["Hazelnut", "Caramel", "Dark cocoa"], "price": 1400.0, "weight": "250g", "image": "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&q=80", "badge": "House Blend", "in_stock": True},
    {"id": 4, "name": "Colombian Huila", "category": "ground", "description": "Medium-fine ground for drip and pour-over. Grown at high altitude in the Huila department.", "origin": "Huila, Colombia", "flavor_notes": ["Brown sugar", "Red apple", "Walnut"], "price": 1300.0, "weight": "250g", "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80", "badge": None, "in_stock": True},
    {"id": 5, "name": "Kenya Nyeri AB", "category": "ground", "description": "Medium-coarse ground ideal for French press and Chemex. Grown on the slopes of Mt. Kenya in Nyeri County.", "origin": "Nyeri, Kenya", "flavor_notes": ["Tomato", "Grapefruit", "Dark berry"], "price": 1300.0, "weight": "250g", "image": "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=600&q=80", "badge": None, "in_stock": True},
    {"id": 6, "name": "The Explorer Box", "category": "subscription", "description": "Every month, two new single-origin coffees chosen by our head roaster. Whole bean. Free delivery. Cancel anytime.", "origin": "Rotating — 12+ countries/year", "flavor_notes": ["Varies monthly", "Curated", "Surprising"], "price": 2800.0, "weight": "2 × 250g", "image": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80", "badge": "Monthly", "in_stock": True},
    {"id": 7, "name": "The Roaster's Pick", "category": "subscription", "description": "One exceptional micro-lot per month, hand-selected from East African auctions worldwide.", "origin": "East Africa & Beyond", "flavor_notes": ["Exclusive lots", "Limited quantity", "Premium"], "price": 4200.0, "weight": "250g", "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80", "badge": "Limited", "in_stock": True},
]

def load_products():
    if os.path.exists(PRODUCTS_FILE):
        with open(PRODUCTS_FILE, "r") as f:
            return json.load(f)
    return DEFAULT_PRODUCTS

def save_products(products):
    with open(PRODUCTS_FILE, "w") as f:
        json.dump(products, f, indent=2)

def load_orders():
    if os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, "r") as f:
            return json.load(f)
    return []

def save_orders(orders):
    with open(ORDERS_FILE, "w") as f:
        json.dump(orders, f, indent=2)

# --- Data Models ---
class Product(BaseModel):
    id: int
    name: str
    category: str
    description: str
    origin: str
    flavor_notes: List[str]
    price: float
    weight: str
    image: str
    badge: Optional[str] = None
    in_stock: bool = True

class ProductCreate(BaseModel):
    name: str
    category: str
    description: str
    origin: str
    flavor_notes: List[str]
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

class OrderStatusUpdate(BaseModel):
    status: str  # new | confirmed | dispatched | delivered | cancelled

class ContactMessage(BaseModel):
    name: str
    email: str
    message: str

# --- Public Routes ---
@app.get("/")
def root():
    return {"message": "65° Coffee Roastery API", "version": "3.0"}

@app.get("/products", response_model=List[Product])
def get_products(category: Optional[str] = None):
    products = load_products()
    if category:
        return [p for p in products if p["category"] == category]
    return products

@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: int):
    products = load_products()
    product = next((p for p in products if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/orders/whatsapp-link")
def create_whatsapp_order(order: Order):
    WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "254700000000")

    # Calculate total
    total = sum(item.quantity * item.price for item in order.items)

    # Save order to file
    orders = load_orders()
    new_id = max((o["id"] for o in orders), default=1000) + 1
    new_order = {
        "id": new_id,
        "order_number": f"ORD-{new_id}",
        "status": "new",
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "customer_city": order.customer_city,
        "notes": order.notes or "",
        "items": [item.model_dump() for item in order.items],
        "total": total,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    orders.append(new_order)
    save_orders(orders)

    # Build WhatsApp message
    lines = [f"🌿 *65° Coffee Roastery — Order #{new_order['order_number']}*", ""]
    lines.append(f"👤 Customer: {order.customer_name}")
    lines.append(f"📍 City: {order.customer_city}")
    lines.append(f"📱 Phone: {order.customer_phone}")
    lines.append("")
    lines.append("☕ *Order Details:*")
    for item in order.items:
        subtotal = item.quantity * item.price
        lines.append(f"  • {item.product_name} × {item.quantity} — KES {subtotal:.0f}")
    lines.append("")
    lines.append(f"💰 *Total: KES {total:.0f}*")
    if order.notes:
        lines.append(f"\n📝 Notes: {order.notes}")

    message = "\n".join(lines)
    encoded = urllib.parse.quote(message)
    return {
        "whatsapp_url": f"https://wa.me/{WHATSAPP_NUMBER}?text={encoded}",
        "total": total,
        "order_number": new_order["order_number"],
    }

@app.post("/contact")
def send_contact(msg: ContactMessage):
    return {"success": True, "message": "Message received. We'll be in touch within 24 hours."}

# --- Admin: Products ---
@app.get("/admin/products", response_model=List[Product])
def admin_get_products(username: str = Depends(require_admin)):
    return load_products()

@app.post("/admin/products", response_model=Product, status_code=201)
def admin_create_product(product: ProductCreate, username: str = Depends(require_admin)):
    products = load_products()
    new_id = max((p["id"] for p in products), default=0) + 1
    new_product = {"id": new_id, **product.model_dump()}
    products.append(new_product)
    save_products(products)
    return new_product

@app.put("/admin/products/{product_id}", response_model=Product)
def admin_update_product(product_id: int, product: ProductCreate, username: str = Depends(require_admin)):
    products = load_products()
    idx = next((i for i, p in enumerate(products) if p["id"] == product_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = {"id": product_id, **product.model_dump()}
    products[idx] = updated
    save_products(products)
    return updated

@app.delete("/admin/products/{product_id}")
def admin_delete_product(product_id: int, username: str = Depends(require_admin)):
    products = load_products()
    new_list = [p for p in products if p["id"] != product_id]
    if len(new_list) == len(products):
        raise HTTPException(status_code=404, detail="Product not found")
    save_products(new_list)
    return {"success": True, "deleted_id": product_id}

@app.patch("/admin/products/{product_id}/stock", response_model=Product)
def admin_toggle_stock(product_id: int, username: str = Depends(require_admin)):
    products = load_products()
    idx = next((i for i, p in enumerate(products) if p["id"] == product_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Product not found")
    products[idx]["in_stock"] = not products[idx]["in_stock"]
    save_products(products)
    return products[idx]

# --- Admin: Orders ---
@app.get("/admin/orders")
def admin_get_orders(username: str = Depends(require_admin)):
    orders = load_orders()
    # Return newest first
    return sorted(orders, key=lambda o: o["created_at"], reverse=True)

@app.patch("/admin/orders/{order_id}/status")
def admin_update_order_status(order_id: int, update: OrderStatusUpdate, username: str = Depends(require_admin)):
    valid_statuses = {"new", "confirmed", "dispatched", "delivered", "cancelled"}
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    orders = load_orders()
    idx = next((i for i, o in enumerate(orders) if o["id"] == order_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Order not found")
    orders[idx]["status"] = update.status
    orders[idx]["updated_at"] = datetime.utcnow().isoformat()
    save_orders(orders)
    return orders[idx]

@app.delete("/admin/orders/{order_id}")
def admin_delete_order(order_id: int, username: str = Depends(require_admin)):
    orders = load_orders()
    new_list = [o for o in orders if o["id"] != order_id]
    if len(new_list) == len(orders):
        raise HTTPException(status_code=404, detail="Order not found")
    save_orders(new_list)
    return {"success": True, "deleted_id": order_id}
