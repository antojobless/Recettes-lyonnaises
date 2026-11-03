import { describe, expect, it } from 'vitest';
import { emptyProgress, recordFailure, recordSuccess, sanitize, streak } from './progress';

describe('répétition espacée', () => {
  it('ratée → demain ; réussie → 3, 7, puis 14 jours', () => {
    let p = recordFailure(emptyProgress(), 'e', ['SUM'], '2026-01-10');
    expect(p.notions.SUM.due).toBe('2026-01-11');
    p = recordSuccess(p, 'e', ['SUM'], 0, '2026-01-11');
    expect(p.notions.SUM.due).toBe('2026-01-14');
    p = recordSuccess(p, 'e', ['SUM'], 0, '2026-01-14');
    expect(p.notions.SUM.due).toBe('2026-01-21');
    p = recordSuccess(p, 'e', ['SUM'], 0, '2026-01-21');
    expect(p.notions.SUM.due).toBe('2026-02-04');
    p = recordSuccess(p, 'e', ['SUM'], 3, '2026-02-04');
    expect(p.notions.SUM.due).toBe('2026-02-05');
  });
  it('score selon les indices, on garde le meilleur', () => {
    let p = recordSuccess(emptyProgress(), 'e', [], 2, '2026-01-10');
    expect(p.ex.e.score).toBe(0.5);
    p = recordSuccess(p, 'e', [], 0, '2026-01-11');
    expect(p.ex.e.score).toBe(1);
    p = recordSuccess(p, 'e', [], 3, '2026-01-12');
    expect(p.ex.e.score).toBe(1);
  });
  it('série de jours', () => {
    const p = { ...emptyProgress(), days: ['2026-01-08', '2026-01-09', '2026-01-10'] };
    expect(streak(p, '2026-01-10')).toBe(3);
    expect(streak(p, '2026-01-11')).toBe(3);
    expect(streak(p, '2026-01-12')).toBe(0);
  });
  it('import refusé si ce n’est pas une progression', () => {
    expect(() => sanitize({ foo: 1 })).toThrow();
    expect(sanitize({ v: 1, ex: {} }).lang).toBe('fr');
  });
});
