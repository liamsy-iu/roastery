import { useState } from "react";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const { dispatch } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    dispatch({ type: "ADD_ITEM", product });
    dispatch({ type: "OPEN" });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card">
      <div className="product-img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
        {!product.in_stock && <div className="out-of-stock">Out of Stock</div>}
      </div>

      <div className="product-info">
        <div className="product-origin">{product.origin}</div>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-desc">{product.description}</p>

        <div className="product-notes">
          {product.flavor_notes.map((note) => (
            <span key={note} className="note-tag">
              {note}
            </span>
          ))}
        </div>

        <div className="product-footer">
          <div className="product-price">
            <span className="price-amount">KES {product.price.toFixed(0)}</span>
            <span className="price-weight">/ {product.weight}</span>
          </div>
          <button
            className={`add-btn ${added ? "added" : ""}`}
            onClick={handleAdd}
            disabled={!product.in_stock}
          >
            {added ? (
              <>
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
                Added
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
