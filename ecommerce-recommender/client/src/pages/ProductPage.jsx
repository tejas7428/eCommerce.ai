import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ProductGrid from "../components/ProductGrid";
import { ErrorState, LoadingState } from "../components/States";
import { fetchProduct, fetchSimilar, recordInteraction } from "../services/api";
import { getProductImage } from "../utils/productImages";

export default function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fallbackNote, setFallbackNote] = useState("");

  useEffect(() => {
    let active = true;
    window.scrollTo(0, 0);
    setLoading(true);
    setError("");
    Promise.all([fetchProduct(productId), fetchSimilar(productId, 4)])
      .then(([productData, similarData]) => {
        if (!active) return;
        setProduct(productData);
        setSimilar(similarData.recommendations);
        setFallbackNote(similarData.fallback ? similarData.message : "");
        recordInteraction(productId).catch(() => {});
      })
      .catch(() => active && setError("This product could not be loaded."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [productId]);

  if (loading) return <div className="page-state container"><LoadingState /></div>;
  if (error || !product) return <div className="page-state container"><ErrorState message={error || "Product not found."} /></div>;

  return (
    <>
      <section className="product-detail container">
        <Link to="/" className="back-link">← Back to collection</Link>
        <div className="detail-grid">
          <div className="detail-image"><img src={getProductImage(product)} alt={product.name} /><span>{product.category}</span></div>
          <div className="detail-copy">
            <p className="eyebrow">{product.brand} · {product.category.replaceAll("-", " ")}</p>
            <h1>{product.name}</h1>
            <p className="detail-price">₹{Number(product.price).toLocaleString("en-IN")} <small>indicative price</small></p>
            <p className="detail-description">{product.description}</p>
            <div className="tag-list">{product.tags.map((tag) => <span key={tag}>{tag.replaceAll("-", " ")}</span>)}</div>
            <div className="detail-note"><span>✓</span><div><strong>Selected with intention</strong><p>Clear specifications, useful features, and no unnecessary complexity.</p></div></div>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading"><div><p className="eyebrow">Keep exploring</p><h2>Similar products</h2></div><p>{fallbackNote || "Ranked by shared features, use cases, and product language."}</p></div>
        <ProductGrid products={similar} />
      </section>
    </>
  );
}
