"use client";

import { useEffect, useState } from "react";
import { generateSigil, generateSigilData, renderSigilSVG } from "@/lib/sigil";

interface SigilProps {
  piId: string;
  timestamp: number;
  size?: number;
  tier?: string;
  animate?: boolean;
}

const TIER_GLOWS: Record<string, string> = {
  sovereign: 'drop-shadow(0 0 14px rgba(255,248,224,0.7)) drop-shadow(0 0 28px rgba(255,248,224,0.25))',
  genesis:   'drop-shadow(0 0 12px rgba(212,160,255,0.65))',
  obsidian:  'drop-shadow(0 0 10px rgba(96,200,255,0.55))',
  gold:      'drop-shadow(0 0 8px rgba(232,184,75,0.5))',
  silver:    'drop-shadow(0 0 6px rgba(192,200,224,0.3))',
  bronze:    'drop-shadow(0 0 5px rgba(200,132,90,0.3))',
  stone:     'none',
};

export function SigilDisplay({ piId, timestamp, size = 80, tier = 'bronze', animate = true }: SigilProps) {
  const [svg, setSvg] = useState('');
  useEffect(() => { setSvg(generateSigil(piId, timestamp, size)); }, [piId, timestamp, size]);
  return (
    <div style={{ filter: TIER_GLOWS[tier] || 'none', animation: animate ? 'float 5s ease-in-out infinite' : 'none', display:'inline-flex' }}
      dangerouslySetInnerHTML={{ __html: svg }}/>
  );
}

export function MiniSigil({ piId, timestamp, size = 18, tier = 'bronze' }: SigilProps) {
  const [svg, setSvg] = useState('');
  useEffect(() => { setSvg(generateSigil(piId, timestamp, size)); }, [piId, timestamp, size]);
  return (
    <span style={{ filter: TIER_GLOWS[tier] || 'none', display:'inline-flex', flexShrink:0 }}
      dangerouslySetInnerHTML={{ __html: svg }}/>
  );
}
