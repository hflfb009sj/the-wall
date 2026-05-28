"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useWall } from "@/contexts/wall-context";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { MiniSigil } from "@/components/sigil-display";
import { TIERS } from "@/lib/wall-types";

const TIER_COLORS: Record<string, string> = {
  sovereign:'#fff8e0', genesis:'#d4a0ff', obsidian:'#60c8ff',
  gold:'#e8b84b', silver:'#c0c8e0', bronze:'#c8845a', stone:'#888888',
};

export default function MarketPage() {
  const { pioneers, tradeCount } = useWall();
  const { user, createPayment } = usePiAuth();
  const [sort, setSort] = useState<'price_hi'|'price_lo'|'tier'>('tier');
  const [loading, setLoading] = useState<string|null>(null);
  const [successId, setSuccessId] = useState<string|null>(null);

  const forSale = useMemo(() => {
    let data = pioneers.filter(p => p.isForSale && p.salePrice);
    if (sort === 'price_hi') data = [...data].sort((a,b) => (b.salePrice||0) - (a.salePrice||0));
    else if (sort === 'price_lo') data = [...data].sort((a,b) => (a.salePrice||0) - (b.salePrice||0));
    return data;
  }, [pioneers, sort]);

  const handleBuy = async (piId: string, name: string, price: number, tier: string) => {
    if (!user) return;
    setLoading(piId);
    try {
      const payment = await createPayment({
        amount: price,
        memo: `The Wall — Buy ${TIERS[tier as keyof typeof TIERS]?.name || tier} from ${name}`,
        metadata: { type:'trade', buyerId: user.uid, sellerId: piId, price },
      });
      if (payment) {
        setSuccessId(piId);
        setTimeout(() => setSuccessId(null), 3000);
      }
    } catch(e) { console.error(e); }
    setLoading(null);
  };

  return (
    <div style={{ minHeight:'100dvh' }}>

      {/* Header */}
      <div style={{ padding:'20px 20px 14px', borderBottom:'1px solid var(--border)', background:'linear-gradient(180deg, rgba(232,184,75,0.04) 0%, transparent 100%)' }}>
        <div className="section-label" style={{ marginBottom:'6px' }}>MARKET</div>
        <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color:'var(--cream)', marginBottom:'14px' }}>
          Trade Sigils
        </div>

        {/* Market stats */}
        <div style={{ display:'flex', gap:'0', border:'1px solid var(--border)' }}>
          {[
            { v: forSale.length, k:'For Sale' },
            { v: tradeCount.toLocaleString(), k:'Total Trades' },
            { v: forSale.length > 0 ? `${Math.max(...forSale.map(p=>p.salePrice||0))}π` : '—', k:'Highest Ask' },
          ].map((s,i) => (
            <div key={i} style={{ flex:1, padding:'10px 8px', textAlign:'center', borderRight: i<2 ? '1px solid var(--border)' : 'none', background:'rgba(232,184,75,0.02)' }}>
              <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'15px', color:'var(--gold)' }}>{s.v}</div>
              <div className="section-label" style={{ marginTop:'2px' }}>{s.k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div style={{ display:'flex', padding:'10px 16px', gap:'6px', borderBottom:'1px solid var(--border)', background:'var(--deep)' }}>
        <span className="section-label" style={{ alignSelf:'center', marginRight:'4px' }}>SORT:</span>
        {([
          { v:'tier', l:'BY TIER' },
          { v:'price_hi', l:'PRICE ↓' },
          { v:'price_lo', l:'PRICE ↑' },
        ] as const).map(s => (
          <button key={s.v} onClick={()=>setSort(s.v)} style={{
            padding:'5px 12px',
            background: sort===s.v ? 'rgba(232,184,75,0.1)' : 'transparent',
            border:`1px solid ${sort===s.v ? 'rgba(232,184,75,0.3)' : 'rgba(180,140,60,0.1)'}`,
            color: sort===s.v ? 'var(--gold)' : 'var(--muted)',
            fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'1.5px',
            cursor:'pointer', transition:'all 0.2s',
          }}>
            {s.l}
          </button>
        ))}
      </div>

      {/* Listings */}
      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' }}>
        {forSale.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'var(--muted)', fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>
            NO SIGILS FOR SALE
          </div>
        ) : (
          forSale.map(p => {
            const color = TIER_COLORS[p.tier];
            const tc = TIERS[p.tier];
            const isSuccess = successId === p.piId;
            const isLoading = loading === p.piId;
            const isOwn = user?.uid === p.piId;

            return (
              <div key={p.piId} style={{
                border:`1px solid ${color}22`,
                background:`${color}05`,
                overflow:'hidden',
                transition:'all 0.2s',
              }}>
                {/* Top: sigil + info */}
                <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'16px' }}>
                  <Link href={`/pioneer/${p.piId}`} style={{ textDecoration:'none', flexShrink:0 }}>
                    <MiniSigil piId={p.piId} timestamp={p.engravedAt} tier={p.tier} size={44}/>
                  </Link>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'Cinzel', serif", fontSize:'13px', color, letterSpacing:'0.5px', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize:'10px', color:'var(--muted)', marginBottom:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.profession}</div>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <span style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', color:`${color}99`, letterSpacing:'1px', textTransform:'uppercase', padding:'2px 6px', border:`1px solid ${color}22` }}>
                        {tc?.name}
                      </span>
                      <span style={{ fontSize:'9px', color:'var(--muted)' }}>♦ {p.likes}</span>
                      <span style={{ fontSize:'9px', color:'var(--muted)' }}>★ {p.rating}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'20px', color, textShadow:`0 0 12px ${color}44` }}>
                      {p.salePrice}π
                    </div>
                    <div style={{ fontSize:'8px', color:'var(--muted)', marginTop:'1px' }}>ASKING PRICE</div>
                  </div>
                </div>

                {/* Perks preview */}
                {tc?.perks && (
                  <div style={{ padding:'0 16px 10px', display:'flex', gap:'6px', flexWrap:'wrap' }}>
                    {tc.perks.slice(0,2).map((perk,i) => (
                      <span key={i} style={{ fontSize:'9px', color:'var(--muted)', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', padding:'3px 8px' }}>
                        {perk}
                      </span>
                    ))}
                  </div>
                )}

                {/* Buy button */}
                <div style={{ padding:'0 16px 16px' }}>
                  {isOwn ? (
                    <div style={{ textAlign:'center', padding:'11px', border:'1px solid var(--border)', fontFamily:"'Cinzel', serif", fontSize:'9px', color:'var(--muted)', letterSpacing:'2px' }}>
                      YOUR SIGIL
                    </div>
                  ) : isSuccess ? (
                    <div style={{ textAlign:'center', padding:'11px', background:'rgba(80,232,152,0.1)', border:'1px solid rgba(80,232,152,0.3)', fontFamily:"'Cinzel', serif", fontSize:'10px', color:'var(--success)', letterSpacing:'2px' }}>
                      ✓ PURCHASE COMPLETE
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuy(p.piId, p.name, p.salePrice!, p.tier)}
                      disabled={isLoading || !user}
                      className="btn-primary"
                      style={{ padding:'13px', fontSize:'10px', opacity: isLoading ? 0.7 : 1 }}
                    >
                      {isLoading ? 'PROCESSING...' : !user ? 'SIGN IN TO BUY' : `◆ BUY FOR ${p.salePrice}π`}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Market info */}
      <div style={{ padding:'20px 16px', borderTop:'1px solid var(--border)', margin:'8px 0 0' }}>
        <div className="section-label" style={{ marginBottom:'10px' }}>HOW TRADING WORKS</div>
        {[
          { icon:'◆', text:'5% commission on every trade goes to the app' },
          { icon:'◈', text:'Genesis & Sovereign holders earn 3–5% of all commissions' },
          { icon:'⬡', text:'Sigil value grows with community size and tier rarity' },
          { icon:'◉', text:'Heritage rings add historical value to inherited sigils' },
        ].map((item,i) => (
          <div key={i} style={{ display:'flex', gap:'10px', marginBottom:'8px' }}>
            <span style={{ color:'var(--gold)', fontSize:'10px', flexShrink:0, marginTop:'2px' }}>{item.icon}</span>
            <span style={{ fontSize:'11px', color:'var(--muted)', lineHeight:1.6 }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
