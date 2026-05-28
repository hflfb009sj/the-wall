"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { useMood } from "@/contexts/mood-context";

const NAV = [
  { href:'/',           icon:'⬡', label:'Wall' },
  { href:'/explore',    icon:'◈', label:'Explore' },
  { href:'/engrave',    icon:'✦', label:'Engrave', primary:true },
  { href:'/bounties',   icon:'◆', label:'Bounties' },
  { href:'/profile',    icon:'◉', label:'Profile' },
];

// More menu items accessible from profile/menu
export const EXTRA_NAV = [
  { href:'/market',     icon:'⬡', label:'Market' },
  { href:'/escrow',     icon:'🔒', label:'Escrow' },
  { href:'/challenges', icon:'🏆', label:'Challenges' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, signIn, isLoading } = usePiAuth();
  const { mood, nextMood } = useMood();

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100dvh', background:'var(--void)', transition:'background 0.5s ease' }}>

      {/* Top Header */}
      <header style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        maxWidth:'480px', margin:'0 auto',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 16px', height:'52px',
        background:`rgba(${hexToRgb(mood.void)},0.94)`,
        borderBottom:`1px solid ${mood.border}`,
        backdropFilter:'blur(20px)',
        transition:'all 0.5s ease',
      }}>
        <Link href="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'8px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <g className="anim-spinSlow">
              <circle cx="11" cy="11" r="10" stroke={mood.primary} strokeWidth="0.6" strokeDasharray="2 4" opacity="0.4"/>
            </g>
            <g className="anim-spinRev">
              <circle cx="11" cy="11" r="6" stroke={mood.primary} strokeWidth="0.4" opacity="0.2"/>
              <circle cx="11" cy="5" r="1.5" fill={mood.secondary} opacity="0.7"/>
            </g>
            <polygon points="11,4 14,9 11,8 8,9" fill={mood.primary}/>
            <circle cx="11" cy="11" r="2.5" fill={mood.secondary}/>
          </svg>
          <span style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'13px', color:mood.primary, letterSpacing:'3px', textShadow:`0 0 16px ${mood.primaryGlow}` }}>
            THE WALL
          </span>
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <button onClick={nextMood} title="Change mood" style={{
            background:`${mood.primaryGlow}`, border:`1px solid ${mood.border}`,
            color:mood.primary, width:'30px', height:'30px',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', fontSize:'13px', borderRadius:'50%',
            transition:'all 0.25s',
          }}>◈</button>

          {!user ? (
            <button onClick={signIn} disabled={isLoading} style={{
              background:`linear-gradient(135deg,${mood.btnFrom},${mood.btnTo})`,
              color:mood.void, border:'none',
              fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'2px', fontWeight:'700',
              padding:'7px 14px', cursor:'pointer', opacity:isLoading?0.7:1,
              clipPath:'polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)',
            }}>
              {isLoading ? '...' : 'SIGN IN'}
            </button>
          ) : (
            <Link href="/profile" style={{ textDecoration:'none' }}>
              <div style={{
                display:'flex', alignItems:'center', gap:'5px',
                background:`${mood.primaryGlow}`, border:`1px solid ${mood.border}`,
                padding:'5px 10px',
              }}>
                <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:mood.live, boxShadow:`0 0 6px ${mood.live}`, animation:'livePulse 1.8s ease-in-out infinite' }}/>
                <span style={{ fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'1px', color:mood.primary, maxWidth:'80px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user.username}
                </span>
              </div>
            </Link>
          )}
        </div>
      </header>

      {/* Extra nav bar — shown on non-main pages */}
      {['/market','/escrow','/challenges'].includes(pathname) && (
        <div style={{
          position:'fixed', top:'52px', left:0, right:0, zIndex:99,
          maxWidth:'480px', margin:'0 auto',
          display:'flex', gap:'0',
          background:`rgba(${hexToRgb(mood.deep)},0.96)`,
          borderBottom:`1px solid ${mood.border}`,
          backdropFilter:'blur(12px)',
        }}>
          {EXTRA_NAV.map(item => (
            <Link key={item.href} href={item.href} style={{ flex:1, textDecoration:'none' }}>
              <div style={{
                padding:'10px 4px', textAlign:'center',
                borderBottom:`2px solid ${pathname===item.href ? mood.primary : 'transparent'}`,
                transition:'all 0.2s',
              }}>
                <span style={{ fontSize:'11px', color: pathname===item.href ? mood.primary : mood.muted }}>{item.icon}</span>
                <div style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'1.5px', color: pathname===item.href ? mood.primary : mood.muted, marginTop:'2px', textTransform:'uppercase' }}>
                  {item.label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      <main style={{ flex:1, paddingTop: ['/market','/escrow','/challenges'].includes(pathname) ? '96px' : '52px', paddingBottom:'68px' }}>
        {children}
      </main>

      {/* Bottom Nav */}
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:100,
        maxWidth:'480px', margin:'0 auto',
        display:'flex', alignItems:'stretch',
        background:`rgba(${hexToRgb(mood.void)},0.97)`,
        borderTop:`1px solid ${mood.border}`,
        backdropFilter:'blur(20px)',
        paddingBottom:'env(safe-area-inset-bottom)',
        transition:'background 0.5s ease',
      }}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{ flex:1, textDecoration:'none' }}>
              <div style={{
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                padding:'10px 4px', position:'relative',
                background: item.primary ? `${mood.primaryGlow}` : 'transparent',
                borderTop: item.primary ? `1px solid ${mood.border}` : '1px solid transparent',
                transition:'all 0.2s',
              }}>
                {active && !item.primary && (
                  <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'20px', height:'1.5px', background:mood.primary, boxShadow:`0 0 6px ${mood.primary}` }}/>
                )}
                <span style={{
                  fontSize: item.primary ? '18px' : '14px',
                  color: item.primary ? mood.primary : active ? mood.primary : mood.muted,
                  textShadow: (item.primary||active) ? `0 0 10px ${mood.primaryGlow}` : 'none',
                  lineHeight:1, marginBottom:'3px', transition:'all 0.2s',
                }}>{item.icon}</span>
                <span style={{
                  fontFamily:"'Cinzel', serif", fontSize:'7px', letterSpacing:'1.5px',
                  color: item.primary ? mood.primary : active ? mood.primary : mood.muted,
                  textTransform:'uppercase',
                }}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return '7,5,15';
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}
