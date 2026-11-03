import { MODULES } from '../exercises';
import { Module } from '../exercises/types';
import { Progress } from './progress';

export const UNLOCK = 0.8;

/** Part des exercices réussis d'un module (0 à 1). */
export function moduleRate(p: Progress, m: Module): number {
  const solved = m.exercises.filter((e) => p.ex[e.id]?.solved).length;
  return solved / m.exercises.length;
}

export function isUnlocked(p: Progress, index: number): boolean {
  if (index === 0) return true;
  return moduleRate(p, MODULES[index - 1]) >= UNLOCK;
}

/** Prochain module à travailler : le premier débloqué qui n'est pas à 80 %. */
export function nextModule(p: Progress): Module {
  for (let i = 0; i < MODULES.length; i++) if (isUnlocked(p, i) && moduleRate(p, MODULES[i]) < UNLOCK) return MODULES[i];
  return MODULES[MODULES.length - 1];
}

/** Maîtrise d'une notion (0 à 1) : moyenne des meilleurs scores des exercices qui la travaillent. */
export function mastery(p: Progress, notion: string): number {
  const exs = MODULES.flatMap((m) => m.exercises).filter((e) => e.notions.includes(notion));
  if (!exs.length) return 0;
  return exs.reduce((s, e) => s + (p.ex[e.id]?.score ?? 0), 0) / exs.length;
}

export function bestTest(p: Progress): { score: number; max: number; subject: string } | null {
  let best: { score: number; max: number; subject: string } | null = null;
  for (const t of p.tests) if (!best || t.score / t.max > best.score / best.max) best = { score: t.score, max: t.max, subject: t.subject };
  return best;
}
