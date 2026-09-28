export function LoadingState({ label = "Gathering the good stuff…" }) {
  return <div className="loading-state"><span className="loader" />{label}</div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state">
      <p>{message}</p>
      {onRetry && <button className="button button--outline" onClick={onRetry}>Try again</button>}
    </div>
  );
}
