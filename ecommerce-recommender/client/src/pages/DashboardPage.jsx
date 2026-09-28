import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from "chart.js";

import ProductCard from "../components/ProductCard";
import { ErrorState, LoadingState } from "../components/States";
import { fetchActivity, fetchRecommendations } from "../services/api";
import { getProductImage } from "../utils/productImages";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function DashboardPage() {
  const [activity, setActivity] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchActivity(), fetchRecommendations(5)])
      .then(([activityData, recommendationData]) => {
        setActivity(activityData);
        setRecommendations(recommendationData.recommendations);
      })
      .catch(() => setError("Your activity couldn't be loaded. Check that the API is running."))
      .finally(() => setLoading(false));
  }, []);

  const recentProducts = useMemo(() => {
    const seen = new Set();
    return (activity?.interactions || []).filter((item) => {
      if (!item.product || seen.has(item.productId)) return false;
      seen.add(item.productId);
      return true;
    }).slice(0, 6);
  }, [activity]);

  const distinctProductCount = useMemo(
    () => new Set((activity?.interactions || []).map((item) => item.productId)).size,
    [activity]
  );

  const historicalRecommendations = useMemo(() => {
    const storedItems = (activity?.recommendationHistory || [])
      .flatMap((log) => log.recommendations || [])
      .filter((item) => item.product)
      .map((item) => ({ ...item.product, ...item }));
    const unique = new Map();
    for (const item of storedItems) {
      if (!unique.has(item.productId)) unique.set(item.productId, item);
    }
    return [...unique.values()].slice(0, 4);
  }, [activity]);

  const recommendationDisplay = historicalRecommendations.length
    ? historicalRecommendations
    : recommendations.slice(0, 4);

  const chartData = useMemo(() => {
    const counts = {};
    for (const interaction of activity?.interactions || []) {
      if (interaction.type === "view" && interaction.product) {
        const category = interaction.product.category;
        counts[category] = (counts[category] || 0) + 1;
      }
    }
    return {
      labels: Object.keys(counts),
      datasets: [{ data: Object.values(counts), backgroundColor: "#264c3b", borderRadius: 8, barThickness: 28 }],
    };
  }, [activity]);

  if (loading) return <div className="page-state container"><LoadingState label="Collecting your activity…" /></div>;
  if (error) return <div className="page-state container"><ErrorState message={error} /></div>;

  return (
    <section className="dashboard container">
      <div className="dashboard-header"><div><p className="eyebrow">Your collection</p><h1>A record of what caught your eye.</h1></div><Link to="/" className="button button--outline">Continue browsing</Link></div>
      <div className="stat-row">
        <div><strong>{activity.interactions.length}</strong><span>Recorded interactions</span></div>
        <div><strong>{distinctProductCount}</strong><span>Distinct products viewed</span></div>
        <div><strong>{activity.recommendationHistory.length}</strong><span>Recommendation sessions</span></div>
      </div>
      <div className="dashboard-grid">
        <section className="dashboard-panel chart-panel">
          <div className="panel-heading"><div><p className="eyebrow">Your interests</p><h2>Views by category</h2></div></div>
          {chartData.labels.length ? <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 }, border: { display: false }, grid: { color: "#e7e2d8" } } } }} /> : <div className="empty-state">Your category pattern will appear after you view products.</div>}
        </section>
        <section className="dashboard-panel timeline-panel">
          <div className="panel-heading"><div><p className="eyebrow">Latest trail</p><h2>Recently viewed</h2></div></div>
          {recentProducts.length ? <div className="timeline">{recentProducts.map((item) => <Link to={`/products/${item.productId}`} key={item._id}><img src={getProductImage(item.product)} alt="" /><div><strong>{item.product.name}</strong><span>{new Date(item.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span></div><b>↗</b></Link>)}</div> : <div className="empty-state">No views yet. Open a product to start your trail.</div>}
        </section>
      </div>
      <section className="section dashboard-recommendations">
        <div className="section-heading"><div><p className="eyebrow">Recommendation history</p><h2>What your browsing shaped</h2></div><p>Each reason exposes the strongest product-to-product similarity used by the model.</p></div>
        {recommendationDisplay.length ? <div className="product-grid">{recommendationDisplay.map((product) => <ProductCard key={product.productId} product={product} reason={product.becauseProductName} />)}</div> : <div className="empty-state">Recommendations will appear after your first visit.</div>}
      </section>
    </section>
  );
}
