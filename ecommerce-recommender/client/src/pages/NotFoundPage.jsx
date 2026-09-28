import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <div className="not-found container"><p className="eyebrow">404</p><h1>That shelf is empty.</h1><p>The page you were looking for has moved or never existed.</p><Link className="button" to="/">Return to the collection</Link></div>;
}
