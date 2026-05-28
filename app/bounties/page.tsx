"use client";

import { useState, useEffect } from "react";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { useMood } from "@/contexts/mood-context";
import { useWall } from "@/contexts/wall-context";
import { getBounties, createBounty, applyToBounty, getBountyApplications, selectBountyWinner, Bounty, BountyApplication } from "@/lib/db";

const CATEGORIES = ['All','Development','Design','Marketing','Translation','Content','Other'];

export default function BountiesPage() {
  const { user } = usePiAuth();
  const { mood } = useMood();
  const { currentUser, createPayment } = useWall() as any;
  const { createPayment: piPay } = usePiAuth();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'open'|'create'>('open');
  const [category, setCategory] = useState('All');
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [applications, setApplications] = useState<BountyApplication[]>([]);
  const [proposal, setProposal] = useState('');
  const [sending, setSending] = useState(false);

  // Create form
  const [form, setForm] = useState({ title:'', description:'', reward_pi:1, category:'Development', deadline:'' });

  useEffect(() => {
    getBounties('open').then(data => { setBounties(data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (selectedBounty) {
      getBountyApplications(selectedBounty.id).then(setApplications);
    }
  }, [selectedBounty]);

  const filtered = category === 'All' ? bounties : bounties.filter(b => b.category === category);

  const handleCreate = async () => {
    if (!user || !currentUser || !form.title || !form.description) return;
    setSending(true);
    const payment = await piPay({
      amount: form.reward_pi,
      memo: `The Wall — Bounty: ${form.title}`,
      metadata: { type:'bounty', title:form.title },
    });
    if (payment) {
      const ok = await createBounty({
        creator_pi_id: user.uid,
        creator_name: currentUser.name,
        title: form.title,
        description: form.description,
        reward_pi: form.reward_pi,
        category: form.category,
        deadline: form.deadline || undefined,
        pi_payment_id: payment.identifier,
      });
      if (ok) {
        setForm({ title:'', description:'', reward_pi:1, category:'Development', deadline:'' });
        setTab('open');
        getBounties('open').then(setBounties);
      }
    }
    setSending(false);
  };

  const handleApply = async () => {
    if (!user || !currentUser || !selectedBounty || !proposal.trim()) return;
    setSending(true);
    const ok = await applyToBounty({
      bounty_id: selectedBounty.id,
      applicant_pi_id: user.uid,
      applicant_name: currentUser.name,
      proposal: proposal.trim(),
    });
    if (ok) { setProposal(''); getBountyApplications(selectedBounty.id).then(setApplications); }
    setSending(false);
  };

  const handleSelectWinner = async (app: BountyApplication) => {
    if (!selectedBounty) return;
    const ok = await selectBountyWinner(selectedBounty.id, app.applicant_pi_id, app.applicant_name);
    if (ok) {
      setBounties(prev => prev.filter(b => b.id !== selectedBounty.id));
      setSelectedBounty(null);
    }
  };

  // Bounty detail modal
  if (selectedBounty) return (
    <div style={{ minHeight:'100dvh', padding:'20px 16px' }}>
      <button onClick={() => setSelectedBounty(null)} style={{ background:'transparent', border:'none', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'2px', cursor:'pointer', marginBottom:'16px' }}>← BACK</button>

      <div style={{ padding:'20px', background:mood.surface, border:`1px solid ${mood.border}`, marginBottom:'16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
          <div>
            <div style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px', color:mood.primary, marginBottom:'6px', textTransform:'uppercase' }}>{selectedBounty.category}</div>
            <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'16px', color:mood.cream, marginBottom:'6px' }}>{selectedBounty.title}</div>
            <div style={{ fontSize:'11px', color:mood.muted }}>{selectedBounty.creator_name}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'20px', color:mood.primary }}>{selectedBounty.reward_pi}π</div>
            <div style={{ fontSize:'9px', color:mood.muted, marginTop:'2px' }}>REWARD</div>
          </div>
        </div>
        <div style={{ height:'1px', background:mood.border, margin:'12px 0' }}/>
        <p style={{ fontSize:'13px', color:mood.cream, lineHeight:1.8 }}>{selectedBounty.description}</p>
        {selectedBounty.deadline && (
          <div style={{ marginTop:'10px', fontSize:'10px', color:mood.muted }}>
            Deadline: {new Date(selectedBounty.deadline).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Apply */}
      {user && user.uid !== selectedBounty.creator_pi_id && (
        <div style={{ padding:'16px', background:mood.surface, border:`1px solid ${mood.border}`, marginBottom:'16px' }}>
          <div className="section-label" style={{ marginBottom:'10px' }}>SUBMIT YOUR PROPOSAL</div>
          <textarea className="input" value={proposal} onChange={e=>setProposal(e.target.value)} placeholder="Describe how you'll complete this bounty..." rows={4} style={{ resize:'none', marginBottom:'10px' }}/>
          <button className="btn-primary" onClick={handleApply} disabled={sending || !proposal.trim()} style={{ padding:'13px', fontSize:'10px', opacity:sending?0.7:1 }}>
            {sending ? '...' : '◆ SUBMIT PROPOSAL'}
          </button>
        </div>
      )}

      {/* Applications */}
      <div className="section-label" style={{ marginBottom:'12px' }}>APPLICATIONS ({applications.length})</div>
      {applications.map(app => (
        <div key={app.id} style={{ padding:'14px', border:`1px solid ${mood.border}`, background:mood.surface, marginBottom:'8px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
            <span style={{ fontFamily:"'Cinzel', serif", fontSize:'11px', color:mood.primary }}>{app.applicant_name}</span>
            <span style={{ fontSize:'9px', color:mood.muted }}>{new Date(app.created_at).toLocaleDateString()}</span>
          </div>
          <p style={{ fontSize:'12px', color:mood.cream, lineHeight:1.7, marginBottom:user?.uid === selectedBounty.creator_pi_id ? '10px' : '0' }}>{app.proposal}</p>
          {user?.uid === selectedBounty.creator_pi_id && (
            <button className="btn-primary" onClick={() => handleSelectWinner(app)} style={{ padding:'10px', fontSize:'9px' }}>
              ✓ SELECT AS WINNER
            </button>
          )}
        </div>
      ))}
      {applications.length === 0 && (
        <div style={{ textAlign:'center', padding:'30px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>NO PROPOSALS YET</div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight:'100dvh' }}>
      {/* Header */}
      <div style={{ padding:'20px 20px 14px', borderBottom:`1px solid ${mood.border}`, background:`linear-gradient(180deg, ${mood.primaryGlow} 0%, transparent 100%)` }}>
        <div className="section-label" style={{ marginBottom:'6px', color:mood.primary }}>PI BOUNTIES</div>
        <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color:mood.cream, marginBottom:'14px' }}>
          Post Tasks · Get Paid in Pi
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          {(['open','create'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:'10px',
              background: tab===t ? `${mood.primaryGlow}` : 'transparent',
              border:`1px solid ${tab===t ? mood.borderHi : mood.border}`,
              color: tab===t ? mood.primary : mood.muted,
              fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'2px',
              cursor:'pointer', textTransform:'uppercase',
            }}>
              {t === 'open' ? `OPEN (${bounties.length})` : '+ CREATE BOUNTY'}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      {tab === 'open' && (
        <div style={{ overflowX:'auto', display:'flex', gap:'5px', padding:'10px 16px', scrollbarWidth:'none', borderBottom:`1px solid ${mood.border}`, background:mood.deep }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              flexShrink:0, padding:'5px 12px',
              background: category===cat ? `${mood.primaryGlow}` : 'transparent',
              border:`1px solid ${category===cat ? mood.borderHi : mood.border}`,
              color: category===cat ? mood.primary : mood.muted,
              fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px',
              cursor:'pointer', whiteSpace:'nowrap',
            }}>{cat.toUpperCase()}</button>
          ))}
        </div>
      )}

      {/* Open bounties */}
      {tab === 'open' && (
        <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'40px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>LOADING...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>NO OPEN BOUNTIES</div>
          ) : (
            filtered.map(b => (
              <div key={b.id} onClick={() => setSelectedBounty(b)} style={{
                padding:'16px', border:`1px solid ${mood.border}`,
                background:mood.surface, cursor:'pointer', transition:'all 0.2s',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                  <div style={{ flex:1, paddingRight:'10px' }}>
                    <div style={{ fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px', color:mood.primary, marginBottom:'5px', textTransform:'uppercase' }}>{b.category}</div>
                    <div style={{ fontFamily:"'Cinzel', serif", fontSize:'13px', color:mood.cream, marginBottom:'3px' }}>{b.title}</div>
                    <div style={{ fontSize:'10px', color:mood.muted }}>{b.creator_name}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color:mood.primary }}>{b.reward_pi}π</div>
                    <div style={{ fontSize:'8px', color:mood.muted, marginTop:'2px' }}>REWARD</div>
                  </div>
                </div>
                <p style={{ fontSize:'12px', color:mood.muted, lineHeight:1.6, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>{b.description}</p>
                {b.deadline && (
                  <div style={{ marginTop:'8px', fontSize:'9px', color:mood.muted }}>
                    Deadline: {new Date(b.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Create bounty */}
      {tab === 'create' && (
        <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
          {!user ? (
            <div style={{ textAlign:'center', padding:'40px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>
              SIGN IN TO CREATE A BOUNTY
            </div>
          ) : (
            <>
              <div>
                <div className="section-label" style={{ marginBottom:'6px' }}>BOUNTY TITLE *</div>
                <input className="input" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="What do you need done?"/>
              </div>
              <div>
                <div className="section-label" style={{ marginBottom:'6px' }}>DESCRIPTION *</div>
                <textarea className="input" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Describe the task in detail..." rows={4} style={{ resize:'none' }}/>
              </div>
              <div>
                <div className="section-label" style={{ marginBottom:'8px' }}>CATEGORY</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {CATEGORIES.filter(c=>c!=='All').map(cat => (
                    <button key={cat} onClick={() => setForm(p=>({...p,category:cat}))} style={{
                      padding:'6px 12px',
                      background: form.category===cat ? `${mood.primaryGlow}` : 'transparent',
                      border:`1px solid ${form.category===cat ? mood.borderHi : mood.border}`,
                      color: form.category===cat ? mood.primary : mood.muted,
                      fontFamily:"'Cinzel', serif", fontSize:'9px', letterSpacing:'1px',
                      cursor:'pointer',
                    }}>{cat.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="section-label" style={{ marginBottom:'6px' }}>REWARD IN Pi *</div>
                <input className="input" type="number" step="0.001" min="0.001" value={form.reward_pi} onChange={e=>setForm(p=>({...p,reward_pi:parseFloat(e.target.value)}))} placeholder="Amount in Pi"/>
              </div>
              <div>
                <div className="section-label" style={{ marginBottom:'6px' }}>DEADLINE (OPTIONAL)</div>
                <input className="input" type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}/>
              </div>
              <div style={{ padding:'14px', background:`${mood.primaryGlow}`, border:`1px solid ${mood.border}` }}>
                <div style={{ fontSize:'12px', color:mood.cream, marginBottom:'4px' }}>
                  You'll pay <strong style={{ color:mood.primary }}>{form.reward_pi}π</strong> upfront
                </div>
                <div style={{ fontSize:'10px', color:mood.muted }}>Held securely — paid to winner when you select them. 5% platform fee applies.</div>
              </div>
              <button className="btn-primary" onClick={handleCreate} disabled={sending || !form.title || !form.description} style={{ padding:'14px', fontSize:'11px', opacity:sending?0.7:1 }}>
                {sending ? 'PROCESSING...' : `◆ POST BOUNTY FOR ${form.reward_pi}π`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
