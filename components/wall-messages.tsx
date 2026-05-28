"use client";

import { useState, useEffect } from "react";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { useMood } from "@/contexts/mood-context";
import { getMessages, postMessage, WallMessage } from "@/lib/db";

export function WallMessages({ toPiId, toName }: { toPiId: string; toName: string }) {
  const { user } = usePiAuth();
  const { mood } = useMood();
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMessages(toPiId).then(msgs => { setMessages(msgs); setLoading(false); });
  }, [toPiId]);

  const handleSend = async () => {
    if (!user || !text.trim() || text.length > 200) return;
    setSending(true);
    const ok = await postMessage({
      from_pi_id: user.uid,
      from_name: user.username,
      to_pi_id: toPiId,
      message: text.trim(),
      is_public: true,
    });
    if (ok) {
      setMessages(prev => [{
        id: Date.now().toString(),
        from_pi_id: user.uid,
        from_name: user.username,
        to_pi_id: toPiId,
        message: text.trim(),
        is_public: true,
        created_at: new Date().toISOString(),
      }, ...prev]);
      setText('');
    }
    setSending(false);
  };

  return (
    <div>
      {/* Send message */}
      {user && user.uid !== toPiId && (
        <div style={{ marginBottom:'14px', padding:'14px', background:mood.surface, border:`1px solid ${mood.border}` }}>
          <div className="section-label" style={{ marginBottom:'8px' }}>
            LEAVE A MESSAGE ON {toName.split(' ')[0].toUpperCase()}'S WALL
          </div>
          <textarea
            className="input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write something eternal... (max 200 chars)"
            rows={3}
            maxLength={200}
            style={{ resize:'none', marginBottom:'8px' }}
          />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'10px', color: text.length > 180 ? mood.primary : mood.muted }}>
              {text.length}/200
            </span>
            <button
              onClick={handleSend}
              disabled={sending || !text.trim()}
              className="btn-primary"
              style={{ width:'auto', padding:'9px 20px', fontSize:'10px', opacity: sending||!text.trim() ? 0.6 : 1 }}
            >
              {sending ? '...' : '◆ ENGRAVE MESSAGE'}
            </button>
          </div>
        </div>
      )}

      {/* Messages list */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'20px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>
          LOADING...
        </div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign:'center', padding:'30px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>
          NO MESSAGES YET — BE THE FIRST
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              padding:'14px',
              background: msg.from_pi_id === user?.uid ? `${mood.primaryGlow}` : mood.surface,
              border:`1px solid ${msg.from_pi_id === user?.uid ? mood.border : mood.border}`,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <span style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', color:mood.primary, letterSpacing:'0.5px' }}>
                  {msg.from_name}
                </span>
                <span style={{ fontSize:'9px', color:mood.muted }}>
                  {new Date(msg.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                </span>
              </div>
              <p style={{ fontSize:'13px', color:mood.cream, lineHeight:1.7, margin:0 }}>{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
