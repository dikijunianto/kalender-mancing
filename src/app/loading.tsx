export default function Loading() {
  return (
    <div className="page-shell" aria-busy="true" aria-label="Memuat prakiraan">
      <div className="skeleton" style={{ height: 100, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 380, marginBottom: 24 }} />
      <div className="conditions-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="skeleton" key={i} style={{ height: 140 }} />
        ))}
      </div>
    </div>
  );
}
