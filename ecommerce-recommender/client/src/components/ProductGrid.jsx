import ProductCard from "./ProductCard";

export default function ProductGrid({ products, emptyMessage = "No products found." }) {
  if (!products.length) return <div className="empty-state">{emptyMessage}</div>;
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard
          key={product.productId}
          product={product}
          reason={product.becauseProductName}
          matchReason={product.matchReason}
          index={index}
        />
      ))}
    </div>
  );
}
