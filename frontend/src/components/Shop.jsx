import { useState, useEffect } from "react";
import { fetchProducts } from "../api";
import ProductCard from "./ProductCard";
import "./Shop.css";

const FILTERS = [
  { key: "", label: "All" },
  { key: "whole-bean", label: "Whole Bean" },
  { key: "ground", label: "Ground" },
  { key: "subscription", label: "Subscriptions" },
];

// Fallback products for when backend isn't available
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "Kenya AA Kiambu",
    category: "whole-bean",
    description:
      "Our flagship Kenyan single-origin, sourced from small farms in Kiambu County. Washed and dried on raised beds under Nairobi's highland sun.",
    origin: "Kiambu, Kenya",
    flavor_notes: ["Blackcurrant", "Brown sugar", "Bright citrus"],
    price: 1800,
    weight: "250g",
    image:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80",
    badge: "Single Origin",
    in_stock: true,
  },
  {
    id: 2,
    name: "Ethiopian Yirgacheffe",
    category: "whole-bean",
    description:
      "Washed and sun-dried to perfection. Grown by small-holder farmers in the birthplace of coffee.",
    origin: "Yirgacheffe, Ethiopia",
    flavor_notes: ["Jasmine", "Lemon zest", "Peach"],
    price: 1600,
    weight: "250g",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
    badge: "Staff Pick",
    in_stock: true,
  },
  {
    id: 3,
    name: "Sixty-Five Espresso",
    category: "whole-bean",
    description:
      "Our signature house blend, roasted to bring out rich body and smooth crema. The everyday cup, perfected.",
    origin: "Brazil × Colombia",
    flavor_notes: ["Hazelnut", "Caramel", "Dark cocoa"],
    price: 1400,
    weight: "250g",
    image:
      "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&q=80",
    badge: "House Blend",
    in_stock: true,
  },
  {
    id: 4,
    name: "Colombian Huila",
    category: "ground",
    description:
      "Medium-fine ground for drip and pour-over. Grown at high altitude in the Huila department.",
    origin: "Huila, Colombia",
    flavor_notes: ["Brown sugar", "Red apple", "Walnut"],
    price: 1300,
    weight: "250g",
    image:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
    badge: null,
    in_stock: true,
  },
  {
    id: 5,
    name: "Kenya Nyeri AB",
    category: "ground",
    description:
      "Medium-coarse ground ideal for French press and Chemex. Grown on the slopes of Mt. Kenya in Nyeri County.",
    origin: "Nyeri, Kenya",
    flavor_notes: ["Tomato", "Grapefruit", "Dark berry"],
    price: 1300,
    weight: "250g",
    image:
      "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=600&q=80",
    badge: null,
    in_stock: true,
  },
  {
    id: 6,
    name: "The Explorer Box",
    category: "subscription",
    description:
      "Every month, two new single-origin coffees chosen by our head roaster. Whole bean. Free delivery. Cancel anytime.",
    origin: "Rotating — 12+ countries/year",
    flavor_notes: ["Varies monthly", "Curated", "Surprising"],
    price: 2800,
    weight: "2 × 250g",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
    badge: "Monthly",
    in_stock: true,
  },
  {
    id: 7,
    name: "The Roaster's Pick",
    category: "subscription",
    description:
      "One exceptional micro-lot per month, hand-selected from East African auctions worldwide.",
    origin: "East Africa & Beyond",
    flavor_notes: ["Exclusive lots", "Limited quantity", "Premium"],
    price: 4200,
    weight: "250g",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
    badge: "Limited",
    in_stock: true,
  },
];

export default function Shop() {
  const [activeFilter, setActiveFilter] = useState("");
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchProducts(activeFilter || undefined)
      .then(setProducts)
      .catch(() => {
        const filtered = activeFilter
          ? FALLBACK_PRODUCTS.filter((p) => p.category === activeFilter)
          : FALLBACK_PRODUCTS;
        setProducts(filtered);
      })
      .finally(() => setLoading(false));
  }, [activeFilter]);

  return (
    <div className="shop">
      <div className="container">
        <div className="shop-header">
          <p className="section-label">Our Collection</p>
          <h2 className="shop-heading">
            Every cup tells
            <br />
            <em>a different story.</em>
          </h2>
          <p className="shop-sub">
            Sourced from farms we trust. Roasted fresh, packed with care.
          </p>
        </div>

        <div className="shop-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-btn ${activeFilter === f.key ? "active" : ""}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="shop-loading">
            <div className="loader" />
          </div>
        ) : (
          <div className="shop-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
