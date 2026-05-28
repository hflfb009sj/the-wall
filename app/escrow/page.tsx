"use client";

import { useState, useEffect } from "react";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { useMood } from "@/contexts/mood-context";
import { useWall } from "@/contexts/wall-context";
import { createEscrow, getMyEscrows, updateEscrowStatus, Escrow } from "@/lib/db";

export default function EscrowPage() {
  const { user, createPayment } = usePiAuth();
  const { mood } = useMood();
  const { currentUser, pioneers } = useWall();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mine'|'create'>('mine');
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ seller_pi_id:'', service_title:'', amount_pi:1, deadline:'' });
  const [sellerSearch, setSellerSearch] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getMyEscrows(user.uid).then(data => { setEscrows(data); setLoading(false); });
  }, [user]);

  const searchedPioneers = sellerSearch
    ? pioneers.filter(p => p.name.toLowerCase().includes(sellerSearch.toLowerCase()) && p.piId !== user?.uid).slice(0,5)
    : [];

  const handleCreate = async () => {
    if (!user || !currentUser || !form.seller_pi_id || !form.service_title) return;
    const seller = pioneers.find(p => p.piId === form.seller_pi_id);
    if (!seller) return;
    setSending(true);
    const payment = await createPayment({
      amount: form.amount_pi,
      memo: `The Wall Escrow — ${form.service_title}`,
      metadata: { type:'escrow', sellerId:form.seller_pi_id },
    });
    if (payment) {
      const id = await createEscrow({
        buyer_pi_id: user.uid, buyer_name: currentUser.name,
        seller_pi_id: form.seller_pi_id, seller_name: seller.name,
        service_title: form.service_title,
        amount_pi: form.amount_pi,
        pi_payment_id: payment.identifier,
        deadline: form.deadline || undefined,
      });
      if (id) {
        setTab('mine');
        getMyEscrows(user.uid).then(setEscrows);
        setForm({ seller_pi_id:'', service_title:'', amount_pi:1, deadline:'' });
        setSellerSearch('');
      }
    }
    setSending(false);
  };

  const handleRelease = async (escrow: Escrow) => {
    const ok = await updateEscrowStatus(escrow.id, 'released');
    if (ok) setEscrows(prev => prev.map(e => e.id===escrow.id ? {...e, status:'released'} : e));
  };

  const handleDispute = async (escrow: Escrow) => {
    const ok = await updateEscrowStatus(escrow.id, 'disputed');
    if (ok) setEscrows(prev => prev.map(e => e.id===escrow.id ? {...e, status:'disputed'} : e));
  };

  const statusColor = (s: string) => {
    if (s==='held') return mood.primary;
    if (s==='released') return '#34d399';
    if (s==='disputed') return '#f87171';
    return mood.muted;
  };

  const statusLabel = (s: string) => {
    if (s==='held') return '🔒 HELD';
    if (s==='released') return '✓ RELEASED';
    if (s==='disputed') return '⚠ DISPUTED';
    return s.toUpperCase();
  };

  return (
    <div style={{ minHeight:'100dvh' }}>
      <div style={{ padding:'20px 20px 14px', borderBottom:`1px solid ${mood.border}`, background:`linear-gradient(180deg, ${mood.primaryGlow} 0%, transparent 100%)` }}>
        <div className="section-label" style={{ marginBottom:'6px', color:mood.primary }}>PI ESCROW</div>
        <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color:mood.cream, marginBottom:'8px' }}>
          Safe Transactions
        </div>
        <p style={{ fontSize:'11px', color:mood.muted, lineHeight:1.7, marginBottom:'14px' }}>
          Pay Pi securely. Funds released only when you confirm the work is done.
        </p>
        <div style={{ display:'flex', gap:'6px' }}>
          {(['mine','create'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:'10px',
              background: tab===t ? `${mood.primaryGlow}` : 'transparent',
              border:`1px solid ${tab===t ? mood.borderHi : mood.border}`,
              color: tab===t ? mood.primary : mood.muted,
              fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'2px',
              cursor:'pointer', textTransform:'uppercase',
            }}>
              {t === 'mine' ? 'MY ESCROWS' : '+ NEW ESCROW'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'mine' && (
        <div style={{ padding:'14px 16px' }}>
          {!user ? (
            <div style={{ textAlign:'center', padding:'40px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>SIGN IN TO VIEW ESCROWS</div>
          ) : loading ? (
            <div style={{ textAlign:'center', padding:'40px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>LOADING...</div>
          ) : escrows.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px', lineHeight:2 }}>
              NO ESCROWS YET<br/>
              <span style={{ fontSize:'9px' }}>Create one to safely hire a pioneer</span>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {escrows.map(e => {
                const isBuyer = e.buyer_pi_id === user?.uid;
                return (
                  <div key={e.id} style={{ padding:'16px', border:`1px solid ${mood.border}`, background:mood.surface }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
                      <div>
                        <div style={{ fontFamily:"'Cinzel', serif", fontSize:'12px', color:mood.cream, marginBottom:'3px' }}>{e.service_title}</div>
                        <div style={{ fontSize:'10px', color:mood.muted }}>
                          {isBuyer ? `To: ${e.seller_name}` : `From: ${e.buyer_name}`}
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'16px', color:mood.primary }}>{e.amount_pi}π</div>
                        <div style={{ fontSize:'9px', color:statusColor(e.status), marginTop:'2px', fontFamily:"'Cinzel', serif", letterSpacing:'1px' }}>
                          {statusLabel(e.status)}
                        </div>
                      </div>
                    </div>
                    {e.deadline && (
                      <div style={{ fontSize:'9px', color:mood.muted, marginBottom:'10px' }}>
                        Deadline: {new Date(e.deadline).toLocaleDateString()}
                      </div>
                    )}
                    {e.status === 'held' && isBuyer && (
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button onClick={() => handleRelease(e)} className="btn-primary" style={{ flex:2, padding:'10px', fontSize:'9px' }}>
                          ✓ RELEASE PAYMENT
                        </button>
                        <button onClick={() => handleDispute(e)} style={{
                          flex:1, padding:'10px', background:'transparent',
                          border:'1px solid rgba(248,113,113,0.3)', color:'rgba(248,113,113,0.7)',
                          fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'1px', cursor:'pointer',
                        }}>DISPUTE</button>
                      </div>
                    )}
                    {e.status === 'held' && !isBuyer && (
                      <div style={{ padding:'10px', background:`${mood.primaryGlow}`, border:`1px solid ${mood.border}`, fontSize:'11px', color:mood.muted, textAlign:'center', fontFamily:"'Cinzel', serif", letterSpacing:'1px' }}>
                        AWAITING BUYER CONFIRMATION
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
          {!user ? (
            <div style={{ textAlign:'center', padding:'40px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>SIGN IN FIRST</div>
          ) : (
            <>
              <div>
                <div className="section-label" style={{ marginBottom:'6px' }}>SEARCH PIONEER *</div>
                <input className="input" value={sellerSearch} onChange={e=>setSellerSearch(e.target.value)} placeholder="Search by name..."/>
                {searchedPioneers.length > 0 && (
                  <div style={{ border:`1px solid ${mood.border}`, marginTop:'2px' }}>
                    {searchedPioneers.map(p => (
                      <div key={p.piId} onClick={() => { setForm(prev=>({...prev,seller_pi_id:p.piId})); setSellerSearch(p.name); }} style={{
                        padding:'10px 14px', cursor:'pointer', borderBottom:`1px solid ${mood.border}`,
                        background: form.seller_pi_id===p.piId ? `${mood.primaryGlow}` : mood.surface,
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                      }}>
                        <div>
                          <div style={{ fontFamily:"'Cinzel', serif", fontSize:'12px', color:mood.cream }}>{p.name}</div>
                          <div style={{ fontSize:'10px', color:mood.muted }}>{p.profession}</div>
                        </div>
                        {form.seller_pi_id===p.piId && <span style={{ color:mood.primary }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="section-label" style={{ marginBottom:'6px' }}>SERVICE DESCRIPTION *</div>
                <input className="input" value={form.service_title} onChange={e=>setForm(p=>({...p,service_title:e.target.value}))} placeholder="e.g. Logo design, App development..."/>
              </div>
              <div>
                <div className="section-label" style={{ marginBottom:'6px' }}>AMOUNT IN Pi *</div>
                <input className="input" type="number" step="0.001" min="0.001" value={form.amount_pi} onChange={e=>setForm(p=>({...p,amount_pi:parseFloat(e.target.value)}))}/>
              </div>
              <div>
                <div className="section-label" style={{ marginBottom:'6px' }}>DEADLINE (OPTIONAL)</div>
                <input className="input" type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}/>
              </div>
              <div style={{ padding:'14px', background:`${mood.primaryGlow}`, border:`1px solid ${mood.border}` }}>
                <div style={{ fontSize:'12px', color:mood.cream, marginBottom:'4px' }}>How it works</div>
                <div style={{ fontSize:'10px', color:mood.muted, lineHeight:1.8 }}>
                  1. You pay Pi upfront — held securely<br/>
                  2. Pioneer completes the work<br/>
                  3. You confirm → Pi released to pioneer<br/>
                  4. Dispute if work isn't done
                </div>
              </div>
              <button className="btn-primary" onClick={handleCreate} disabled={sending || !form.seller_pi_id || !form.service_title} style={{ padding:'14px', fontSize:'11px', opacity:sending?0.7:1 }}>
                {sending ? 'PROCESSING...' : `◆ CREATE ESCROW FOR ${form.amount_pi}π`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
