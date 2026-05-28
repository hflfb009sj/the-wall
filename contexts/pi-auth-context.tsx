"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface PiUser { uid: string; username: string; }
interface PaymentData { amount: number; memo: string; metadata: Record<string, unknown>; }
interface PaymentResult { identifier: string; txid?: string; }

interface PiAuthContextType {
  user: PiUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  createPayment: (data: PaymentData) => Promise<PaymentResult | null>;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

type PiSDK = {
  init: (config: { version: string; sandbox: boolean }) => void;
  authenticate: (scopes: string[], cb: (p: unknown) => void) => Promise<{ user: PiUser; accessToken: string }>;
  createPayment: (data: PaymentData, callbacks: {
    onReadyForServerApproval: (id: string) => void;
    onReadyForServerCompletion: (id: string, txid: string) => void;
    onCancel: (id: string) => void;
    onError: (e: Error, p: unknown) => void;
  }) => void;
};

const APP_ID = "the-wall-17f83751cc0521cc";
const IS_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true';

function getPi(): PiSDK | undefined {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).Pi as PiSDK | undefined;
  }
  return undefined;
}

async function serverApprove(paymentId: string, metadata: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch('/api/payments/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, piId: metadata.piId || 'unknown', tier: metadata.tier || null, amount: metadata.amount || 0, type: metadata.type || 'unknown' }),
    });
    return (await res.json()).approved === true;
  } catch { return false; }
}

async function serverComplete(paymentId: string, txId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/payments/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId, txId }),
    });
    return (await res.json()).completed === true;
  } catch { return false; }
}

async function handleIncomplete(payment: unknown) {
  const p = payment as { identifier?: string; transaction?: { txid?: string } };
  if (!p?.identifier) return;
  if (p.transaction?.txid) await serverComplete(p.identifier, p.transaction.txid);
}

let piInitialized = false;

export function PiAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Init Pi SDK once
    if (!piInitialized) {
      const Pi = getPi();
      if (Pi) {
        Pi.init({ version: "2.0", sandbox: IS_SANDBOX });
        piInitialized = true;
      }
    }
    // Restore session
    try {
      const stored = localStorage.getItem('wall_session_v3');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    try {
      const Pi = getPi();
      if (Pi) {
        const auth = await Pi.authenticate(['username', 'payments'], handleIncomplete);
        const u: PiUser = { uid: auth.user.uid, username: auth.user.username };
        setUser(u);
        localStorage.setItem('wall_session_v3', JSON.stringify(u));
      } else {
        // Dev mode — outside Pi Browser
        const u: PiUser = { uid: `dev_${Date.now().toString(36)}`, username: 'pioneer_dev' };
        setUser(u);
        localStorage.setItem('wall_session_v3', JSON.stringify(u));
      }
    } catch (e) { console.error('signIn error:', e); }
    finally { setIsLoading(false); }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('wall_session_v3');
  };

  const createPayment = (data: PaymentData): Promise<PaymentResult | null> => {
    return new Promise((resolve, reject) => {
      const Pi = getPi();

      // Dev fallback
      if (!Pi) {
        setTimeout(() => resolve({ identifier: `dev_${Date.now().toString(36)}` }), 1200);
        return;
      }

      Pi.createPayment(data, {
        onReadyForServerApproval: async (paymentId) => {
          const ok = await serverApprove(paymentId, { ...data.metadata, amount: data.amount });
          if (!ok) console.warn('[Pi] Approval failed for', paymentId);
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          await serverComplete(paymentId, txid);
          resolve({ identifier: paymentId, txid });
        },
        onCancel: () => resolve(null),
        onError: (error) => {
          console.error('[Pi] Payment error:', error);
          reject(error);
        },
      });
    });
  };

  return (
    <PiAuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, signIn, signOut, createPayment }}>
      {children}
    </PiAuthContext.Provider>
  );
}

export function usePiAuth() {
  const ctx = useContext(PiAuthContext);
  if (!ctx) throw new Error("usePiAuth must be used within PiAuthProvider");
  return ctx;
}
