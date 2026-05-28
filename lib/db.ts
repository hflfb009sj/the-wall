import { supabase } from './supabase';
import type { PioneerProfile, Service } from './wall-types';
import type { DBPioneer } from './supabase';

// Convert DB row to app type
function dbToPioneer(row: DBPioneer): PioneerProfile {
  return {
    piId: row.pi_id,
    username: row.username,
    name: row.name,
    profession: row.profession,
    bio: row.bio || undefined,
    tier: row.tier as PioneerProfile['tier'],
    services: JSON.parse(row.services || '[]') as Service[],
    likes: row.likes,
    rating: row.rating,
    ratingCount: row.rating_count,
    heritage: row.heritage,
    isForSale: row.is_for_sale,
    salePrice: row.sale_price || undefined,
    engravedAt: row.engraved_at,
  };
}

// Convert app type to DB row
function pioneerToDb(p: PioneerProfile): Omit<DBPioneer, 'id' | 'created_at'> {
  return {
    pi_id: p.piId,
    username: p.username,
    name: p.name,
    profession: p.profession,
    bio: p.bio || null,
    tier: p.tier,
    services: JSON.stringify(p.services),
    likes: p.likes,
    rating: p.rating,
    rating_count: p.ratingCount,
    heritage: p.heritage,
    is_for_sale: p.isForSale || false,
    sale_price: p.salePrice || null,
    engraved_at: p.engravedAt,
  };
}

// ── QUERIES ──────────────────────────────

export async function getAllPioneers(): Promise<PioneerProfile[]> {
  const { data, error } = await supabase
    .from('pioneers')
    .select('*')
    .order('tier', { ascending: true })
    .order('likes', { ascending: false });

  if (error) { console.error('getAllPioneers:', error); return []; }
  return (data as DBPioneer[]).map(dbToPioneer);
}

export async function getPioneerById(piId: string): Promise<PioneerProfile | null> {
  const { data, error } = await supabase
    .from('pioneers')
    .select('*')
    .eq('pi_id', piId)
    .single();

  if (error || !data) return null;
  return dbToPioneer(data as DBPioneer);
}

export async function upsertPioneer(pioneer: PioneerProfile): Promise<boolean> {
  const { error } = await supabase
    .from('pioneers')
    .upsert(pioneerToDb(pioneer), { onConflict: 'pi_id' });

  if (error) { console.error('upsertPioneer:', error); return false; }
  return true;
}

export async function incrementLikes(piId: string): Promise<boolean> {
  const { error } = await supabase.rpc('increment_likes', { pioneer_pi_id: piId });
  if (error) {
    // Fallback: manual update
    const { data } = await supabase.from('pioneers').select('likes').eq('pi_id', piId).single();
    if (data) {
      await supabase.from('pioneers').update({ likes: (data.likes || 0) + 1 }).eq('pi_id', piId);
    }
  }
  return true;
}

export async function updateRating(piId: string, newRating: number, newCount: number): Promise<boolean> {
  const { error } = await supabase
    .from('pioneers')
    .update({ rating: newRating, rating_count: newCount })
    .eq('pi_id', piId);

  if (error) { console.error('updateRating:', error); return false; }
  return true;
}

export async function searchPioneersDB(query: string): Promise<PioneerProfile[]> {
  const { data, error } = await supabase
    .from('pioneers')
    .select('*')
    .or(`name.ilike.%${query}%,username.ilike.%${query}%,profession.ilike.%${query}%`)
    .limit(20);

  if (error) { console.error('searchPioneers:', error); return []; }
  return (data as DBPioneer[]).map(dbToPioneer);
}

export async function getForSalePioneers(): Promise<PioneerProfile[]> {
  const { data, error } = await supabase
    .from('pioneers')
    .select('*')
    .eq('is_for_sale', true)
    .order('sale_price', { ascending: false })
    .limit(20);

  if (error) { console.error('getForSale:', error); return []; }
  return (data as DBPioneer[]).map(dbToPioneer);
}

// Record a payment
export async function recordPayment(data: {
  pi_payment_id: string;
  from_pi_id: string;
  to_pi_id: string | null;
  amount: number;
  type: string;
  tier: string | null;
  status: string;
}): Promise<boolean> {
  const { error } = await supabase.from('payments').insert(data);
  if (error) { console.error('recordPayment:', error); return false; }
  return true;
}

// ═══════════════════════════════════════
// WALL MESSAGES
// ═══════════════════════════════════════
export interface WallMessage {
  id: string;
  from_pi_id: string;
  from_name: string;
  to_pi_id: string;
  message: string;
  is_public: boolean;
  created_at: string;
}

export async function getMessages(toPiId: string): Promise<WallMessage[]> {
  const { data, error } = await supabase
    .from('wall_messages')
    .select('*')
    .eq('to_pi_id', toPiId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error('getMessages:', error); return []; }
  return (data || []) as WallMessage[];
}

export async function postMessage(msg: Omit<WallMessage, 'id' | 'created_at'>): Promise<boolean> {
  const { error } = await supabase.from('wall_messages').insert(msg);
  if (error) { console.error('postMessage:', error); return false; }
  return true;
}

// ═══════════════════════════════════════
// BOUNTIES
// ═══════════════════════════════════════
export interface Bounty {
  id: string;
  creator_pi_id: string;
  creator_name: string;
  title: string;
  description: string;
  reward_pi: number;
  category: string;
  status: 'open' | 'assigned' | 'completed' | 'cancelled';
  winner_pi_id?: string;
  winner_name?: string;
  pi_payment_id?: string;
  deadline?: string;
  created_at: string;
}

export interface BountyApplication {
  id: string;
  bounty_id: string;
  applicant_pi_id: string;
  applicant_name: string;
  proposal: string;
  created_at: string;
}

export async function getBounties(status = 'open'): Promise<Bounty[]> {
  const { data, error } = await supabase
    .from('bounties')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });
  if (error) { console.error('getBounties:', error); return []; }
  return (data || []) as Bounty[];
}

export async function createBounty(bounty: Omit<Bounty, 'id' | 'created_at' | 'status'>): Promise<boolean> {
  const { error } = await supabase.from('bounties').insert({ ...bounty, status: 'open' });
  if (error) { console.error('createBounty:', error); return false; }
  return true;
}

export async function applyToBounty(app: Omit<BountyApplication, 'id' | 'created_at'>): Promise<boolean> {
  const { error } = await supabase.from('bounty_applications').insert(app);
  if (error) { console.error('applyToBounty:', error); return false; }
  return true;
}

export async function getBountyApplications(bountyId: string): Promise<BountyApplication[]> {
  const { data, error } = await supabase
    .from('bounty_applications')
    .select('*')
    .eq('bounty_id', bountyId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getBountyApplications:', error); return []; }
  return (data || []) as BountyApplication[];
}

export async function selectBountyWinner(bountyId: string, winnerPiId: string, winnerName: string): Promise<boolean> {
  const { error } = await supabase
    .from('bounties')
    .update({ status: 'completed', winner_pi_id: winnerPiId, winner_name: winnerName })
    .eq('id', bountyId);
  if (error) { console.error('selectWinner:', error); return false; }
  return true;
}

// ═══════════════════════════════════════
// ESCROW
// ═══════════════════════════════════════
export interface Escrow {
  id: string;
  buyer_pi_id: string;
  buyer_name: string;
  seller_pi_id: string;
  seller_name: string;
  service_title: string;
  amount_pi: number;
  pi_payment_id?: string;
  status: 'held' | 'released' | 'disputed' | 'refunded';
  deadline?: string;
  created_at: string;
}

export async function createEscrow(escrow: Omit<Escrow, 'id' | 'created_at' | 'status'>): Promise<string | null> {
  const { data, error } = await supabase
    .from('escrows')
    .insert({ ...escrow, status: 'held' })
    .select('id')
    .single();
  if (error) { console.error('createEscrow:', error); return null; }
  return (data as { id: string }).id;
}

export async function getMyEscrows(piId: string): Promise<Escrow[]> {
  const { data, error } = await supabase
    .from('escrows')
    .select('*')
    .or(`buyer_pi_id.eq.${piId},seller_pi_id.eq.${piId}`)
    .order('created_at', { ascending: false });
  if (error) { console.error('getMyEscrows:', error); return []; }
  return (data || []) as Escrow[];
}

export async function updateEscrowStatus(id: string, status: Escrow['status']): Promise<boolean> {
  const { error } = await supabase.from('escrows').update({ status }).eq('id', id);
  if (error) { console.error('updateEscrow:', error); return false; }
  return true;
}

// ═══════════════════════════════════════
// CHALLENGES
// ═══════════════════════════════════════
export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  reward_badge: string;
  reward_pi: number;
  start_date: string;
  end_date: string;
  winner_pi_id?: string;
  winner_name?: string;
  status: 'active' | 'completed';
  created_at: string;
}

export interface ChallengeEntry {
  id: string;
  challenge_id: string;
  pioneer_pi_id: string;
  pioneer_name: string;
  votes: number;
  created_at: string;
}

export async function getActiveChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'active')
    .order('end_date', { ascending: true });
  if (error) { console.error('getChallenges:', error); return []; }
  return (data || []) as Challenge[];
}

export async function getChallengeEntries(challengeId: string): Promise<ChallengeEntry[]> {
  const { data, error } = await supabase
    .from('challenge_entries')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('votes', { ascending: false });
  if (error) { console.error('getChallengeEntries:', error); return []; }
  return (data || []) as ChallengeEntry[];
}

export async function joinChallenge(challengeId: string, piId: string, name: string): Promise<boolean> {
  const { error } = await supabase.from('challenge_entries')
    .upsert({ challenge_id: challengeId, pioneer_pi_id: piId, pioneer_name: name }, { onConflict: 'challenge_id,pioneer_pi_id' });
  if (error) { console.error('joinChallenge:', error); return false; }
  return true;
}

export async function voteForChallenge(challengeId: string, voterPiId: string, targetPiId: string): Promise<boolean> {
  const { error: voteError } = await supabase.from('challenge_votes')
    .insert({ challenge_id: challengeId, voter_pi_id: voterPiId, voted_for_pi_id: targetPiId });
  if (voteError) { console.error('voteForChallenge:', voteError); return false; }
  await supabase.rpc('increment_challenge_votes', { entry_pioneer_pi_id: targetPiId, entry_challenge_id: challengeId });
  return true;
}
