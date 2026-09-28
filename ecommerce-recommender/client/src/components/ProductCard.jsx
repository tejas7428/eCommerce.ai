import { Link } from "react-router-dom";
import { getProductImage } from "../utils/productImages";

export default function ProductCard({ product, reason, matchReason, compact = false, index = 0 }) {
  return (
    <article
      className={`product-card${compact ? " product-card--compact" : ""}`}
      style={{ "--card-delay": `${Math.min(index, 7) * 55}ms` }}
    >
      <Link to={`/products/${product.productId}`} className="product-image-wrap">
        <span className="product-category">{product.category}</span>
        <img src={getProductImage(product)} alt={product.name} className="product-image" loading="lazy" />
      </Link>
      <div className="product-card-body">
        <div>
          <p className="product-brand">{product.brand}</p>
          <h3><Link to={`/products/${product.productId}`}>{product.name}</Link></h3>
          {reason && <p className="reason"><span>↳</span> Because you viewed {reason}</p>}
          {!reason && matchReason && <p className="reason"><span>✦</span> Matches the idea you described</p>}
        </div>
        <div className="product-card-footer">
          <span className="price">₹{Number(product.price).toLocaleString("en-IN")}</span>
          <Link className="round-link" to={`/products/${product.productId}`} aria-label={`View ${product.name}`}>↗</Link>
        </div>
      </div>
    </article>
  );
}
