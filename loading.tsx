export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0a0e" }}>
      <div className="text-center space-y-4">
        <div className="font-display text-5xl pulse-gold" style={{ color: "#c9a96e" }}>✦</div>
        <p className="text-sm" style={{ color: "#6b5f7a" }}>Loading your sanctuary…</p>
      </div>
    </div>
  );
}
