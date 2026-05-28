import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { paymentId, txId } = await req.json();

    if (!paymentId || !txId) {
      return NextResponse.json({ error: 'paymentId and txId required' }, { status: 400 });
    }

    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'PI_API_KEY not configured' }, { status: 500 });
    }

    // ── 1. Verify payment on Pi Network ────────────────────────────────
    const verifyRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      { headers: { Authorization: `Key ${apiKey}` } }
    );

    if (!verifyRes.ok) {
      console.error('Pi verify failed:', verifyRes.status);
      // Don't fail hard — txid exists on chain
    }

    let piPayment: Record<string, unknown> = {};
    if (verifyRes.ok) {
      piPayment = await verifyRes.json();
    }

    // ── 2. Check not already completed ─────────────────────────────────
    const status = piPayment.status as Record<string, unknown> | undefined;
    if (status?.developer_completed) {
      // Already completed — still update DB and return OK
      const supabase = getSupabase();
      await supabase
        .from('payments')
        .update({ status: 'completed', tx_id: txId })
        .eq('pi_payment_id', paymentId);
      return NextResponse.json({ completed: true, already: true });
    }

    // ── 3. Complete on Pi Network ───────────────────────────────────────
    const completeRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid: txId }),
      }
    );

    if (!completeRes.ok) {
      const errText = await completeRes.text();
      console.error('Pi complete failed:', completeRes.status, errText);
      return NextResponse.json({ error: 'Pi completion failed' }, { status: 500 });
    }

    // ── 4. Update DB ────────────────────────────────────────────────────
    const supabase = getSupabase();
    const { error: dbErr } = await supabase
      .from('payments')
      .update({ status: 'completed', tx_id: txId })
      .eq('pi_payment_id', paymentId);

    if (dbErr) {
      console.warn('DB update failed (non-critical):', dbErr.message);
    }

    return NextResponse.json({ completed: true });

  } catch (err) {
    console.error('Complete route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
