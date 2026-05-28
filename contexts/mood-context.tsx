"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Mood, loadMood, saveMood, cycleMood, getMood, getRandomMood, MOODS, MOOD_IDS } from "@/lib/moods";

interface MoodContextType {
  mood: Mood;
  setMood: (id: string) => void;
  nextMood: () => void;
  randomMood: () => void;
  allMoods: typeof MOODS;
  moodIds: string[];
  isTransitioning: boolean;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<Mood>(MOODS.cosmic);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const loaded = loadMood();
    setMoodState(loaded);
    applyMoodToDOM(loaded);
  }, []);

  const applyMoodToDOM = (m: Mood) => {
    const root = document.documentElement;
    root.style.setProperty('--void', m.void);
    root.style.setProperty('--deep', m.deep);
    root.style.setProperty('--surface', m.surface);
    root.style.setProperty('--primary', m.primary);
    root.style.setProperty('--primary-dim', m.primaryDim);
    root.style.setProperty('--primary-glow', m.primaryGlow);
    root.style.setProperty('--secondary', m.secondary);
    root.style.setProperty('--cream', m.cream);
    root.style.setProperty('--muted', m.muted);
    root.style.setProperty('--border', m.border);
    root.style.setProperty('--border-hi', m.borderHi);
    root.style.setProperty('--btn-from', m.btnFrom);
    root.style.setProperty('--btn-to', m.btnTo);
    root.style.setProperty('--live', m.live);
    // Also update body background
    document.body.style.background = m.void;
  };

  const transition = useCallback((newMood: Mood) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setMoodState(newMood);
      applyMoodToDOM(newMood);
      saveMood(newMood);
      setIsTransitioning(false);
    }, 200);
  }, []);

  const setMood = useCallback((id: string) => {
    transition(getMood(id));
  }, [transition]);

  const nextMood = useCallback(() => {
    transition(cycleMood(mood.id));
  }, [mood.id, transition]);

  const randomMood = useCallback(() => {
    transition(getRandomMood(mood.id));
  }, [mood.id, transition]);

  return (
    <MoodContext.Provider value={{
      mood, setMood, nextMood, randomMood,
      allMoods: MOODS, moodIds: MOOD_IDS, isTransitioning,
    }}>
      <div style={{
        transition: 'background-color 0.4s ease, color 0.4s ease',
        opacity: isTransitioning ? 0.7 : 1,
        minHeight: '100dvh',
      }}>
        {children}
      </div>
    </MoodContext.Provider>
  );
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood must be used within MoodProvider");
  return ctx;
}
