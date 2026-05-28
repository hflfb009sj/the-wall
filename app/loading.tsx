export default function Loading() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--void)',
      flexDirection: 'column', gap: '16px',
    }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ animation: 'spinSlow 2s linear infinite', transformOrigin: '20px 20px' }}>
        <circle cx="20" cy="20" r="18" stroke="#c8922a" strokeWidth="0.8" strokeDasharray="3 6" opacity="0.6"/>
        <circle cx="20" cy="20" r="4" fill="#e8b84b" opacity="0.8"/>
      </svg>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: '8px',
        letterSpacing: '4px', color: '#5a5040',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}>
        LOADING...
      </div>
    </div>
  );
}
