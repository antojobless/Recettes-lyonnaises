import { describe, expect, it } from 'vitest';
import { modelFromSetup } from './checker';
import { ALL_EXERCISES } from './index';
import { checkTools, sortModel } from './tools';
import { ToolsExercise } from './types';

const toolsEx = ALL_EXERCISES.filter((e): e is ToolsExercise => e.kind === 'tools');

describe.each(toolsEx.map((e) => [e.id, e] as const))('exercice %s', (_id, ex) => {
  const fresh = () => modelFromSetup(ex.setup(), 'fr');
  const ncols = 8;
  it('la bonne manipulation est acceptée', () => {
    const m = fresh();
    const g = ex.goal;
    if (g.type === 'sort') sortModel(m, g.sort, ncols);
    const r = checkTools(ex, { model: m, filter: g.type === 'filter' ? g.filter : null, rules: g.type === 'cf' ? [g.rule] : [] });
    expect(r.messages).toEqual([]);
  });
  it('une erreur typique est refusée avec son message', () => {
    const m = fresh();
    const g = ex.goal;
    let r;
    if (g.type === 'sort') {
      sortModel(m, { ...g.sort, dir: g.sort.dir === 'asc' ? 'desc' : 'asc' }, ncols);
      r = checkTools(ex, { model: m, filter: null, rules: [] });
      expect(r.messages[0]).toBe(ex.mistakes.find((x) => x.when === 'wrong-dir')!.message);
    } else if (g.type === 'filter') {
      r = checkTools(ex, { model: m, filter: { ...g.filter, col: g.filter.col === 0 ? 1 : 0 }, rules: [] });
      expect(r.messages[0]).toBe(ex.mistakes.find((x) => x.when === 'wrong-col')!.message);
    } else {
      r = checkTools(ex, { model: m, filter: null, rules: [{ ...g.rule, range: g.rule.range.replace(/2:/, '1:') }] });
      expect(r.messages[0]).toBe(ex.mistakes.find((x) => x.when === 'wrong-range')!.message);
    }
    expect(r.ok).toBe(false);
  });
  it('sans rien faire, c’est refusé', () => {
    expect(checkTools(ex, { model: fresh(), filter: null, rules: [] }).ok).toBe(false);
  });
});
