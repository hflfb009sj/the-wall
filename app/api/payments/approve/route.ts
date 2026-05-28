import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { paymentId, piId, tier, amount, type } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId required' }, { status: 400 });
    }

    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'PI_API_KEY not configured' }, { status: 500 });
    }

    // ── 1. Verify payment exists on Pi Network ──────────────────────────
    const verifyRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      { headers: { Authorization: `Key ${apiKey}` } }
    );

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      console.error('Pi verify failed:', verifyRes.status, errText);
      return NextResponse.json({ error: 'Payment not found on Pi Network' }, { status: 400 });
    }

    const piPayment = await verifyRes.json();

    // ── 2. Check not already approved ──────────────────────────────────
    if (piPayment.status?.developer_approved) {
      // Already approved — just record and return OK
      return NextResponse.json({ approved: true, already: true });
    }

    // ── 3. Approve on Pi Network ────────────────────────────────────────
    const approveRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: 'POST',
        headers: { Authorization: `Key ${apiKey}` },
      }
    );

    if (!approveRes.ok) {
      const errText = await approveRes.text();
      console.error('Pi approve failed:', approveRes.status, errText);
      return NextResponse.json({ error: 'Pi approval failed' }, { status: 500 });
    }

    // ── 4. Record in Supabase ───────────────────────────────────────────
    const supabase = getSupabase();
    const { error: dbErr } = await supabase.from('payments').upsert({
      pi_payment_id: paymentId,
      from_pi_id:    piId || 'unknown',
      to_pi_id:      null,
      amount:        amount || piPayment.amount || 0,
      type:          type   || 'engrave',
      tier:          tier   || null,
      status:        'approved',
    }, { onConflict: 'pi_payment_id' });

    if (dbErr) {
      // Don't fail — payment is approved on Pi side
      console.warn('DB record failed (non-critical):', dbErr.message);
    }

    return NextResponse.json({ approved: true });

  } catch (err) {
    console.error('Approve route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
