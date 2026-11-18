import { STORAGE_KEYS } from '../config/game';

export interface Best { time: number; score: number; won: boolean }

const EMPTY: Best = { time: 0, score: 0, won: false };

export function loadBest(): Best {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.best);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch { /* almacenamiento no disponible */ }
  return { ...EMPTY };
}

/** Guarda el récord local y devuelve si se superó el tiempo o el puntaje. */
export function saveResult(time: number, score: number, won: boolean): { best: Best; newTime: boolean; newScore: boolean } {
  const prev = loadBest();
  const best: Best = {
    time: Math.max(prev.time, time),
    score: Math.max(prev.score, score),
    won: prev.won || won,
  };
  try { localStorage.setItem(STORAGE_KEYS.best, JSON.stringify(best)); } catch { /* ignorar */ }
  return { best, newTime: time > prev.time, newScore: score > prev.score };
}

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
