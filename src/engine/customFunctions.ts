/* eslint-disable @typescript-eslint/no-explicit-any */
import { CellError, ErrorType, HyperFormula } from 'hyperformula';
import { CUSTOM_FUNCTIONS } from './lang';

/**
 * Fonctions qu'HyperFormula 3.5 ne fournit pas mais qu'Excel possède :
 * - AVERAGEIFS / MOYENNE.SI.ENS
 * - CONCAT
 * On réutilise les classes internes d'HyperFormula (récupérées via
 * getFunctionPlugin) pour garder exactement la même logique de critères
 * que SOMME.SI.ENS et la même conversion en texte que JOINDRE.TEXTE.
 */
let done = false;

export function registerCustomFunctions(): void {
  if (done) return;
  done = true;
  const CondPlugin = HyperFormula.getFunctionPlugin('SUMIFS') as any;
  const TextPlugin = HyperFormula.getFunctionPlugin('TEXTJOIN') as any;
  const sumifsMeta = CondPlugin.implementedFunctions.SUMIFS;
  const textjoinMeta = TextPlugin.implementedFunctions.TEXTJOIN;

  class AverageIfsPlugin extends CondPlugin {
    averageifs(ast: any, state: any) {
      const compute = (values: any, ...args: any[]) => {
        const res = (this as any).computeConditionalAggregationFunction(
          values,
          args,
          'AVERAGEIFS',
          { s: 0, c: 0 },
          (a: any, b: any) => (a instanceof CellError ? a : b instanceof CellError ? b : { s: a.s + b.s, c: a.c + b.c }),
          (v: any) => {
            if (v instanceof CellError) return v;
            const raw = typeof v === 'number' ? v : typeof v?.val === 'number' ? v.val : undefined;
            return raw === undefined ? { s: 0, c: 0 } : { s: raw, c: 1 };
          },
        );
        if (res instanceof CellError) return res;
        // Même erreur que MOYENNE.SI quand rien ne correspond.
        return res.c === 0 ? new CellError(ErrorType.DIV_BY_ZERO) : res.s / res.c;
      };
      return (this as any).runFunction(ast.args, state, (this as any).metadata('AVERAGEIFS'), compute);
    }
  }
  (AverageIfsPlugin as any).implementedFunctions = {
    AVERAGEIFS: { ...sumifsMeta, method: 'averageifs' },
  };

  class ConcatPlugin extends TextPlugin {
    concat(ast: any, state: any) {
      return (this as any).runFunction(ast.args, state, (this as any).metadata('CONCAT'), (...args: any[]) => {
        let out = '';
        for (const a of args) {
          const parts = (this as any).flattenArgToStrings(a);
          if (parts && !Array.isArray(parts)) return parts; // erreur
          out += parts.join('');
        }
        return out;
      });
    }
  }
  (ConcatPlugin as any).implementedFunctions = {
    CONCAT: { method: 'concat', repeatLastArgs: 1, parameters: [{ argumentType: textjoinMeta.parameters[2].argumentType }] },
  };

  const tr = (key: string) => ({
    enGB: { [key]: key },
    frFR: { [key]: CUSTOM_FUNCTIONS[key] },
  });
  HyperFormula.registerFunctionPlugin(AverageIfsPlugin as any, tr('AVERAGEIFS'));
  HyperFormula.registerFunctionPlugin(ConcatPlugin as any, tr('CONCAT'));
}
