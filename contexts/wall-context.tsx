"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import type { PioneerProfile, Service, TierType } from "@/lib/wall-types";
import { TIERS, TIER_ORDER } from "@/lib/wall-types";
import { getAllPioneers, getPioneerById, upsertPioneer, incrementLikes, updateRating, searchPioneersDB, getForSalePioneers } from "@/lib/db";

interface WallContextType {
  pioneers: PioneerProfile[];
  currentUser: PioneerProfile | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (profile: Partial<PioneerProfile> & { piId: string }) => Promise<void>;
  addService: (service: Service) => Promise<void>;
  removeService: (serviceId: string) => Promise<void>;
  likePioneer: (piId: string) => Promise<void>;
  ratePioneer: (piId: string, rating: number) => Promise<void>;
  searchPioneers: (query: string) => PioneerProfile[];
  filterByTier: (tier: TierType | 'all') => PioneerProfile[];
  listForSale: (price: number) => Promise<void>;
  setCurrentUserById: (piId: string) => Promise<void>;
  refreshPioneers: () => Promise<void>;
  totalCount: number;
  sovereignCount: number;
  tradeCount: number;
}

const WallContext = createContext<WallContextType | undefined>(undefined);
const USER_KEY = 'wall_user_v3';
const LIKED_KEY = 'wall_liked_v3';
const RATED_KEY = 'wall_rated_v3';

// Tier sort order
const TIER_RANK: Record<string, number> = {
  sovereign: 0, genesis: 1, obsidian: 2, gold: 3, silver: 4, bronze: 5, stone: 6
};

export function WallProvider({ children }: { children: ReactNode }) {
  const [pioneers, setPioneers] = useState<PioneerProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<PioneerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeCount] = useState(847);

  // Load pioneers from Supabase
  const refreshPioneers = useCallback(async () => {
    try {
      const data = await getAllPioneers();
      const sorted = [...data].sort((a, b) => (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9) || b.likes - a.likes);
      setPioneers(sorted);
    } catch (err) {
      console.error('refreshPioneers:', err);
      setError('Failed to load pioneers');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshPioneers();
      // Restore current user
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        try {
          const u = JSON.parse(stored) as PioneerProfile;
          // Re-fetch from DB to get latest data
          const fresh = await getPioneerById(u.piId);
          setCurrentUser(fresh || u);
        } catch {}
      }
      setIsLoading(false);
    };
    init();
  }, [refreshPioneers]);

  const setCurrentUserById = useCallback(async (piId: string) => {
    const pioneer = await getPioneerById(piId);
    if (pioneer) {
      setCurrentUser(pioneer);
      localStorage.setItem(USER_KEY, JSON.stringify(pioneer));
    }
  }, []);

  const updateProfile = useCallback(async (profile: Partial<PioneerProfile> & { piId: string }) => {
    setIsLoading(true);
    try {
      const existing = pioneers.find(p => p.piId === profile.piId) || currentUser;
      const updated: PioneerProfile = {
        username: profile.username || profile.piId,
        likes: 0, rating: 0, ratingCount: 0, heritage: 0,
        services: [], engravedAt: Date.now(),
        ...(existing || {}),
        ...profile,
      } as PioneerProfile;

      const ok = await upsertPioneer(updated);
      if (ok) {
        setCurrentUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        await refreshPioneers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsLoading(false);
    }
  }, [pioneers, currentUser, refreshPioneers]);

  const addService = useCallback(async (service: Service) => {
    if (!currentUser) return;
    await updateProfile({ ...currentUser, services: [...currentUser.services, service] });
  }, [currentUser, updateProfile]);

  const removeService = useCallback(async (serviceId: string) => {
    if (!currentUser) return;
    await updateProfile({ ...currentUser, services: currentUser.services.filter(s => s.id !== serviceId) });
  }, [currentUser, updateProfile]);

  const likePioneer = useCallback(async (piId: string) => {
    const liked = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]') as string[];
    if (liked.includes(piId)) return;
    liked.push(piId);
    localStorage.setItem(LIKED_KEY, JSON.stringify(liked));
    await incrementLikes(piId);
    await refreshPioneers();
  }, [refreshPioneers]);

  const ratePioneer = useCallback(async (piId: string, rating: number) => {
    const rated = JSON.parse(localStorage.getItem(RATED_KEY) || '{}') as Record<string, boolean>;
    if (rated[piId]) return;
    rated[piId] = true;
    localStorage.setItem(RATED_KEY, JSON.stringify(rated));
    const pioneer = pioneers.find(p => p.piId === piId);
    if (!pioneer) return;
    const newCount = pioneer.ratingCount + 1;
    const newRating = Math.round(((pioneer.rating * pioneer.ratingCount) + rating) / newCount * 10) / 10;
    await updateRating(piId, newRating, newCount);
    await refreshPioneers();
  }, [pioneers, refreshPioneers]);

  const searchPioneers = useCallback((query: string): PioneerProfile[] => {
    if (!query.trim()) return pioneers;
    const q = query.toLowerCase();
    return pioneers.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.profession.toLowerCase().includes(q)
    );
  }, [pioneers]);

  const filterByTier = useCallback((tier: TierType | 'all'): PioneerProfile[] => {
    if (tier === 'all') return pioneers;
    return pioneers.filter(p => p.tier === tier);
  }, [pioneers]);

  const listForSale = useCallback(async (price: number) => {
    if (!currentUser) return;
    await updateProfile({ ...currentUser, isForSale: true, salePrice: price });
  }, [currentUser, updateProfile]);

  return (
    <WallContext.Provider value={{
      pioneers, currentUser, isLoading, error,
      updateProfile, addService, removeService,
      likePioneer, ratePioneer, searchPioneers,
      filterByTier, listForSale, setCurrentUserById,
      refreshPioneers,
      totalCount: pioneers.length,
      sovereignCount: pioneers.filter(p => p.tier === 'sovereign').length,
      tradeCount,
    }}>
      {children}
    </WallContext.Provider>
  );
}

export function useWall() {
  const ctx = useContext(WallContext);
  if (!ctx) throw new Error("useWall must be used within WallProvider");
  return ctx;
}
