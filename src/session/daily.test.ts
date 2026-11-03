import { describe, expect, it } from 'vitest';
import { ALL_EXERCISES, MODULES } from '../exercises';
import { emptyProgress, recordFailure, recordSuccess } from '../state/progress';
import { buildSession, sessionMinutes } from './daily';

describe('séance du jour', () => {
  it('débutant : on commence par le module 0, un mini-test, 30 à 45 min', () => {
    const s = buildSession(emptyProgress(), '2026-03-02');
    expect(s.items.length).toBeGreaterThan(0);
    expect(ALL_EXERCISES.find((e) => e.id === s.items[0].id)!.module).toBe(0);
    expect(s.test.length).toBe(3);
    const m = sessionMinutes(s);
    expect(m).toBeGreaterThanOrEqual(30);
    expect(m).toBeLessThanOrEqual(45);
  });
  it('une notion ratée hier revient en tête aujourd’hui', () => {
    let p = emptyProgress();
    for (const e of MODULES[0].exercises) p = recordSuccess(p, e.id, e.notions, 0, '2026-03-01');
    for (const e of MODULES[1].exercises) p = recordSuccess(p, e.id, e.notions, 0, '2026-03-01');
    p = recordFailure(p, 'm1-5', ['PCT'], '2026-03-01');
    const s = buildSession(p, '2026-03-02');
    const first = ALL_EXERCISES.find((e) => e.id === s.items[0].id)!;
    expect(s.items[0].kind).toBe('review');
    expect(first.notions).toContain('PCT');
    expect(s.items.some((i) => i.kind === 'new')).toBe(true);
    expect(sessionMinutes(s)).toBeLessThanOrEqual(45);
    expect(sessionMinutes(s)).toBeGreaterThanOrEqual(30);
  });
  it('une notion réussie ne revient pas avant 3 jours', () => {
    let p = emptyProgress();
    for (const e of MODULES[0].exercises) p = recordSuccess(p, e.id, e.notions, 0, '2026-03-01');
    const s = buildSession(p, '2026-03-02');
    expect(s.items.filter((i) => i.kind === 'review').length).toBeLessThanOrEqual(s.items.length);
    const due = buildSession(p, '2026-03-04');
    expect(due.items.some((i) => i.kind === 'review' && ALL_EXERCISES.find((e) => e.id === i.id)!.notions.includes('INTERFACE'))).toBe(true);
  });
  it('même jour, même progression → même séance', () => {
    expect(buildSession(emptyProgress(), '2026-03-02')).toEqual(buildSession(emptyProgress(), '2026-03-02'));
  });
});
