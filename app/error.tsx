"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: '9px', letterSpacing: '4px', color: '#e86050', marginBottom: '12px' }}>
        SOMETHING WENT WRONG
      </div>
      <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: '18px', color: '#e8dfc8', marginBottom: '20px' }}>
        The Wall Trembled
      </div>
      <p style={{ fontSize: '12px', color: '#5a5040', marginBottom: '24px', maxWidth: '240px', lineHeight: 1.8 }}>
        {error.message || 'An unexpected error occurred'}
      </p>
      <button onClick={reset} style={{
        padding: '13px 32px', background: 'transparent',
        border: '1px solid rgba(232,184,75,0.3)', color: '#e8b84b',
        fontFamily: "'Cinzel', serif", fontSize: '10px',
        letterSpacing: '2px', cursor: 'pointer',
      }}>
        TRY AGAIN
      </button>
    </div>
  );
}
