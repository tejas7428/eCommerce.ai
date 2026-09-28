import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <NavLink to="/" className="brand" aria-label="Khoj home">
          <span className="brand-mark">K</span>
          <span>Khoj</span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Shop</NavLink>
          <a href="/#recommended">For you</a>
          <NavLink to="/activity">Activity</NavLink>
        </nav>
        <NavLink to="/activity" className="header-action">
          <span className="status-dot" /> Your collection
        </NavLink>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div>
          <span className="brand footer-brand"><span className="brand-mark">K</span>Khoj</span>
          <p>Useful things, thoughtfully matched to your life.</p>
        </div>
        <div className="footer-meta">
          <span>Content-based recommendations</span>
          <span>No account required</span>
        </div>
      </footer>
    </div>
  );
}
