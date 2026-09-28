import { useEffect, useState } from "react";

import ProductGrid from "../components/ProductGrid";
import { ErrorState, LoadingState } from "../components/States";
import { fetchIdeaRecommendations, fetchProducts, fetchRecommendations } from "../services/api";

const collections = ["all", "work-and-study", "kitchen-and-dining", "home-appliances", "living-room", "bedroom", "mobile-and-audio", "fitness-and-wellness", "personal-care", "travel", "books-and-stationery"];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [collection, setCollection] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendationNote, setRecommendationNote] = useState("");
  const [idea, setIdea] = useState("");
  const [ideaResults, setIdeaResults] = useState([]);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideaError, setIdeaError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetchProducts({ collection, search })
      .then((data) => active && setProducts(data))
      .catch(() => active && setError("We couldn't load the catalog. Check that the API is running."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [collection, search]);

  useEffect(() => {
    fetchRecommendations(4)
      .then((data) => {
        setRecommendations(data.recommendations);
        if (data.fallback) setRecommendationNote(data.message);
        else if (data.coldStart) setRecommendationNote("A balanced starting shelf while we learn your taste.");
      })
      .catch(() => setRecommendationNote("Recommendations will appear once all services are running."));
  }, []);

  async function handleIdeaSubmit(event) {
    event.preventDefault();
    if (idea.trim().length < 3) return;
    setIdeaLoading(true);
    setIdeaError("");
    try {
      const data = await fetchIdeaRecommendations(idea.trim(), 8);
      setIdeaResults(data.recommendations);
      if (!data.recommendations.length) setIdeaError("Try adding details such as the room, activity, style or budget.");
    } catch {
      setIdeaError("We couldn't match that idea right now. Please try again.");
    } finally {
      setIdeaLoading(false);
    }
  }

  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">Made for life in India</p>
          <h1>Tell us the plan.<br /><em>We’ll find the pieces.</em></h1>
          <p className="hero-description">From a work-from-home corner to a complete kitchen or bedroom refresh, discover useful products matched to your idea—not pushed by a sales cart.</p>
          <a href="#idea-finder" className="button">Describe your idea <span>→</span></a>
        </div>
        <div className="hero-visual">
          <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85" alt="A warm, thoughtfully arranged living room" />
          <div className="hero-card hero-card--top"><span>खोज</span><p>Your idea.<br />Useful possibilities.</p></div>
          <div className="hero-card hero-card--bottom"><strong>48</strong><span>familiar Indian finds</span></div>
        </div>
      </section>

      <section className="trust-strip">
        <span>Real brands, useful context</span><i />
        <span>Recommendations you can understand</span><i />
        <span>No cart, no sales pressure</span>
      </section>

      <section id="idea-finder" className="idea-finder container">
        <div className="idea-intro"><p className="eyebrow">Start with a thought</p><h2>What are you trying to create?</h2><p>Describe a room, routine or goal. Khoj reads the meaning of your words and matches products by category, features and use case.</p></div>
        <form className="idea-form" onSubmit={handleIdeaSubmit}>
          <textarea value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Try: I want a warm bedroom makeover with better storage and soft lighting…" rows="4" />
          <div><span>Ideas: home office · new kitchen · fitness corner · weekend travel</span><button className="button" disabled={ideaLoading}>{ideaLoading ? "Finding…" : "Find useful products"} <b>↗</b></button></div>
        </form>
        {ideaError && <p className="idea-error">{ideaError}</p>}
        {ideaResults.length > 0 && <div className="idea-results"><div className="section-heading"><div><p className="eyebrow">Matched to your idea</p><h2>Here’s what could help</h2></div><p>Ranked from the language in your prompt and the product catalogue.</p></div><ProductGrid products={ideaResults} /></div>}
      </section>

      <section id="recommended" className="section container recommendation-section">
        <div className="section-heading">
          <div><p className="eyebrow">A shelf of your own</p><h2>Recommended for you</h2></div>
          <p>{recommendationNote || "Chosen from the products you've spent time with."}</p>
        </div>
        {recommendations.length ? <ProductGrid products={recommendations} /> : <div className="empty-state">Browse a few products and your personal shelf will take shape.</div>}
      </section>

      <section className="editorial-story container" aria-label="Designed for real work">
        <div className="story-photo story-photo--large">
          <img src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=85" alt="A real-life modern kitchen" loading="lazy" />
          <span>Kitchen & dining</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">Objects for real routines</p>
          <h2>Your whole home, not just the tech on your desk.</h2>
          <p>Explore familiar products for cooking, cleaning, work, rest, wellness and travel—with enough context to understand why each one fits.</p>
          <a href="#catalog">Browse every piece <span>↘</span></a>
        </div>
        <div className="story-photo story-photo--small">
          <img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1000&q=85" alt="A real-life office workspace" loading="lazy" />
          <span>Work & study</span>
        </div>
      </section>

      <section id="catalog" className="section container catalog-section">
        <div className="section-heading catalog-heading">
          <div><p className="eyebrow">Browse every collection</p><h2>Useful finds for daily life</h2></div>
          <label className="search-box">
            <span>⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection" />
          </label>
        </div>
        <div className="filter-row" aria-label="Filter by collection">
          {collections.map((item) => <button key={item} className={collection === item ? "active" : ""} onClick={() => setCollection(item)}>{item.replaceAll("-", " ")}</button>)}
        </div>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : <ProductGrid products={products} emptyMessage="Nothing matched that search. Try a broader phrase." />}
      </section>
    </>
  );
}
