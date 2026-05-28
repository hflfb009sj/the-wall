"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWall } from "@/contexts/wall-context";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { SigilDisplay } from "@/components/sigil-display";
import { TIERS, TIER_ORDER } from "@/lib/wall-types";
import type { TierType } from "@/lib/wall-types";

const TIER_COLORS: Record<string, string> = {
  sovereign:'#fff8e0', genesis:'#d4a0ff', obsidian:'#60c8ff',
  gold:'#e8b84b', silver:'#c0c8e0', bronze:'#c8845a', stone:'#888888',
};

const CATEGORIES = ['Developer','Designer','Marketer','Trader','Creator','Educator','Other'];

export default function EngravePage() {
  const router = useRouter();
  const { user, signIn, createPayment, isLoading: authLoading } = usePiAuth();
  const { updateProfile } = useWall();

  const [step, setStep] = useState<'tier'|'info'|'preview'|'success'>('tier');
  const [tier, setTier] = useState<TierType>('bronze');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [category, setCategory] = useState('Developer');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewTs] = useState(Date.now());

  const tc = TIERS[tier];
  const color = TIER_COLORS[tier];
  const previewId = user?.uid || 'preview_user';

  const handlePay = async () => {
    if (!user) { await signIn(); return; }
    if (!name.trim() || !profession.trim()) { setError('Please fill name and profession'); return; }
    setLoading(true); setError('');
    try {
      const payment = await createPayment({
        amount: tc.priceInPi,
        memo: `The Wall — ${tc.name} Sigil`,
        metadata: { type:'engrave', tier, piId: user.uid },
      });
      if (payment) {
        const ts = Date.now();
        await updateProfile({
          piId: user.uid, username: user.username,
          name: name.trim(), profession: profession.trim(),
          bio: bio.trim(), tier,
          services: [], engravedAt: ts, heritage: 0,
        });
        setStep('success');
        setTimeout(() => router.push('/'), 3000);
      }
    } catch { setError('Payment failed. Please try again.'); }
    finally { setLoading(false); }
  };

  if (step === 'success') return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 24px', textAlign:'center' }}>
      <div className="anim-fadeUp">
        <SigilDisplay piId={previewId} timestamp={previewTs} tier={tier} size={120}/>
        <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color, marginTop:'24px', marginBottom:'8px' }}>
          ✦ Engraved Forever
        </div>
        <div style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px', color:'var(--muted)' }}>
          YOUR SIGIL IS ON THE WALL
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100dvh', padding:'24px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom:'24px' }}>
        <div className="section-label" style={{ marginBottom:'6px' }}>ENGRAVE</div>
        <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'20px', color:'var(--cream)', lineHeight:1.3 }}>
          {step === 'tier' ? 'Choose Your Tier' : step === 'info' ? 'Your Identity' : 'Confirm & Pay'}
        </div>
      </div>

      {/* Step dots */}
      <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'24px' }}>
        {['tier','info','preview'].map((s,i) => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <div style={{
              width:'6px', height:'6px', borderRadius:'50%',
              background: step === s ? color : ['tier','info','preview'].indexOf(step) > i ? color : 'var(--muted)',
              boxShadow: step === s ? `0 0 8px ${color}` : 'none',
              transition:'all 0.3s',
            }}/>
            {i < 2 && <div style={{ width:'20px', height:'1px', background:'var(--border)' }}/>}
          </div>
        ))}
      </div>

      {/* STEP 1 — Tier */}
      {step === 'tier' && (
        <div className="anim-fadeUp">
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'24px' }}>
            {TIER_ORDER.map(t => {
              const tc2 = TIERS[t];
              const c = TIER_COLORS[t];
              const sel = tier === t;
              return (
                <div key={t} onClick={() => setTier(t)} style={{
                  padding:'16px', border:`1px solid ${sel ? c+'55' : 'rgba(180,140,60,0.08)'}`,
                  background: sel ? `${c}08` : 'rgba(15,12,26,0.4)',
                  cursor:'pointer', transition:'all 0.2s', position:'relative',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  {sel && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'2px', background:c }}/>}
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:c, boxShadow: t !== 'stone' ? `0 0 8px ${c}88` : 'none' }}/>
                    <div>
                      <div style={{ fontFamily:"'Cinzel', serif", fontSize:'13px', color:c, letterSpacing:'1px', marginBottom:'2px' }}>{tc2.name}</div>
                      <div style={{ fontSize:'11px', color:'var(--muted)' }}>{tc2.descriptionAr || tc2.description}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'16px', color:c }}>{tc2.priceInPi}π</div>
                    {tc2.maxSupply && <div style={{ fontSize:'9px', color:'var(--muted)', marginTop:'1px' }}>{tc2.maxSupply.toLocaleString()} max</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn-primary" onClick={() => setStep('info')}>
            CONTINUE WITH {tc.name.toUpperCase()} — {tc.priceInPi}π
          </button>
        </div>
      )}

      {/* STEP 2 — Info */}
      {step === 'info' && (
        <div className="anim-fadeUp">
          <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'24px' }}>
            <div>
              <div className="section-label" style={{ marginBottom:'6px' }}>DISPLAY NAME *</div>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" maxLength={40}/>
            </div>
            <div>
              <div className="section-label" style={{ marginBottom:'6px' }}>PROFESSION *</div>
              <input className="input" value={profession} onChange={e=>setProfession(e.target.value)} placeholder="e.g. Blockchain Developer" maxLength={50}/>
            </div>
            <div>
              <div className="section-label" style={{ marginBottom:'8px' }}>CATEGORY</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={()=>setCategory(cat)} style={{
                    padding:'6px 12px',
                    background: category===cat ? `${color}18` : 'transparent',
                    border:`1px solid ${category===cat ? color+'44' : 'rgba(180,140,60,0.12)'}`,
                    color: category===cat ? color : 'var(--muted)',
                    fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'1px',
                    cursor:'pointer', transition:'all 0.2s',
                  }}>
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="section-label" style={{ marginBottom:'6px' }}>BIO (OPTIONAL)</div>
              <textarea className="input" value={bio} onChange={e=>setBio(e.target.value)} placeholder="Short bio — what do you offer?" rows={3} maxLength={160} style={{ resize:'none' }}/>
            </div>
            {error && <div style={{ color:'var(--danger)', fontSize:'12px', fontFamily:"'Cinzel', serif" }}>{error}</div>}
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button className="btn-secondary" onClick={()=>setStep('tier')} style={{ flex:1 }}>← BACK</button>
            <button className="btn-primary" onClick={()=>{if(!name.trim()||!profession.trim()){setError('Fill required fields');return;}setError('');setStep('preview');}} style={{ flex:2 }}>PREVIEW →</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Preview & Pay */}
      {step === 'preview' && (
        <div className="anim-fadeUp">
          {/* Sigil preview */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px', background:'rgba(15,12,26,0.6)', border:`1px solid ${color}22`, marginBottom:'20px' }}>
            <SigilDisplay piId={previewId} timestamp={previewTs} tier={tier} size={110}/>
            <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color, marginTop:'16px', letterSpacing:'1px' }}>{name}</div>
            <div style={{ fontFamily:"'Cinzel', serif", fontSize:'11px', color:'var(--muted)', marginTop:'4px', letterSpacing:'2px' }}>{profession.toUpperCase()}</div>
            <div style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', color:`${color}88`, marginTop:'8px', letterSpacing:'3px', padding:'3px 10px', border:`1px solid ${color}22` }}>
              {tc.name.toUpperCase()} TIER
            </div>
            <div style={{ marginTop:'10px', fontSize:'10px', color:'var(--muted)', fontFamily:"'Cinzel', serif", letterSpacing:'1px' }}>
              Unique Sigil · Cannot Be Replicated
            </div>
          </div>

          {/* Perks */}
          <div style={{ padding:'14px', background:'rgba(232,184,75,0.03)', border:'1px solid var(--border)', marginBottom:'16px' }}>
            <div className="section-label" style={{ marginBottom:'10px' }}>WHAT YOU GET</div>
            {tc.perks.map((perk,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'7px' }}>
                <span style={{ color, fontSize:'8px' }}>◆</span>
                <span style={{ fontSize:'12px', color:'var(--cream)' }}>{perk}</span>
              </div>
            ))}
          </div>

          {/* Price summary */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', border:`1px solid ${color}33`, background:`${color}06`, marginBottom:'16px' }}>
            <div>
              <div className="section-label">TOTAL PAYMENT</div>
              <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'2px' }}>One-time · Permanent</div>
            </div>
            <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'24px', color, textShadow:`0 0 16px ${color}44` }}>
              {tc.priceInPi}π
            </div>
          </div>

          {error && <div style={{ color:'var(--danger)', fontSize:'12px', fontFamily:"'Cinzel', serif", marginBottom:'12px' }}>{error}</div>}

          <div style={{ display:'flex', gap:'8px' }}>
            <button className="btn-secondary" onClick={()=>setStep('info')} style={{ flex:1 }}>← EDIT</button>
            <button className="btn-primary" onClick={handlePay} disabled={loading||authLoading} style={{ flex:2, opacity:loading?0.7:1 }}>
              {loading ? 'PROCESSING...' : user ? `◆ PAY ${tc.priceInPi}π` : 'SIGN IN & PAY'}
            </button>
          </div>
          <div style={{ textAlign:'center', marginTop:'10px', fontSize:'10px', color:'var(--muted)', fontFamily:"'Cinzel', serif", letterSpacing:'1px' }}>
            Secured by Pi Network
          </div>
        </div>
      )}
    </div>
  );
}
