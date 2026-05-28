"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center', background: 'var(--void)',
    }}>
      {/* Animated sigil */}
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ marginBottom: '24px', opacity: 0.4 }}>
        <g style={{ animation: 'spinSlow 35s linear infinite', transformOrigin: '30px 30px' }}>
          <circle cx="30" cy="30" r="28" stroke="#c8922a" strokeWidth="0.6" strokeDasharray="2 5" opacity="0.5"/>
        </g>
        <line x1="30" y1="8" x2="46" y2="38" stroke="#c8922a" strokeWidth="0.8" opacity="0.6"/>
        <line x1="46" y1="38" x2="14" y2="38" stroke="#c8922a" strokeWidth="0.8" opacity="0.6"/>
        <line x1="14" y1="38" x2="30" y2="8" stroke="#c8922a" strokeWidth="0.8" opacity="0.6"/>
        <circle cx="30" cy="30" r="4" fill="#e8b84b" opacity="0.6"/>
      </svg>

      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: '9px',
        letterSpacing: '5px', color: '#5a5040', marginBottom: '12px',
      }}>
        404 · NOT FOUND
      </div>

      <div style={{
        fontFamily: "'Cinzel Decorative', serif", fontSize: '20px',
        color: '#e8dfc8', marginBottom: '8px',
      }}>
        Lost in The Wall
      </div>

      <p style={{ fontSize: '13px', color: '#5a5040', lineHeight: 1.8, marginBottom: '28px', maxWidth: '240px' }}>
        This pioneer or page doesn't exist on the eternal wall.
      </p>

      <Link href="/" style={{ textDecoration: 'none', width: '100%', maxWidth: '260px' }}>
        <button style={{
          width: '100%', padding: '14px',
          background: 'linear-gradient(135deg, #f0c868, #c07820)',
          color: '#0a0600', border: 'none',
          fontFamily: "'Cinzel', serif", fontSize: '11px',
          letterSpacing: '3px', fontWeight: 700, cursor: 'pointer',
          clipPath: 'polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%)',
        }}>
          ← BACK TO THE WALL
        </button>
      </Link>
    </div>
  );
}
