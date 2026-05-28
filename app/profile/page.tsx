"use client";

import { useRouter } from "next/navigation";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { useWall } from "@/contexts/wall-context";
import { useMood } from "@/contexts/mood-context";
import { SigilDisplay } from "@/components/sigil-display";
import { TIERS } from "@/lib/wall-types";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user, signIn, signOut, isLoading } = usePiAuth();
  const { currentUser, pioneers } = useWall();
  const { mood, setMood, moodIds, allMoods, nextMood } = useMood();

  const pioneer = currentUser || (user ? pioneers.find(p => p.piId === user.uid) : null);
  const tierColors: Record<string, string> = {
    sovereign:'#fff8e0', genesis:mood.primary, obsidian:mood.secondary,
    gold:mood.primary, silver:'#c0c8e0', bronze:'#c8845a', stone:'#888',
  };
  const color = pioneer ? (tierColors[pioneer.tier] || mood.primary) : mood.primary;
  const tc = pioneer ? TIERS[pioneer.tier] : null;

  if (!user) return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}>
      <div style={{ position:'relative', marginBottom:'32px' }}>
        {[80,130,180].map((s,i) => (
          <div key={s} style={{ position:'absolute', width:`${s}px`, height:`${s}px`, borderRadius:'50%', border:`1px solid ${mood.border}`, top:'50%', left:'50%', transform:'translate(-50%,-50%)', animation:`breathe ${3+i}s ease-in-out infinite`, animationDelay:`${i*0.8}s`, pointerEvents:'none' }}/>
        ))}
        <div style={{ position:'relative', zIndex:1, width:'60px', height:'60px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
            <g className="anim-spinSlow">
              <circle cx="25" cy="25" r="22" stroke={mood.primary} strokeWidth="0.7" strokeDasharray="2 4" opacity="0.4"/>
            </g>
            <polygon points="25,6 30,16 25,13 20,16" fill={mood.primary}/>
            <circle cx="25" cy="25" r="5" fill={mood.secondary}/>
          </svg>
        </div>
      </div>
      <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'20px', color:mood.cream, marginBottom:'8px' }}>Your Profile</div>
      <p style={{ fontSize:'13px', color:mood.muted, lineHeight:1.8, marginBottom:'28px', maxWidth:'260px' }}>
        Sign in with your Pi account to engrave your sigil and manage your identity
      </p>
      <button className="btn-primary" onClick={signIn} disabled={isLoading} style={{ maxWidth:'280px' }}>
        {isLoading ? 'SIGNING IN...' : '◆ SIGN IN WITH PI'}
      </button>

      {/* Mood picker even on sign-in screen */}
      <div style={{ marginTop:'32px', width:'100%', maxWidth:'280px' }}>
        <div className="section-label" style={{ marginBottom:'10px', textAlign:'center' }}>CHOOSE YOUR MOOD</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', justifyContent:'center' }}>
          {moodIds.map(id => {
            const m = allMoods[id];
            return (
              <button key={id} onClick={() => setMood(id)} style={{
                width:'36px', height:'36px', borderRadius:'50%',
                background:`linear-gradient(135deg, ${m.btnFrom}, ${m.btnTo})`,
                border:`2px solid ${mood.id === id ? m.primary : 'transparent'}`,
                cursor:'pointer', transition:'all 0.2s',
                boxShadow: mood.id === id ? `0 0 10px ${m.primaryGlow}` : 'none',
              }} title={m.name}/>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (!pioneer) return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}>
      <div style={{ fontFamily:"'Cinzel', serif", fontSize:'11px', letterSpacing:'3px', color:mood.muted, marginBottom:'8px' }}>SIGNED IN AS</div>
      <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color:mood.primary, marginBottom:'24px' }}>{user.username}</div>
      <p style={{ fontSize:'13px', color:mood.muted, lineHeight:1.8, marginBottom:'28px', maxWidth:'260px' }}>
        You haven't engraved your sigil yet. Join the eternal wall.
      </p>
      <Link href="/engrave" style={{ width:'100%', maxWidth:'280px' }}>
        <button className="btn-primary" style={{ width:'100%' }}>◆ ENGRAVE MY SIGIL</button>
      </Link>
      <button onClick={signOut} className="btn-ghost" style={{ marginTop:'12px', fontSize:'9px', letterSpacing:'2px' }}>SIGN OUT</button>
    </div>
  );

  return (
    <div style={{ minHeight:'100dvh' }}>

      {/* Cover */}
      <div style={{ height:'120px', position:'relative', overflow:'hidden', background:`linear-gradient(135deg, ${mood.void}, ${mood.deep}, ${mood.surface})` }}>
        <div style={{ position:'absolute', right:'-20px', top:'-20px', opacity:0.06 }}>
          <SigilDisplay piId={pioneer.piId} timestamp={pioneer.engravedAt} tier={pioneer.tier} size={180} animate={false}/>
        </div>
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.08 }} viewBox="0 0 390 120" fill="none">
          <circle cx="195" cy="60" r="80" stroke={mood.primary} strokeWidth="0.5" strokeDasharray="3 6"/>
          <line x1="0" y1="30" x2="390" y2="30" stroke={mood.primary} strokeWidth="0.4"/>
          <line x1="0" y1="90" x2="390" y2="90" stroke={mood.primary} strokeWidth="0.4"/>
        </svg>
      </div>

      {/* Avatar */}
      <div style={{ padding:'0 16px', position:'relative' }}>
        <div style={{ position:'absolute', top:'-44px', left:'16px', width:'80px', height:'80px', border:`3px solid ${mood.void}`, borderRadius:'50%', background:mood.deep, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 20px ${color}44` }}>
          <SigilDisplay piId={pioneer.piId} timestamp={pioneer.engravedAt} tier={pioneer.tier} size={66} animate={true}/>
        </div>
        {/* Quick actions */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'6px', paddingTop:'8px', marginBottom:'44px' }}>
          <Link href={`/pioneer/${pioneer.piId}`} style={{ textDecoration:'none' }}>
            <button style={{ background:'transparent', border:`1px solid ${mood.border}`, color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'1px', padding:'7px 12px', cursor:'pointer' }}>
              VIEW PUBLIC
            </button>
          </Link>
          <Link href={`/pioneer/${pioneer.piId}`} style={{ textDecoration:'none' }}>
            <button style={{ background:`linear-gradient(135deg,${mood.btnFrom},${mood.btnTo})`, color:mood.void, border:'none', fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'1px', fontWeight:'700', padding:'7px 12px', cursor:'pointer' }}>
              ✎ EDIT
            </button>
          </Link>
        </div>

        {/* Name */}
        <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color, marginBottom:'3px' }}>{pioneer.name}</div>
        <div style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', color:mood.muted, letterSpacing:'2px', textTransform:'uppercase', marginBottom:'6px' }}>{pioneer.profession}</div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'14px' }}>
          <span style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px', color, padding:'3px 10px', border:`1px solid ${color}33`, background:`${color}08`, textTransform:'uppercase' }}>{tc?.name}</span>
          <span style={{ fontSize:'10px', color:mood.muted }}>#{pioneer.piId.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:`1px solid ${mood.border}`, borderBottom:`1px solid ${mood.border}` }}>
        {[
          { v:pioneer.likes, k:'Likes' },
          { v:pioneer.rating, k:'Rating' },
          { v:pioneer.services.length, k:'Services' },
          { v:pioneer.heritage, k:'Heritage' },
        ].map((s,i)=>(
          <div key={i} style={{ padding:'12px 8px', textAlign:'center', borderRight: i<3 ? `1px solid ${mood.border}` : 'none' }}>
            <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'16px', color:mood.primary }}>{s.v}</div>
            <div className="section-label" style={{ marginTop:'2px' }}>{s.k}</div>
          </div>
        ))}
      </div>

      {/* Mood Picker — the star feature */}
      <div style={{ padding:'16px', borderBottom:`1px solid ${mood.border}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <div className="section-label">APP MOOD</div>
          <button onClick={nextMood} style={{ background:'transparent', border:`1px solid ${mood.border}`, color:mood.primary, fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px', padding:'5px 10px', cursor:'pointer' }}>
            RANDOM ◈
          </button>
        </div>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          {moodIds.map(id => {
            const m = allMoods[id];
            const active = mood.id === id;
            return (
              <button key={id} onClick={() => setMood(id)} style={{
                display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
                background: active ? `${m.primaryGlow}` : 'transparent',
                border:`1px solid ${active ? m.primary+'55' : mood.border}`,
                padding:'8px 10px', cursor:'pointer', transition:'all 0.2s', minWidth:'60px',
              }}>
                <div style={{ width:'24px', height:'24px', borderRadius:'50%', background:`linear-gradient(135deg,${m.btnFrom},${m.btnTo})`, boxShadow: active ? `0 0 10px ${m.primaryGlow}` : 'none' }}/>
                <span style={{ fontFamily:"'Cinzel', serif", fontSize:'7px', letterSpacing:'1px', color: active ? m.primary : mood.muted, textTransform:'uppercase' }}>{m.name}</span>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize:'10px', color:mood.muted, marginTop:'10px', lineHeight:1.7 }}>
          Mood changes automatically every time you open the app. You can also switch manually anytime.
        </p>
      </div>

      {/* Tier perks */}
      {tc && (pioneer.tier === 'genesis' || pioneer.tier === 'sovereign') && (
        <div style={{ padding:'16px', borderBottom:`1px solid ${mood.border}` }}>
          <div className="section-label" style={{ marginBottom:'10px' }}>REVENUE SHARE</div>
          <div style={{ padding:'12px', background:`${mood.primaryGlow}`, border:`1px solid ${mood.border}` }}>
            <div style={{ fontSize:'13px', color:mood.cream, marginBottom:'4px' }}>
              You earn {pioneer.tier === 'sovereign' ? '5%' : '3%'} of all market commissions
            </div>
            <div style={{ fontSize:'10px', color:mood.muted }}>Paid automatically to your Pi wallet</div>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div style={{ padding:'16px 20px 24px' }}>
        <button onClick={signOut} className="btn-secondary" style={{ padding:'13px', fontSize:'10px', width:'100%' }}>
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
