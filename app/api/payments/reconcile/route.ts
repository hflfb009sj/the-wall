import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// Called on app startup to fix any payments stuck in 'approved' state
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 });

    const supabase = getSupabase();

    // Find payments stuck in 'approved' for more than 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: stuck } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'approved')
      .lt('created_at', tenMinAgo)
      .limit(10);

    if (!stuck?.length) {
      return NextResponse.json({ reconciled: 0 });
    }

    let count = 0;
    for (const payment of stuck) {
      // Check Pi Network for actual status
      const res = await fetch(
        `https://api.minepi.com/v2/payments/${payment.pi_payment_id}`,
        { headers: { Authorization: `Key ${apiKey}` } }
      );

      if (!res.ok) continue;
      const piPayment = await res.json();

      // If Pi says it's completed but we didn't record it
      if (piPayment.status?.developer_completed && piPayment.transaction?.txid) {
        await supabase
          .from('payments')
          .update({ status: 'completed', tx_id: piPayment.transaction.txid })
          .eq('pi_payment_id', payment.pi_payment_id);
        count++;
      }
    }

    return NextResponse.json({ reconciled: count });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
