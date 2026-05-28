"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useWall } from "@/contexts/wall-context";
import { MiniSigil } from "@/components/sigil-display";
import type { TierType } from "@/lib/wall-types";
import { TIERS } from "@/lib/wall-types";

const TIER_COLORS: Record<string, string> = {
  sovereign:'#fff8e0', genesis:'#d4a0ff', obsidian:'#60c8ff',
  gold:'#e8b84b', silver:'#c0c8e0', bronze:'#c8845a', stone:'#888888',
};

const CATEGORIES = ['All','Developer','Designer','Marketer','Trader','Creator','Educator','Other'];

export default function ExplorePage() {
  const { pioneers } = useWall();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<'likes'|'rating'|'new'>('likes');

  const filtered = useMemo(() => {
    let data = [...pioneers];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(p => p.name.toLowerCase().includes(q) || p.profession.toLowerCase().includes(q) || p.username.toLowerCase().includes(q));
    }
    if (category !== 'All') {
      data = data.filter(p => p.profession.toLowerCase().includes(category.toLowerCase()));
    }
    if (sort === 'likes') data.sort((a,b) => b.likes - a.likes);
    else if (sort === 'rating') data.sort((a,b) => b.rating - a.rating);
    else data.sort((a,b) => b.engravedAt - a.engravedAt);
    return data;
  }, [pioneers, search, category, sort]);

  // Trending: top 3 by likes this week
  const trending = useMemo(() =>
    [...pioneers].sort((a,b) => b.likes - a.likes).slice(0,3),
  [pioneers]);

  return (
    <div style={{ minHeight:'100dvh' }}>

      {/* Header */}
      <div style={{ padding:'20px 20px 14px', borderBottom:'1px solid var(--border)' }}>
        <div className="section-label" style={{ marginBottom:'6px' }}>EXPLORE</div>
        <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color:'var(--cream)', marginBottom:'14px' }}>
          Find Pioneers
        </div>

        {/* Search */}
        <div style={{ position:'relative' }}>
          <input
            className="input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, profession..."
            style={{ paddingLeft:'36px' }}
          />
          <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--muted)', fontSize:'14px', pointerEvents:'none' }}>⌕</span>
        </div>
      </div>

      {/* Trending */}
      {!search && trending.length > 0 && (
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px' }}>
            <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'var(--success)', boxShadow:'0 0 6px var(--success)', animation:'livePulse 1.8s ease-in-out infinite' }}/>
            <span className="section-label">TRENDING NOW</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {trending.map((p, i) => {
              const color = TIER_COLORS[p.tier];
              return (
                <Link key={p.piId} href={`/pioneer/${p.piId}`} style={{ textDecoration:'none' }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:'10px', padding:'12px',
                    background: i === 0 ? 'rgba(232,184,75,0.05)' : 'rgba(15,12,26,0.4)',
                    border:`1px solid ${i===0 ? 'rgba(232,184,75,0.2)' : 'var(--border)'}`,
                    transition:'all 0.2s',
                  }}>
                    <span style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'16px', color: i===0 ? 'var(--gold)' : 'var(--muted)', width:'20px', textAlign:'center' }}>
                      {i===0?'①':i===1?'②':'③'}
                    </span>
                    <MiniSigil piId={p.piId} timestamp={p.engravedAt} tier={p.tier} size={28}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Cinzel', serif", fontSize:'12px', color, letterSpacing:'0.5px' }}>{p.name}</div>
                      <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'1px' }}>{p.profession}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', color:'var(--gold)' }}>♦ {p.likes}</div>
                      <div style={{ fontSize:'9px', color:'var(--muted)', marginTop:'1px' }}>★ {p.rating}</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ overflowX:'auto', display:'flex', gap:'6px', padding:'12px 16px', scrollbarWidth:'none', borderBottom:'1px solid var(--border)', background:'var(--deep)' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={()=>setCategory(cat)} style={{
            flexShrink:0, padding:'6px 14px',
            background: category===cat ? 'rgba(232,184,75,0.1)' : 'transparent',
            border:`1px solid ${category===cat ? 'rgba(232,184,75,0.35)' : 'rgba(180,140,60,0.1)'}`,
            color: category===cat ? 'var(--gold)' : 'var(--muted)',
            fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'2px',
            cursor:'pointer', transition:'all 0.2s', textTransform:'uppercase', whiteSpace:'nowrap',
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={{ display:'flex', padding:'10px 16px', gap:'6px', borderBottom:'1px solid var(--border)' }}>
        <span className="section-label" style={{ alignSelf:'center', marginRight:'4px' }}>SORT:</span>
        {(['likes','rating','new'] as const).map(s => (
          <button key={s} onClick={()=>setSort(s)} style={{
            padding:'5px 12px',
            background: sort===s ? 'rgba(232,184,75,0.1)' : 'transparent',
            border:`1px solid ${sort===s ? 'rgba(232,184,75,0.3)' : 'rgba(180,140,60,0.1)'}`,
            color: sort===s ? 'var(--gold)' : 'var(--muted)',
            fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'1.5px',
            cursor:'pointer', transition:'all 0.2s', textTransform:'uppercase',
          }}>
            {s === 'likes' ? '♦ LIKES' : s === 'rating' ? '★ RATING' : '◈ NEWEST'}
          </button>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'6px' }}>
        <div className="section-label" style={{ marginBottom:'8px' }}>{filtered.length} PIONEERS</div>
        {filtered.map(p => {
          const color = TIER_COLORS[p.tier];
          const tc = TIERS[p.tier];
          return (
            <Link key={p.piId} href={`/pioneer/${p.piId}`} style={{ textDecoration:'none' }}>
              <div style={{
                display:'flex', alignItems:'center', gap:'12px', padding:'14px',
                background:'rgba(15,12,26,0.5)', border:'1px solid var(--border)',
                transition:'all 0.15s',
              }}>
                <MiniSigil piId={p.piId} timestamp={p.engravedAt} tier={p.tier} size={36}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Cinzel', serif", fontSize:'13px', color, letterSpacing:'0.5px', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize:'11px', color:'var(--muted)', marginBottom:'2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.profession}</div>
                  <div style={{ display:'flex', gap:'8px' }}>
                    <span style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', color:`${color}88`, letterSpacing:'1px', textTransform:'uppercase' }}>{tc?.name}</span>
                    {p.services.length > 0 && <span style={{ fontSize:'8px', color:'var(--muted)' }}>{p.services.length} services</span>}
                    {p.isForSale && <span style={{ fontSize:'8px', color:'var(--gold)' }}>⬡ {p.salePrice}π</span>}
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', color:'var(--gold)' }}>♦ {p.likes}</div>
                  <div style={{ fontSize:'9px', color:'var(--muted)', marginTop:'2px' }}>★ {p.rating}</div>
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)', fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>
            NO PIONEERS FOUND
          </div>
        )}
      </div>
    </div>
  );
}
