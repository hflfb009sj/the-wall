// ═══════════════════════════════════════
// THE WALL — Dynamic Mood Color System
// ═══════════════════════════════════════

export interface Mood {
  id: string;
  name: string;
  // Backgrounds
  void: string;        // deepest bg
  deep: string;        // card bg
  surface: string;     // raised elements
  // Primary accent
  primary: string;     // main color
  primaryDim: string;  // muted version
  primaryGlow: string; // glow rgba
  // Secondary accent
  secondary: string;
  // Text
  cream: string;       // main text
  muted: string;       // muted text
  // Border
  border: string;
  borderHi: string;
  // Button gradient
  btnFrom: string;
  btnTo: string;
  // Special
  live: string;        // live dot color
}

export const MOODS: Record<string, Mood> = {
  cosmic: {
    id: 'cosmic', name: 'Cosmic',
    void: '#07050f', deep: '#0d0920', surface: '#130e2a',
    primary: '#818cf8', primaryDim: '#4338ca', primaryGlow: 'rgba(129,140,248,0.25)',
    secondary: '#22d3ee',
    cream: '#e0e7ff', muted: '#4c4a6a',
    border: 'rgba(129,140,248,0.14)', borderHi: 'rgba(129,140,248,0.4)',
    btnFrom: '#818cf8', btnTo: '#4f46e5',
    live: '#22d3ee',
  },
  ember: {
    id: 'ember', name: 'Ember',
    void: '#0d0500', deep: '#1a0a00', surface: '#261200',
    primary: '#f97316', primaryDim: '#c2410c', primaryGlow: 'rgba(249,115,22,0.25)',
    secondary: '#fbbf24',
    cream: '#fff7ed', muted: '#57340f',
    border: 'rgba(249,115,22,0.14)', borderHi: 'rgba(249,115,22,0.4)',
    btnFrom: '#f97316', btnTo: '#dc2626',
    live: '#fbbf24',
  },
  ocean: {
    id: 'ocean', name: 'Ocean',
    void: '#020c14', deep: '#031624', surface: '#04202e',
    primary: '#06b6d4', primaryDim: '#0e7490', primaryGlow: 'rgba(6,182,212,0.25)',
    secondary: '#2dd4bf',
    cream: '#ecfeff', muted: '#164e63',
    border: 'rgba(6,182,212,0.14)', borderHi: 'rgba(6,182,212,0.4)',
    btnFrom: '#06b6d4', btnTo: '#0e7490',
    live: '#2dd4bf',
  },
  forest: {
    id: 'forest', name: 'Forest',
    void: '#020f06', deep: '#041a0a', surface: '#062410',
    primary: '#10b981', primaryDim: '#047857', primaryGlow: 'rgba(16,185,129,0.25)',
    secondary: '#34d399',
    cream: '#ecfdf5', muted: '#065f46',
    border: 'rgba(16,185,129,0.14)', borderHi: 'rgba(16,185,129,0.4)',
    btnFrom: '#10b981', btnTo: '#059669',
    live: '#34d399',
  },
  rose: {
    id: 'rose', name: 'Rose Gold',
    void: '#0f0507', deep: '#1a0810', surface: '#260c18',
    primary: '#f43f5e', primaryDim: '#be123c', primaryGlow: 'rgba(244,63,94,0.25)',
    secondary: '#fb7185',
    cream: '#fff1f2', muted: '#9f1239',
    border: 'rgba(244,63,94,0.14)', borderHi: 'rgba(244,63,94,0.4)',
    btnFrom: '#f43f5e', btnTo: '#be123c',
    live: '#fb7185',
  },
  aurora: {
    id: 'aurora', name: 'Aurora',
    void: '#050d0e', deep: '#081820', surface: '#0a2028',
    primary: '#10b981', primaryDim: '#0d9488', primaryGlow: 'rgba(16,185,129,0.2)',
    secondary: '#6366f1',
    cream: '#f0fdf4', muted: '#134e4a',
    border: 'rgba(16,185,129,0.12)', borderHi: 'rgba(99,102,241,0.35)',
    btnFrom: '#10b981', btnTo: '#6366f1',
    live: '#06b6d4',
  },
  gold: {
    id: 'gold', name: 'Gold Rush',
    void: '#0a0700', deep: '#160f00', surface: '#201600',
    primary: '#f59e0b', primaryDim: '#b45309', primaryGlow: 'rgba(245,158,11,0.25)',
    secondary: '#fbbf24',
    cream: '#fffbeb', muted: '#78350f',
    border: 'rgba(245,158,11,0.14)', borderHi: 'rgba(245,158,11,0.4)',
    btnFrom: '#f59e0b', btnTo: '#d97706',
    live: '#fbbf24',
  },
  void: {
    id: 'void', name: 'Void',
    void: '#050507', deep: '#0c0c10', surface: '#141418',
    primary: '#94a3b8', primaryDim: '#475569', primaryGlow: 'rgba(148,163,184,0.2)',
    secondary: '#cbd5e1',
    cream: '#f8fafc', muted: '#475569',
    border: 'rgba(148,163,184,0.12)', borderHi: 'rgba(148,163,184,0.3)',
    btnFrom: '#64748b', btnTo: '#334155',
    live: '#94a3b8',
  },
};

export const MOOD_IDS = Object.keys(MOODS);

// Get a random mood — but not the same as last time
export function getRandomMood(lastMoodId?: string): Mood {
  const available = MOOD_IDS.filter(id => id !== lastMoodId);
  const id = available[Math.floor(Math.random() * available.length)];
  return MOODS[id];
}

// Get mood by id
export function getMood(id: string): Mood {
  return MOODS[id] || MOODS.cosmic;
}

// Persist mood to localStorage
export const MOOD_STORAGE_KEY = 'wall_mood_v1';

export function loadMood(): Mood {
  if (typeof window === 'undefined') return MOODS.cosmic;
  try {
    const stored = localStorage.getItem(MOOD_STORAGE_KEY);
    if (stored) {
      const { id, timestamp } = JSON.parse(stored);
      // Change mood if opened more than 30 minutes ago
      const isStale = Date.now() - timestamp > 30 * 60 * 1000;
      if (!isStale && MOODS[id]) return MOODS[id];
    }
  } catch {}
  return getRandomMood();
}

export function saveMood(mood: Mood): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify({ id: mood.id, timestamp: Date.now() }));
}

export function cycleMood(currentId: string): Mood {
  const ids = MOOD_IDS;
  const idx = ids.indexOf(currentId);
  const next = MOODS[ids[(idx + 1) % ids.length]];
  saveMood(next);
  return next;
}
