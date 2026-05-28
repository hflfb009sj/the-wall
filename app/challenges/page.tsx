"use client";

import { useState, useEffect } from "react";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { useMood } from "@/contexts/mood-context";
import { useWall } from "@/contexts/wall-context";
import { getActiveChallenges, getChallengeEntries, joinChallenge, voteForChallenge, Challenge, ChallengeEntry } from "@/lib/db";
import { MiniSigil } from "@/components/sigil-display";
import { useWall as useWallCtx } from "@/contexts/wall-context";

export default function ChallengesPage() {
  const { user } = usePiAuth();
  const { mood } = useMood();
  const { currentUser, pioneers } = useWall();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selected, setSelected] = useState<Challenge | null>(null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [votedFor, setVotedFor] = useState<Record<string, string>>({});
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    getActiveChallenges().then(data => { setChallenges(data); setLoading(false); if(data.length>0) setSelected(data[0]); });
    const stored = JSON.parse(localStorage.getItem('wall_votes_v1')||'{}');
    setVotedFor(stored);
    setMyVotes(new Set(Object.keys(stored)));
  }, []);

  useEffect(() => {
    if (selected) getChallengeEntries(selected.id).then(setEntries);
  }, [selected]);

  const isJoined = entries.some(e => e.pioneer_pi_id === user?.uid);
  const hasVoted = selected ? myVotes.has(selected.id) : false;
  const daysLeft = selected ? Math.max(0, Math.ceil((new Date(selected.end_date).getTime() - Date.now()) / 86400000)) : 0;

  const handleJoin = async () => {
    if (!user || !currentUser || !selected || isJoined) return;
    setJoining(true);
    const ok = await joinChallenge(selected.id, user.uid, currentUser.name);
    if (ok) getChallengeEntries(selected.id).then(setEntries);
    setJoining(false);
  };

  const handleVote = async (targetPiId: string) => {
    if (!user || !selected || hasVoted || targetPiId === user.uid) return;
    const ok = await voteForChallenge(selected.id, user.uid, targetPiId);
    if (ok) {
      const updated = { ...votedFor, [selected.id]: targetPiId };
      setVotedFor(updated);
      setMyVotes(prev => new Set([...prev, selected.id]));
      localStorage.setItem('wall_votes_v1', JSON.stringify(updated));
      getChallengeEntries(selected.id).then(setEntries);
    }
  };

  const maxVotes = entries.length > 0 ? Math.max(...entries.map(e => e.votes)) : 1;

  return (
    <div style={{ minHeight:'100dvh' }}>

      {/* Header */}
      <div style={{ padding:'20px 20px 14px', borderBottom:`1px solid ${mood.border}`, background:`linear-gradient(180deg, ${mood.primaryGlow} 0%, transparent 100%)` }}>
        <div className="section-label" style={{ marginBottom:'6px', color:mood.primary }}>PIONEER CHALLENGES</div>
        <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color:mood.cream, marginBottom:'8px' }}>
          Weekly Competitions
        </div>
        <p style={{ fontSize:'11px', color:mood.muted, lineHeight:1.7 }}>
          Compete, vote, and win Pi + exclusive badges. New challenge every week.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>LOADING...</div>
      ) : challenges.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px', lineHeight:2 }}>
          NO ACTIVE CHALLENGES<br/>
          <span style={{ fontSize:'9px' }}>Check back soon</span>
        </div>
      ) : (
        <>
          {/* Challenge tabs */}
          {challenges.length > 1 && (
            <div style={{ overflowX:'auto', display:'flex', gap:'5px', padding:'10px 16px', scrollbarWidth:'none', borderBottom:`1px solid ${mood.border}`, background:mood.deep }}>
              {challenges.map(c => (
                <button key={c.id} onClick={() => setSelected(c)} style={{
                  flexShrink:0, padding:'6px 14px',
                  background: selected?.id===c.id ? `${mood.primaryGlow}` : 'transparent',
                  border:`1px solid ${selected?.id===c.id ? mood.borderHi : mood.border}`,
                  color: selected?.id===c.id ? mood.primary : mood.muted,
                  fontFamily:"'Cinzel', serif", fontSize:'8px', letterSpacing:'2px',
                  cursor:'pointer', whiteSpace:'nowrap', textTransform:'uppercase',
                }}>
                  {c.title.substring(0,20)}...
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div style={{ padding:'16px' }}>

              {/* Challenge card */}
              <div style={{ padding:'20px', background:mood.surface, border:`1px solid ${mood.borderHi}`, marginBottom:'16px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, right:0, padding:'6px 14px', background:`${mood.primaryGlow}`, border:`1px solid ${mood.border}`, fontFamily:"'Cinzel', serif", fontSize:'8px', color:mood.primary, letterSpacing:'2px' }}>
                  {daysLeft}D LEFT
                </div>
                <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'16px', color:mood.cream, marginBottom:'8px', paddingRight:'80px' }}>
                  {selected.title}
                </div>
                <p style={{ fontSize:'12px', color:mood.muted, lineHeight:1.8, marginBottom:'14px' }}>{selected.description}</p>

                {/* Reward */}
                <div style={{ display:'flex', gap:'10px', alignItems:'center', padding:'12px', background:`${mood.primaryGlow}`, border:`1px solid ${mood.border}`, marginBottom:'14px' }}>
                  <span style={{ fontSize:'20px' }}>{selected.reward_badge.split(' ')[0]}</span>
                  <div>
                    <div style={{ fontFamily:"'Cinzel', serif", fontSize:'10px', color:mood.cream, marginBottom:'2px' }}>
                      {selected.reward_badge.split(' ').slice(1).join(' ')}
                    </div>
                    {selected.reward_pi > 0 && (
                      <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'14px', color:mood.primary }}>+{selected.reward_pi}π REWARD</div>
                    )}
                  </div>
                </div>

                {/* Join button */}
                {user && !isJoined && (
                  <button className="btn-primary" onClick={handleJoin} disabled={joining} style={{ padding:'13px', fontSize:'10px', opacity:joining?0.7:1 }}>
                    {joining ? '...' : '◆ JOIN THIS CHALLENGE'}
                  </button>
                )}
                {isJoined && (
                  <div style={{ padding:'12px', textAlign:'center', background:`rgba(52,211,153,0.1)`, border:`1px solid rgba(52,211,153,0.3)`, fontFamily:"'Cinzel', serif", fontSize:'10px', color:'#34d399', letterSpacing:'2px' }}>
                    ✓ YOU ARE IN THIS CHALLENGE
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              <div className="section-label" style={{ marginBottom:'12px' }}>LEADERBOARD ({entries.length})</div>

              {entries.length === 0 ? (
                <div style={{ textAlign:'center', padding:'30px', color:mood.muted, fontFamily:"'Cinzel', serif", fontSize:'10px', letterSpacing:'3px' }}>
                  BE THE FIRST TO JOIN
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {entries.map((entry, i) => {
                    const pioneer = pioneers.find(p => p.piId === entry.pioneer_pi_id);
                    const isMe = entry.pioneer_pi_id === user?.uid;
                    const votedThis = votedFor[selected.id] === entry.pioneer_pi_id;
                    const pct = maxVotes > 0 ? (entry.votes / maxVotes) * 100 : 0;

                    return (
                      <div key={entry.id} style={{
                        padding:'14px',
                        border:`1px solid ${votedThis ? mood.borderHi : mood.border}`,
                        background: isMe ? `${mood.primaryGlow}` : mood.surface,
                        position:'relative', overflow:'hidden',
                      }}>
                        {/* Vote bar */}
                        <div style={{ position:'absolute', bottom:0, left:0, height:'2px', width:`${pct}%`, background:`linear-gradient(90deg,${mood.btnFrom},${mood.btnTo})`, transition:'width 0.5s ease' }}/>

                        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                          {/* Rank */}
                          <div style={{ fontFamily:"'Cinzel Decorative', serif", fontSize:'18px', color: i===0?'#fbbf24':i===1?mood.silver:i===2?'#c8845a':mood.muted, width:'28px', textAlign:'center', flexShrink:0 }}>
                            {i===0?'①':i===1?'②':i===2?'③':`${i+1}`}
                          </div>

                          {/* Sigil + name */}
                          {pioneer && <MiniSigil piId={pioneer.piId} timestamp={pioneer.engravedAt} tier={pioneer.tier} size={30}/>}
                          <div style={{ flex:1 }}>
                            <div style={{ fontFamily:"'Cinzel', serif", fontSize:'12px', color: isMe ? mood.primary : mood.cream }}>{entry.pioneer_name} {isMe && '(you)'}</div>
                            {pioneer && <div style={{ fontSize:'9px', color:mood.muted, marginTop:'1px' }}>{pioneer.profession}</div>}
                          </div>

                          {/* Votes + vote button */}
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
                            <div style={{ fontFamily:"'Cinzel', serif", fontSize:'13px', color:mood.primary }}>
                              {entry.votes} <span style={{ fontSize:'9px', color:mood.muted }}>votes</span>
                            </div>
                            {user && !hasVoted && !isMe && (
                              <button onClick={() => handleVote(entry.pioneer_pi_id)} style={{
                                background:`${mood.primaryGlow}`, border:`1px solid ${mood.border}`,
                                color:mood.primary, fontFamily:"'Cinzel', serif", fontSize:'8px',
                                letterSpacing:'1px', padding:'4px 10px', cursor:'pointer',
                              }}>VOTE</button>
                            )}
                            {votedThis && (
                              <span style={{ fontSize:'9px', color:'#34d399', fontFamily:"'Cinzel', serif" }}>✓ VOTED</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Voting note */}
              {hasVoted && (
                <div style={{ marginTop:'12px', padding:'10px', textAlign:'center', fontSize:'10px', color:mood.muted, fontFamily:"'Cinzel', serif", letterSpacing:'1px' }}>
                  You've cast your vote for this challenge
                </div>
              )}
              {!user && (
                <div style={{ marginTop:'12px', padding:'10px', textAlign:'center', fontSize:'10px', color:mood.muted, fontFamily:"'Cinzel', serif", letterSpacing:'1px' }}>
                  SIGN IN TO VOTE OR JOIN
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
