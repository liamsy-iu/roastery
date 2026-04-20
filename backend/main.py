from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import json, os, secrets, urllib.parse, shutil, uuid
import httpx
from datetime import datetime

app = FastAPI(title="65° Coffee Roastery API")
security = HTTPBasic()

# --- Static file serving for uploaded images ---
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images at /images/filename
app.mount("/images", StaticFiles(directory=UPLOAD_DIR), name="images")

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

LEADS_FILE = os.path.join(BASE_DIR, "leads.json")
DISCOUNTS_FILE = os.path.join(BASE_DIR, "discounts.json")

def load_leads():
    if os.path.exists(LEADS_FILE):
        with open(LEADS_FILE, "r") as f:
            return json.load(f)
    return []

def save_leads(leads):
    with open(LEADS_FILE, "w") as f:
        json.dump(leads, f, indent=2)

def load_discounts():
    if os.path.exists(DISCOUNTS_FILE):
        with open(DISCOUNTS_FILE, "r") as f:
            return json.load(f)
    return [
        {"code": "WELCOME15", "type": "percent", "value": 15, "active": True, "uses": 0}
    ]

def save_discounts(discounts):
    with open(DISCOUNTS_FILE, "w") as f:
        json.dump(discounts, f, indent=2)

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

class WholesaleEnquiry(BaseModel):
    name: str
    business_name: str
    phone: str
    city: str
    volume: str
    message: Optional[str] = ""

class OrderWithDiscount(BaseModel):
    items: List[OrderItem]
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = ""
    customer_city: str
    notes: Optional[str] = ""
    discount_code: Optional[str] = ""
    discount_value: Optional[float] = 0
    discount_type: Optional[str] = ""

class DiscountCode(BaseModel):
    code: str
    type: str
    value: float
    active: bool = True

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

def send_email(to: str, subject: str, html: str):
    RESEND_KEY = os.environ.get("RESEND_API_KEY", "")
    if not RESEND_KEY:
        print(f"[Email skipped — no RESEND_API_KEY] To: {to} | Subject: {subject}")
        return
    try:
        httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_KEY}", "Content-Type": "application/json"},
            json={
                "from": "65° Roastery <orders@sixtyfivedegrees.com>",
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=8,
        )
    except Exception as e:
        print(f"[Email error] {e}")

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

# --- Admin: Image Upload ---
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 5

@app.post("/admin/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    username: str = Depends(require_admin)
):
    # Validate type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed.")

    # Read and check size
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"Image must be under {MAX_SIZE_MB}MB.")

    # Save with unique filename
    ext = file.filename.rsplit(".", 1)[-1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Return the public URL
    backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000")
    return {"url": f"{backend_url}/images/{filename}", "filename": filename}

# --- Wholesale Enquiries ---
@app.post("/wholesale/enquiry")
def submit_wholesale_enquiry(enquiry: WholesaleEnquiry):
    leads = load_leads()
    new_id = max((l["id"] for l in leads), default=0) + 1
    lead = {
        "id": new_id,
        "name": enquiry.name,
        "business_name": enquiry.business_name,
        "phone": enquiry.phone,
        "city": enquiry.city,
        "volume": enquiry.volume,
        "message": enquiry.message or "",
        "status": "new",
        "created_at": datetime.utcnow().isoformat(),
    }
    leads.append(lead)
    save_leads(leads)
    WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "254700000000")
    lines = ["🏢 *65° Roastery — Wholesale Enquiry*", "",
             f"👤 {enquiry.name} ({enquiry.business_name})",
             f"📍 {enquiry.city}", f"📱 {enquiry.phone}", f"📦 Volume: {enquiry.volume}"]
    if enquiry.message:
        lines.append(f"💬 {enquiry.message}")
    wa_url = f"https://wa.me/{WHATSAPP_NUMBER}?text={urllib.parse.quote(chr(10).join(lines))}"
    send_email(
        to=os.environ.get("ALERT_EMAIL", "65degreescoffee@gmail.com"),
        subject=f"New Wholesale Enquiry — {enquiry.business_name}",
        html=f"<h2>New Wholesale Enquiry</h2><p><b>Name:</b> {enquiry.name}</p><p><b>Business:</b> {enquiry.business_name}</p><p><b>Phone:</b> {enquiry.phone}</p><p><b>City:</b> {enquiry.city}</p><p><b>Volume:</b> {enquiry.volume}</p><p><b>Message:</b> {enquiry.message or '—'}</p>"
    )
    return {"success": True, "whatsapp_url": wa_url, "lead_id": new_id}

@app.get("/admin/leads")
def admin_get_leads(username: str = Depends(require_admin)):
    return sorted(load_leads(), key=lambda l: l["created_at"], reverse=True)

@app.patch("/admin/leads/{lead_id}/status")
def admin_update_lead_status(lead_id: int, update: dict, username: str = Depends(require_admin)):
    leads = load_leads()
    idx = next((i for i, l in enumerate(leads) if l["id"] == lead_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    leads[idx]["status"] = update.get("status", leads[idx]["status"])
    save_leads(leads)
    return leads[idx]

@app.delete("/admin/leads/{lead_id}")
def admin_delete_lead(lead_id: int, username: str = Depends(require_admin)):
    leads = load_leads()
    new_list = [l for l in leads if l["id"] != lead_id]
    if len(new_list) == len(leads):
        raise HTTPException(status_code=404, detail="Lead not found")
    save_leads(new_list)
    return {"success": True}

# --- Discount Codes ---
@app.post("/discounts/validate")
def validate_discount(body: dict):
    code = body.get("code", "").strip().upper()
    discount = next((d for d in load_discounts() if d["code"].upper() == code and d["active"]), None)
    if not discount:
        raise HTTPException(status_code=404, detail="Invalid or expired discount code.")
    return {"code": discount["code"], "type": discount["type"], "value": discount["value"]}

@app.get("/admin/discounts")
def admin_get_discounts(username: str = Depends(require_admin)):
    return load_discounts()

@app.post("/admin/discounts", status_code=201)
def admin_create_discount(discount: DiscountCode, username: str = Depends(require_admin)):
    discounts = load_discounts()
    if any(d["code"].upper() == discount.code.upper() for d in discounts):
        raise HTTPException(status_code=400, detail="Code already exists.")
    new = {**discount.model_dump(), "code": discount.code.upper(), "uses": 0}
    discounts.append(new)
    save_discounts(discounts)
    return new

@app.patch("/admin/discounts/{code}/toggle")
def admin_toggle_discount(code: str, username: str = Depends(require_admin)):
    discounts = load_discounts()
    idx = next((i for i, d in enumerate(discounts) if d["code"].upper() == code.upper()), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Code not found.")
    discounts[idx]["active"] = not discounts[idx]["active"]
    save_discounts(discounts)
    return discounts[idx]

@app.delete("/admin/discounts/{code}")
def admin_delete_discount(code: str, username: str = Depends(require_admin)):
    discounts = load_discounts()
    new_list = [d for d in discounts if d["code"].upper() != code.upper()]
    if len(new_list) == len(discounts):
        raise HTTPException(status_code=404, detail="Code not found.")
    save_discounts(new_list)
    return {"success": True}

# --- Orders v2 (with discount + email) ---
@app.post("/orders/whatsapp-link-v2")
def create_whatsapp_order_v2(order: OrderWithDiscount):
    WHATSAPP_NUMBER = os.environ.get("WHATSAPP_NUMBER", "254700000000")
    subtotal = sum(item.quantity * item.price for item in order.items)
    discount_amount = 0.0
    if order.discount_code and order.discount_value:
        if order.discount_type == "percent":
            discount_amount = round(subtotal * order.discount_value / 100, 2)
        else:
            discount_amount = min(order.discount_value, subtotal)
        discounts = load_discounts()
        for d in discounts:
            if d["code"].upper() == order.discount_code.upper():
                d["uses"] = d.get("uses", 0) + 1
        save_discounts(discounts)
    total = round(subtotal - discount_amount, 2)
    orders = load_orders()
    new_id = max((o["id"] for o in orders), default=1000) + 1
    new_order = {
        "id": new_id, "order_number": f"ORD-{new_id}", "status": "new",
        "customer_name": order.customer_name, "customer_phone": order.customer_phone,
        "customer_email": order.customer_email or "", "customer_city": order.customer_city,
        "notes": order.notes or "", "items": [item.model_dump() for item in order.items],
        "subtotal": subtotal, "discount_code": order.discount_code or "",
        "discount_amount": discount_amount, "total": total,
        "created_at": datetime.utcnow().isoformat(), "updated_at": datetime.utcnow().isoformat(),
    }
    orders.append(new_order)
    save_orders(orders)
    lines = [f"🌿 *65° Coffee Roastery — {new_order['order_number']}*", "",
             f"👤 {order.customer_name}", f"📍 {order.customer_city}", f"📱 {order.customer_phone}", "", "☕ *Order:*"]
    for item in order.items:
        lines.append(f"  • {item.product_name} × {item.quantity} — KES {(item.quantity * item.price):.0f}")
    lines.append("")
    if discount_amount:
        lines.append(f"🏷️ Discount ({order.discount_code}): -KES {discount_amount:.0f}")
    lines.append(f"💰 *Total: KES {total:.0f}*")
    if order.notes:
        lines.append(f"📝 {order.notes}")
    wa_url = f"https://wa.me/{WHATSAPP_NUMBER}?text={urllib.parse.quote(chr(10).join(lines))}"
    items_html = "".join(f"<tr><td>{i.product_name}</td><td>×{i.quantity}</td><td>KES {i.quantity*i.price:.0f}</td></tr>" for i in order.items)
    discount_row = f"<tr><td colspan='2'><b>Discount ({order.discount_code})</b></td><td>-KES {discount_amount:.0f}</td></tr>" if discount_amount else ""
    send_email(
        to=os.environ.get("ALERT_EMAIL", "65degreescoffee@gmail.com"),
        subject=f"New Order — {new_order['order_number']} from {order.customer_name}",
        html=f"<h2>New Order {new_order['order_number']}</h2><p><b>Customer:</b> {order.customer_name}</p><p><b>Phone:</b> {order.customer_phone}</p><p><b>City:</b> {order.customer_city}</p><table border='1' cellpadding='6' style='border-collapse:collapse'><tr><th>Item</th><th>Qty</th><th>Price</th></tr>{items_html}{discount_row}<tr><td colspan='2'><b>Total</b></td><td><b>KES {total:.0f}</b></td></tr></table>{'<p><b>Notes:</b> ' + order.notes + '</p>' if order.notes else ''}"
    )
    if order.customer_email:
        send_email(
            to=order.customer_email,
            subject=f"Your 65° order is confirmed — {new_order['order_number']}",
            html=f"<div style='font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1C1008'><h1 style='color:#C8922A'>65°</h1><h2>Thanks, {order.customer_name}!</h2><p>Your order has been received. We'll be in touch shortly to confirm delivery.</p><table border='1' cellpadding='8' style='border-collapse:collapse;width:100%'><tr style='background:#1C1008;color:#F5EFE0'><th>Item</th><th>Qty</th><th>Price</th></tr>{items_html}{discount_row}<tr><td colspan='2'><b>Total</b></td><td><b>KES {total:.0f}</b></td></tr></table><p style='margin-top:24px;color:#8B6845'>Questions? WhatsApp: +254 700 000 000</p></div>"
        )
    return {"whatsapp_url": wa_url, "total": total, "discount_amount": discount_amount, "order_number": new_order["order_number"]}