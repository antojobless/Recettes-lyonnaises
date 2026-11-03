import { describe, expect, it } from 'vitest';
import { parseAddr, translateFormula } from '../engine/formula';
import { modelFromSetup } from '../exercises/checker';
import { emptySpec } from '../ui/PivotPlayer';
import { gradeExam } from './grade';
import { SUBJECTS } from './subjects';

describe('tests d’entreprise', () => {
  it('au moins 5 sujets', () => expect(SUBJECTS.length).toBeGreaterThanOrEqual(5));
  describe.each(SUBJECTS.map((s) => [s.id, s] as const))('sujet %s', (_id, s) => {
    it('8 à 12 questions, dont un TCD, SOMME.SI.ENS, RECHERCHEV, SI et un pourcentage', () => {
      expect(s.questions.length).toBeGreaterThanOrEqual(8);
      expect(s.questions.length).toBeLessThanOrEqual(12);
      const topics = s.questions.map((q) => q.topic).join(' ');
      expect(s.questions.some((q) => q.pivot)).toBe(true);
      expect(topics).toMatch(/SOMME\.SI/);
      expect(topics).toMatch(/RECHERCHEV/);
      expect(s.questions.some((q) => /^SI\b/.test(q.topic))).toBe(true);
      expect(s.questions.some((q) => q.fmt === 'pct')).toBe(true);
      const rows = s.dataset().rows.length;
      expect(rows).toBeGreaterThanOrEqual(30);
      expect(rows).toBeLessThanOrEqual(200);
    });
    for (const lang of ['fr', 'en'] as const)
      it(`toutes les solutions donnent 100 % (${lang})`, () => {
        const m = modelFromSetup(s.setup(), lang);
        for (const q of s.questions) if (q.cell) m.set(parseAddr(q.cell).row, parseAddr(q.cell).col, translateFormula(q.solution!, 'en', lang));
        const pq = s.questions.find((q) => q.pivot)!;
        const res = gradeExam(s, m, pq.pivot!.goal, pq.pivot!.answer);
        expect(res.filter((r) => !r.ok)).toEqual([]);
        for (const r of res) expect(r.got).not.toMatch(/^#/);
      });
    it('copie blanche = 0', () => {
      const res = gradeExam(s, modelFromSetup(s.setup(), 'fr'), emptySpec(), '');
      expect(res.every((r) => !r.ok)).toBe(true);
    });
  });
});
