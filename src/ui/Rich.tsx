import { Fragment, ReactNode } from 'react';
import { translateFormula } from '../engine/formula';
import { bilingual, Lang, localName } from '../engine/lang';

/** Transforme un texte « riche » en nœuds React (voir types.ts pour la syntaxe). */
export function richNodes(text: string, lang: Lang): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\{\{(.+?)\}\}|`([^`]+)`|\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1] !== undefined) {
      const inner = m[1];
      if (inner.startsWith('=')) out.push(<code key={k++}>{translateFormula(inner, 'en', lang)}</code>);
      else out.push(<strong key={k++} className="fn" title={bilingual(inner, lang)}>{bilingualLabel(inner, lang)}</strong>);
    } else if (m[2] !== undefined) out.push(<code key={k++}>{m[2]}</code>);
    else out.push(<strong key={k++}>{richNodes(m[3], lang)}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return out;
}

function bilingualLabel(en: string, lang: Lang): ReactNode {
  const main = localName(en, lang);
  const other = lang === 'fr' ? en : localName(en, 'fr');
  if (main === other) return main;
  return (
    <>
      {main} <span className="other-lang">({other})</span>
    </>
  );
}

/** Version texte brut (pour les titres, les attributs). */
export function richText(text: string, lang: Lang): string {
  return text
    .replace(/\{\{(.+?)\}\}/g, (_, inner: string) => (inner.startsWith('=') ? translateFormula(inner, 'en', lang) : localName(inner, lang)))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1');
}

export function Rich({ text, lang, as = 'span' }: { text: string; lang: Lang; as?: 'span' | 'p' | 'div' }) {
  const Tag = as;
  return <Tag>{richNodes(text, lang)}</Tag>;
}
