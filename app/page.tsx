"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWall } from "@/contexts/wall-context";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { useMood } from "@/contexts/mood-context";
import { MiniSigil } from "@/components/sigil-display";
import type { TierType } from "@/lib/wall-types";
import { TIERS } from "@/lib/wall-types";

const TIER_ORDER_LIST: TierType[] = ['sovereign','genesis','obsidian','gold','silver','bronze','stone'];

export default function WallPage() {
  const { pioneers, totalCount, sovereignCount, tradeCount, isLoading } = useWall();
  const { user } = usePiAuth();
  const { mood } = useMood();
  const [filter, setFilter] = useState<TierType | 'all'>('all');
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!pioneers.length) return;
    const iv = setInterval(() => {
      const r = pioneers[Math.floor(Math.random() * pioneers.length)];
      setNewIds(p => { const s = new Set(p); s.add(r.piId); return s; });
      setTimeout(() => setNewIds(p => { const s = new Set(p); s.delete(r.piId); return s; }), 2000);
    }, 4000);
    return () => clearInterval(iv);
  }, [pioneers]);

  const displayed = filter === 'all' ? pioneers : pioneers.filter(p => p.tier === filter);

  // Tier sizes on wall
  const SIZES: Record<string, number> = { sovereign:24, genesis:20, obsidian:18, gold:16, silver:14, bronze:13, stone:12 };

  // Tier colors using mood primary/secondary for top tiers
  function tierColor(tier: string): string {
    if (tier === 'sovereign') return '#fff8e0';
    if (tier === 'genesis') return mood.primary;
    if (tier === 'obsidian') return mood.secondary;
    if (tier === 'gold') return mood.primary;
    if (tier === 'silver') return '#c0c8e0';
    if (tier === 'bronze') return '#c8845a';
    return '#888888';
  }

  const tierCounts: Record<string, number> = { all: pioneers.length };
  TIER_ORDER_LIST.forEach(t => { tierCounts[t] = pioneers.filter(p => p.tier === t).length; });

  return (
    <div style={{ minHeight:'100dvh' }}>

      {/* Hero strip */}
      <div style={{
        padding:'24px 20px 16px',
        background:`linear-gradient(180deg, ${mood.primaryGlow} 0%, transparent 100%)`,
        borderBottom:`1px solid ${mood.border}`,
        position:'relative', overflow:'hidden',
        transition:'background 0.5s ease',
      }}>
        {[160,260,360].map((s,i) => (
          <div key={s} style={{
            position:'absolute', width:`${s}px`, height:`${s}px`,
            borderRadius:'50%', border:`1px solid ${mood.border}`,
            top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            animation:`breathe ${4+i}s ease-in-out infinite`,
            animationDelay:`${i*1.2}s`, pointerEvents:'none',
          }}/>
        ))}

        <div style={{ position:'relative', zIndex:1 }}>
          <div className="section-label" style={{ marginBottom:'8px', color:mood.primary }}>THE ETERNAL WALL</div>
          <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'22px', color:mood.cream, lineHeight:1.2, marginBottom:'6px' }}>
            Engrave Your<br/>
            <span style={{ color:mood.primary, textShadow:`0 0 20px ${mood.primaryGlow}` }}>Legacy Forever</span>
          </div>
          <div style={{ fontSize:'12px', color:mood.muted, lineHeight:1.7, marginBottom:'16px' }}>
            A unique sigil, tied to your Pi identity.<br/>No two are alike. Ever.
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:'0', borderTop:`1px solid ${mood.border}`, borderBottom:`1px solid ${mood.border}` }}>
            {[
              { v:totalCount.toLocaleString(), k:'Engraved' },
              { v:sovereignCount, k:'Sovereign' },
              { v:tradeCount.toLocaleString(), k:'Trades' },
            ].map((s,i)=>(
              <div key={i} style={{ flex:1, padding:'10px 8px', textAlign:'center', borderRight: i<2 ? `1px solid ${mood.border}` : 'none' }}>
                <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'16px', color:mood.primary, textShadow:`0 0 8px ${mood.primaryGlow}` }}>{s.v}</div>
                <div className="section-label" style={{ marginTop:'2px' }}>{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tier filter */}
      <div style={{
        overflowX:'auto', display:'flex', gap:'6px',
        padding:'12px 16px', scrollbarWidth:'none',
        borderBottom:`1px solid ${mood.border}`,
        background:mood.deep, transition:'background 0.5s ease',
      }}>
        {(['all', ...TIER_ORDER_LIST] as const).map(t => {
          const active = filter === t;
          const c = t === 'all' ? mood.primary : tierColor(t);
          return (
            <button key={t} onClick={() => setFilter(t)} style={{
              flexShrink:0, padding:'6px 14px',
              background: active ? `${c}18` : 'transparent',
              border:`1px solid ${active ? c+'55' : mood.border}`,
              color: active ? c : mood.muted,
              fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'2px',
              cursor:'pointer', transition:'all 0.2s', textTransform:'uppercase', whiteSpace:'nowrap',
              boxShadow: active ? `0 0 8px ${c}22` : 'none',
            }}>
              {t === 'all' ? 'ALL' : (TIERS[t]?.name || t).toUpperCase()}
              <span style={{ marginLeft:'4px', opacity:0.6 }}>({tierCounts[t]||0})</span>
            </button>
          );
        })}
      </div>

      {/* Wall grid */}
      <div style={{ padding:'14px', minHeight:'400px' }}>
        {isLoading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {Array(6).fill(0).map((_,i)=>(
              <div key={i} style={{ height:'36px', background:mood.surface, animation:'breathe 2s ease-in-out infinite', animationDelay:`${i*0.15}s`, opacity:0.5 }}/>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', alignContent:'flex-start' }}>
            {displayed.map(p => {
              const c = tierColor(p.tier);
              const size = SIZES[p.tier] || 14;
              const isNew = newIds.has(p.piId);
              return (
                <Link key={p.piId} href={`/pioneer/${p.piId}`} style={{ textDecoration:'none' }}>
                  <div style={{
                    display:'inline-flex', alignItems:'center', gap:'5px',
                    padding: p.tier==='sovereign' ? '7px 14px' : p.tier==='genesis' ? '6px 12px' : '4px 9px',
                    border:`1px solid ${c}22`,
                    background:`${c}06`,
                    cursor:'pointer', transition:'all 0.15s',
                    animation: isNew ? 'engrave 0.6s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                  }}>
                    <MiniSigil piId={p.piId} timestamp={p.engravedAt} tier={p.tier} size={size}/>
                    <span style={{
                      fontFamily:"'Cinzel', serif",
                      fontSize: p.tier==='sovereign' ? '13px' : p.tier==='genesis' ? '12px' : '10px',
                      color:c, letterSpacing:'0.5px', lineHeight:1,
                    }}>{p.name}</span>
                    {p.heritage > 0 && (
                      <div style={{ display:'flex', gap:'1.5px' }}>
                        {Array(Math.min(p.heritage,3)).fill(0).map((_,i)=>(
                          <div key={i} style={{ width:'3px',height:'3px',borderRadius:'50%',border:`0.7px solid ${c}`,opacity:0.6 }}/>
                        ))}
                      </div>
                    )}
                    {p.isForSale && <span style={{ fontSize:'7px', color:mood.primary, opacity:0.7 }}>⬡</span>}
                  </div>
                </Link>
              );
            })}
            {displayed.length === 0 && (
              <div style={{ width:'100%', textAlign:'center', padding:'40px 0', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>
                NO PIONEERS YET
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      {!user && (
        <div style={{ padding:'16px', position:'sticky', bottom:'64px', background:`linear-gradient(0deg, ${mood.void} 60%, transparent)` }}>
          <Link href="/engrave">
            <button className="btn-primary">◆ ENGRAVE YOUR NAME</button>
          </Link>
        </div>
      )}
    </div>
  );
}
