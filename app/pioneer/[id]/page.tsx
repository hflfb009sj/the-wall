"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWall } from "@/contexts/wall-context";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { useMood } from "@/contexts/mood-context";
import { WallMessages } from "@/components/wall-messages";
import { SigilDisplay } from "@/components/sigil-display";
import { TIERS } from "@/lib/wall-types";
import type { PioneerProfile, Service } from "@/lib/wall-types";

export default function PioneerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { pioneers, currentUser, updateProfile, addService, removeService, likePioneer, ratePioneer, listForSale } = useWall();
  const { user, createPayment } = usePiAuth();
  const { mood } = useMood();

  const [pioneer, setPioneer] = useState<PioneerProfile | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [tab, setTab] = useState<'about'|'services'|'passport'>('about');
  const [liked, setLiked] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [bio, setBio] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [newService, setNewService] = useState({ title:'', description:'', priceInPi:1 });
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const found = pioneers.find(p => p.piId === id);
    if (found) {
      setPioneer(found); setName(found.name);
      setProfession(found.profession); setBio(found.bio||'');
      setIsOwner(!!user && user.uid === found.piId);
    }
    const likedArr = JSON.parse(localStorage.getItem('wall_liked_v3')||'[]') as string[];
    setLiked(likedArr.includes(id as string));
    const ratedObj = JSON.parse(localStorage.getItem('wall_rated_v3')||'{}') as Record<string,boolean>;
    if (ratedObj[id as string]) setMyRating(1);
  }, [id, pioneers, user]);

  if (!pioneer) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'11px', letterSpacing:'3px' }}>
      PIONEER NOT FOUND
    </div>
  );

  const tierColor: Record<string, string> = {
    sovereign:'#fff8e0', genesis:mood.primary, obsidian:mood.secondary,
    gold:mood.primary, silver:'#c0c8e0', bronze:'#c8845a', stone:'#888',
  };
  const color = tierColor[pioneer.tier] || mood.primary;
  const tc = TIERS[pioneer.tier];

  const handleLike = async () => {
    if (liked||isOwner) return;
    setLiked(true); await likePioneer(pioneer.piId);
  };
  const handleRate = async (s:number) => {
    if (myRating||isOwner) return;
    setMyRating(s); await ratePioneer(pioneer.piId, s);
  };
  const handleSave = async () => {
    if (!name.trim()||!profession.trim()) return;
    setLoading(true);
    await updateProfile({...pioneer, name:name.trim(), profession:profession.trim(), bio:bio.trim()});
    setEditing(false); setLoading(false);
  };
  const handleHire = async (service:Service) => {
    setLoading(true);
    try { await createPayment({ amount:service.priceInPi, memo:`The Wall — ${pioneer.name}: ${service.title}`, metadata:{type:'hire',serviceId:service.id,toId:pioneer.piId} }); }
    catch(e){ console.error(e); }
    setLoading(false);
  };
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  };

  return (
    <div style={{ minHeight:'100dvh', background:'var(--void)' }}>

      {/* ══ COVER — Facebook-style ══ */}
      <div ref={headerRef} style={{ position:'relative', height:'160px', overflow:'hidden' }}>
        {/* Animated gradient cover */}
        <div style={{
          position:'absolute', inset:0,
          background:`linear-gradient(135deg, ${mood.void} 0%, ${mood.deep} 30%, ${mood.surface} 60%, ${mood.void} 100%)`,
        }}/>
        {/* Sigil watermark in cover */}
        <div style={{ position:'absolute', right:'-20px', top:'-20px', opacity:0.08 }}>
          <SigilDisplay piId={pioneer.piId} timestamp={pioneer.engravedAt} tier={pioneer.tier} size={200} animate={false}/>
        </div>
        {/* Geometric lines */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.1 }} viewBox="0 0 390 160" fill="none" preserveAspectRatio="none">
          <line x1="0" y1="40" x2="390" y2="40" stroke={mood.primary} strokeWidth="0.5"/>
          <line x1="0" y1="120" x2="390" y2="120" stroke={mood.primary} strokeWidth="0.5"/>
          <line x1="80" y1="0" x2="80" y2="160" stroke={mood.primary} strokeWidth="0.5"/>
          <circle cx="80" cy="80" r="50" stroke={mood.primary} strokeWidth="0.5" strokeDasharray="3 6"/>
        </svg>
        {/* Back button */}
        <button onClick={()=>router.back()} style={{
          position:'absolute', top:'12px', left:'12px',
          background:'rgba(0,0,0,0.5)', border:`1px solid ${mood.border}`,
          color:mood.cream, fontFamily:"'Cinzel', serif", fontSize:'9px',
          letterSpacing:'2px', padding:'6px 12px', cursor:'pointer', backdropFilter:'blur(8px)',
        }}>← BACK</button>
        {/* Sale badge */}
        {pioneer.isForSale && (
          <div style={{
            position:'absolute', top:'12px', right:'12px',
            background:`${color}22`, border:`1px solid ${color}55`,
            color, fontFamily:"'Cinzel', serif", fontSize:'9px',
            letterSpacing:'2px', padding:'5px 10px', backdropFilter:'blur(8px)',
          }}>⬡ {pioneer.salePrice}π FOR SALE</div>
        )}
      </div>

      {/* ══ PROFILE SECTION — Facebook-style ══ */}
      <div style={{ padding:'0 16px', position:'relative' }}>

        {/* Avatar — overlaps cover */}
        <div style={{
          position:'absolute', top:'-48px', left:'16px',
          width:'88px', height:'88px',
          border:`3px solid ${mood.void}`,
          borderRadius:'50%',
          background: mood.deep,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 20px ${color}44`,
        }}>
          <SigilDisplay piId={pioneer.piId} timestamp={pioneer.engravedAt} tier={pioneer.tier} size={72} animate={true}/>
        </div>

        {/* Action buttons — top right */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'6px', paddingTop:'8px', marginBottom:'40px' }}>
          {!isOwner ? (
            <>
              <button onClick={handleLike} style={{
                background: liked ? `${color}18` : 'transparent',
                border:`1px solid ${liked ? color+'55' : mood.border}`,
                color: liked ? color : mood.muted,
                fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'1px',
                padding:'7px 12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px',
              }}>
                {liked?'♦':'◇'} {pioneer.likes+(liked?1:0)}
              </button>
              <button onClick={handleShare} style={{
                background: copied ? `${color}18` : 'transparent',
                border:`1px solid ${mood.border}`,
                color: copied ? color : mood.muted,
                fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'1px',
                padding:'7px 12px', cursor:'pointer',
              }}>
                {copied?'✓ COPIED':'↗ SHARE'}
              </button>
            </>
          ) : (
            <>
              <button onClick={()=>setEditing(!editing)} style={{
                background: editing ? `${color}18` : 'transparent',
                border:`1px solid ${editing ? color+'55' : mood.border}`,
                color: editing ? color : mood.muted,
                fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'1px',
                padding:'7px 12px', cursor:'pointer',
              }}>✎ EDIT</button>
              <button onClick={()=>setShowSaleModal(true)} style={{
                background:'transparent', border:`1px solid ${mood.border}`,
                color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'9px',
                letterSpacing:'1px', padding:'7px 12px', cursor:'pointer',
              }}>⬡ SELL</button>
            </>
          )}
        </div>

        {/* Name + info */}
        <div style={{ marginBottom:'14px' }}>
          <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'20px', color, letterSpacing:'0.5px', marginBottom:'4px' }}>
            {pioneer.name}
          </div>
          <div style={{ fontFamily:"'Cinzel', serif", fontSize:'11px', color:mood.muted, letterSpacing:'2px', textTransform:'uppercase', marginBottom:'6px' }}>
            {pioneer.profession}
          </div>
          {/* Tier + stats row */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <span style={{
              fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px',
              color:`${color}`, padding:'3px 10px',
              border:`1px solid ${color}33`, background:`${color}08`,
              textTransform:'uppercase',
            }}>
              {tc?.name}
            </span>
            <span style={{ fontSize:'10px', color:mood.muted }}>♦ {pioneer.likes+(liked?1:0)}</span>
            <span style={{ fontSize:'10px', color:mood.muted }}>★ {pioneer.rating}</span>
            {pioneer.services.length > 0 && (
              <span style={{ fontSize:'10px', color:mood.muted }}>{pioneer.services.length} services</span>
            )}
            {pioneer.heritage > 0 && (
              <div style={{ display:'flex', gap:'3px', alignItems:'center' }}>
                {Array(pioneer.heritage).fill(0).map((_,i)=>(
                  <div key={i} style={{ width:'6px',height:'6px',borderRadius:'50%',border:`1px solid ${color}`,opacity:0.6 }}/>
                ))}
              </div>
            )}
          </div>
          {pioneer.bio && <p style={{ fontSize:'13px', color:mood.muted, lineHeight:1.8, marginTop:'10px' }}>{pioneer.bio}</p>}
        </div>

        {/* Edit form */}
        {editing && (
          <div style={{ padding:'14px', background:`${mood.primaryGlow}`, border:`1px solid ${mood.border}`, marginBottom:'14px', display:'flex', flexDirection:'column', gap:'10px' }}>
            <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Display Name"/>
            <input className="input" value={profession} onChange={e=>setProfession(e.target.value)} placeholder="Profession"/>
            <textarea className="input" value={bio} onChange={e=>setBio(e.target.value)} placeholder="Bio" rows={2} style={{ resize:'none' }}/>
            <div style={{ display:'flex', gap:'6px' }}>
              <button className="btn-secondary" onClick={()=>setEditing(false)} style={{ flex:1, padding:'11px', fontSize:'9px' }}>CANCEL</button>
              <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ flex:2, padding:'11px', fontSize:'9px' }}>
                {loading?'...':'SAVE'}
              </button>
            </div>
          </div>
        )}

        {/* Stats grid — Facebook-style highlights */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', background:mood.border, border:`1px solid ${mood.border}`, marginBottom:'1px' }}>
          {[
            { v:pioneer.likes+(liked?1:0), k:'Likes' },
            { v:`${pioneer.rating}`, k:'Rating' },
            { v:pioneer.services.length, k:'Services' },
            { v:pioneer.heritage, k:'Heritage' },
          ].map((s,i)=>(
            <div key={i} style={{ padding:'12px 8px', textAlign:'center', background:mood.surface }}>
              <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'16px', color:mood.primary }}>{s.v}</div>
              <div className="section-label" style={{ marginTop:'2px' }}>{s.k}</div>
            </div>
          ))}
        </div>

        {/* Rate — if not owner */}
        {!isOwner && !myRating && (
          <div style={{ padding:'12px', background:mood.surface, border:`1px solid ${mood.border}`, marginBottom:'1px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'2px', color:mood.muted }}>RATE THIS PIONEER</span>
            <div style={{ display:'flex', gap:'4px' }}>
              {[1,2,3,4,5].map(s=>(
                <span key={s} onClick={()=>handleRate(s)} style={{ fontSize:'20px', cursor:'pointer', color: s<=(myRating||Math.round(pioneer.rating)) ? mood.primary : mood.muted, transition:'color 0.15s' }}>★</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ TABS — Facebook-style ══ */}
      <div style={{ display:'flex', borderTop:`1px solid ${mood.border}`, borderBottom:`1px solid ${mood.border}`, marginTop:'1px', position:'sticky', top:'52px', zIndex:50, background:`rgba(${hexToRgb(mood.void)},0.95)`, backdropFilter:'blur(10px)' }}>
        {(['about','services','passport','messages'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1, padding:'13px 4px', background:'transparent', border:'none',
            borderBottom:`2px solid ${tab===t ? color : 'transparent'}`,
            color: tab===t ? color : mood.muted,
            fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'2px',
            cursor:'pointer', transition:'all 0.2s', textTransform:'uppercase',
          }}>{t}</button>
        ))}
      </div>

      {/* ══ TAB CONTENT ══ */}
      <div style={{ padding:'16px' }}>

        {/* About */}
        {tab==='about' && (
          <div className="anim-fadeIn">
            {[
              { icon:'◈', label:'Tier', value:`${tc?.name} — ${tc?.priceInPi}π` },
              { icon:'◆', label:'Pioneer ID', value:`#${pioneer.piId.slice(-8).toUpperCase()}` },
              { icon:'◉', label:'Engraved', value:new Date(pioneer.engravedAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) },
              { icon:'⬡', label:'Heritage', value:`${pioneer.heritage} generation${pioneer.heritage!==1?'s':''}` },
              { icon:'★', label:'Rating', value:`${pioneer.rating}/5 (${pioneer.ratingCount} reviews)` },
            ].map((item,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'12px 0', borderBottom:`1px solid ${mood.border}` }}>
                <span style={{ color:mood.primary, fontSize:'14px', flexShrink:0, marginTop:'1px' }}>{item.icon}</span>
                <div style={{ flex:1 }}>
                  <div className="section-label" style={{ marginBottom:'3px' }}>{item.label}</div>
                  <div style={{ fontSize:'13px', color:mood.cream }}>{item.value}</div>
                </div>
              </div>
            ))}

            {/* Tier perks */}
            {tc && (
              <div style={{ marginTop:'16px' }}>
                <div className="section-label" style={{ marginBottom:'12px' }}>TIER BENEFITS</div>
                {tc.perks.map((p,i)=>(
                  <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center' }}>
                    <span style={{ color:mood.primary, fontSize:'8px', flexShrink:0 }}>◆</span>
                    <span style={{ fontSize:'12px', color:mood.cream }}>{p}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services */}
        {tab==='services' && (
          <div className="anim-fadeIn">
            {isOwner && (
              <button onClick={()=>setShowServiceForm(!showServiceForm)} className="btn-secondary" style={{ marginBottom:'12px', padding:'12px', fontSize:'10px' }}>
                + ADD SERVICE
              </button>
            )}
            {showServiceForm && isOwner && (
              <div style={{ padding:'14px', background:mood.surface, border:`1px solid ${mood.border}`, marginBottom:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
                <input className="input" value={newService.title} onChange={e=>setNewService(p=>({...p,title:e.target.value}))} placeholder="Service title"/>
                <textarea className="input" value={newService.description} onChange={e=>setNewService(p=>({...p,description:e.target.value}))} placeholder="Description" rows={2} style={{ resize:'none' }}/>
                <input className="input" type="number" step="0.001" value={newService.priceInPi} onChange={e=>setNewService(p=>({...p,priceInPi:parseFloat(e.target.value)}))} placeholder="Price in Pi"/>
                <div style={{ display:'flex', gap:'6px' }}>
                  <button className="btn-secondary" onClick={()=>setShowServiceForm(false)} style={{ flex:1, padding:'10px', fontSize:'9px' }}>CANCEL</button>
                  <button className="btn-primary" onClick={async()=>{ if(!newService.title.trim())return; await addService({...newService,id:Date.now().toString(),category:'general'}); setNewService({title:'',description:'',priceInPi:1}); setShowServiceForm(false); }} style={{ flex:2, padding:'10px', fontSize:'9px' }}>ADD</button>
                </div>
              </div>
            )}
            {pioneer.services.length===0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>NO SERVICES YET</div>
            ) : (
              pioneer.services.map(s=>(
                <div key={s.id} style={{ padding:'16px', border:`1px solid ${mood.border}`, background:mood.surface, marginBottom:'8px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                    <div style={{ fontFamily:"'Cinzel', serif", fontSize:'13px', color:mood.cream }}>{s.title}</div>
                    <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'15px', color:mood.primary, flexShrink:0 }}>{s.priceInPi}π</div>
                  </div>
                  {s.description && <div style={{ fontSize:'12px', color:mood.muted, marginBottom:'10px' }}>{s.description}</div>}
                  {isOwner ? (
                    <button onClick={()=>removeService(s.id)} style={{ background:'transparent', border:'1px solid rgba(248,113,113,0.3)', color:'rgba(248,113,113,0.7)', padding:'5px 12px', cursor:'pointer', fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'1px' }}>REMOVE</button>
                  ) : (
                    <button className="btn-primary" onClick={()=>handleHire(s)} disabled={loading} style={{ padding:'11px', fontSize:'10px' }}>
                      HIRE WITH Pi — {s.priceInPi}π
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Passport */}
        {tab==='passport' && (
          <div className="anim-fadeIn">
            {/* Passport card */}
            <div style={{
              padding:'28px 20px',
              background:`linear-gradient(135deg, ${mood.deep}, ${mood.surface})`,
              border:`1px solid ${color}44`,
              position:'relative', overflow:'hidden', marginBottom:'14px',
            }}>
              <div style={{ position:'absolute', right:'-30px', bottom:'-30px', opacity:0.05 }}>
                <SigilDisplay piId={pioneer.piId} timestamp={pioneer.engravedAt} tier={pioneer.tier} size={180} animate={false}/>
              </div>
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'20px' }}>
                  <div>
                    <div className="section-label" style={{ marginBottom:'4px' }}>PIONEER PASSPORT</div>
                    <div style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', color:`${mood.primary}66`, letterSpacing:'2px' }}>THE WALL · Pi Network</div>
                  </div>
                  <div style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', color:`${color}99`, letterSpacing:'2px', padding:'4px 10px', border:`1px solid ${color}33` }}>
                    {tc?.name?.toUpperCase()}
                  </div>
                </div>
                <div style={{ display:'flex', gap:'16px', marginBottom:'20px', alignItems:'center' }}>
                  <SigilDisplay piId={pioneer.piId} timestamp={pioneer.engravedAt} tier={pioneer.tier} size={68} animate={false}/>
                  <div>
                    <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'15px', color, marginBottom:'4px' }}>{pioneer.name}</div>
                    <div style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', color:mood.muted, letterSpacing:'1px', textTransform:'uppercase' }}>{pioneer.profession}</div>
                  </div>
                </div>
                <div className="gold-divider" style={{ marginBottom:'14px' }}/>
                {[
                  { k:'SIGIL ID', v:`#${pioneer.piId.slice(-8).toUpperCase()}` },
                  { k:'ENGRAVED', v:new Date(pioneer.engravedAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) },
                  { k:'TIER', v:tc?.name||'' },
                  { k:'HERITAGE', v:`${pioneer.heritage}×` },
                  { k:'LIKES', v:String(pioneer.likes) },
                  { k:'RATING', v:`${pioneer.rating}/5` },
                ].map((f,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                    <span className="section-label">{f.k}</span>
                    <span style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', color:mood.cream }}>{f.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-secondary" onClick={handleShare} style={{ padding:'13px', fontSize:'10px' }}>
              {copied ? '✓ LINK COPIED' : '↗ SHARE PASSPORT'}
            </button>
          </div>
        )}

        {/* Messages */}
        {tab==='messages' && (
          <div className="anim-fadeIn">
            <WallMessages toPiId={pioneer.piId} toName={pioneer.name}/>
          </div>
        )}
      </div>

      {/* Sale modal */}
      {showSaleModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end' }} onClick={()=>setShowSaleModal(false)}>
          <div style={{ width:'100%', maxWidth:'480px', margin:'0 auto', background:mood.surface, borderTop:`1px solid ${mood.border}`, padding:'24px 20px', animation:'slideUp 0.3s ease' }} onClick={e=>e.stopPropagation()}>
            <div className="section-label" style={{ marginBottom:'14px' }}>LIST FOR SALE</div>
            <input className="input" type="number" step="0.001" value={salePrice} onChange={e=>setSalePrice(e.target.value)} placeholder="Price in Pi" style={{ marginBottom:'12px' }}/>
            <div style={{ display:'flex', gap:'8px' }}>
              <button className="btn-secondary" onClick={()=>setShowSaleModal(false)} style={{ flex:1, padding:'13px', fontSize:'10px' }}>CANCEL</button>
              <button className="btn-primary" onClick={async()=>{ const p=parseFloat(salePrice); if(!p||p<=0)return; await listForSale(p); setShowSaleModal(false); }} style={{ flex:2, padding:'13px', fontSize:'10px' }}>LIST NOW</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return '7,5,15';
  return `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}`;
}
