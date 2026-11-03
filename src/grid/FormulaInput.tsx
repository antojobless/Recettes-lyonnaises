import { forwardRef, KeyboardEvent, useLayoutEffect, useRef } from 'react';
import { findRefs } from '../engine/formula';
import { Lang } from '../engine/lang';

export const REF_COLORS = ['#1f6fd1', '#d13a1f', '#7b3fbf', '#178a3a', '#c2185b', '#b26a00', '#00838f'];

interface Props {
  value: string;
  lang: Lang;
  className?: string;
  style?: React.CSSProperties;
  onChange: (text: string, caret: number) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onCaret?: (caret: number) => void;
  onFocus?: () => void;
  testId?: string;
  ariaLabel?: string;
}

/**
 * Champ de saisie dont les références sont colorées comme dans Excel.
 * Un calque « miroir » derrière l'input dessine le texte coloré ; l'input,
 * au texte transparent, garde le curseur et la saisie.
 */
export const FormulaInput = forwardRef<HTMLInputElement, Props>(function FormulaInput(
  { value, lang, className, style, onChange, onKeyDown, onCaret, onFocus, testId, ariaLabel },
  ref,
) {
  const mirror = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLInputElement | null>(null);

  const parts: { text: string; color?: string }[] = [];
  if (value.startsWith('=')) {
    let pos = 0;
    findRefs(value, lang).forEach((s, i) => {
      if (s.start > pos) parts.push({ text: value.slice(pos, s.start) });
      parts.push({ text: value.slice(s.start, s.end), color: REF_COLORS[i % REF_COLORS.length] });
      pos = s.end;
    });
    if (pos < value.length) parts.push({ text: value.slice(pos) });
  } else parts.push({ text: value });

  useLayoutEffect(() => {
    if (mirror.current && inner.current) mirror.current.scrollLeft = inner.current.scrollLeft;
  });

  return (
    <div className={`finput ${className ?? ''}`} style={style}>
      <div className="finput-mirror" ref={mirror} aria-hidden>
        {parts.map((p, i) => (
          <span key={i} style={p.color ? { color: p.color } : undefined}>
            {p.text}
          </span>
        ))}
        {'​'}
      </div>
      <input
        ref={(el) => {
          inner.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        data-testid={testId}
        aria-label={ariaLabel}
        className="finput-input"
        value={value}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
        onKeyDown={onKeyDown}
        onKeyUp={(e) => onCaret?.((e.target as HTMLInputElement).selectionStart ?? 0)}
        onClick={(e) => onCaret?.((e.target as HTMLInputElement).selectionStart ?? 0)}
        onFocus={onFocus}
        onScroll={(e) => {
          if (mirror.current) mirror.current.scrollLeft = (e.target as HTMLInputElement).scrollLeft;
        }}
      />
    </div>
  );
});
