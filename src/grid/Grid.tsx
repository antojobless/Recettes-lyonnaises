import { KeyboardEvent, MouseEvent, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { CellInfo, SheetModel } from '../engine/engine';
import { addr, colName, findRefs, isPointable, shiftFormula, toggleAbsoluteAt } from '../engine/formula';
import { FormulaInput, REF_COLORS } from './FormulaInput';

export interface Pos {
  row: number;
  col: number;
}
export interface Range {
  start: Pos;
  end: Pos;
}

interface EditState {
  text: string;
  caret: number;
  /** 'enter' : on a commencé à taper (les flèches valident) ; 'edit' : F2 / double-clic (les flèches bougent le curseur) */
  mode: 'enter' | 'edit';
  where: 'cell' | 'bar';
  /** Référence insérée par le dernier clic (remplacée si on clique ailleurs sans taper) */
  point?: { start: number; end: number; anchor: Pos; head: Pos };
}

export interface GridProps {
  model: SheetModel;
  rows: number;
  cols: number;
  colWidths?: Record<number, number>;
  /** Cellules à remplir (encadrées en pointillés) */
  targets?: string[];
  readOnly?: boolean;
  height?: number | string;
  onChange?: () => void;
  onSelect?: (r: Range) => void;
  /** Mise en forme de cellule supplémentaire (mise en forme conditionnelle) */
  cellStyle?: (row: number, col: number, info: CellInfo) => React.CSSProperties | undefined;
  hiddenRows?: Set<number>;
  /** Clic sur un en-tête de colonne (tri / filtre) */
  headerExtra?: (col: number) => React.ReactNode;
  /** Place la cellule active (exemple résolu) */
  focusCell?: { row: number; col: number; n: number };
}

const ROW_H = 24;
const HEAD_W = 44;
const DEFAULT_W = 96;

export const norm = (r: Range): Range => ({
  start: { row: Math.min(r.start.row, r.end.row), col: Math.min(r.start.col, r.end.col) },
  end: { row: Math.max(r.start.row, r.end.row), col: Math.max(r.start.col, r.end.col) },
});

export function rangeLabel(r: Range): string {
  const n = norm(r);
  const a = addr(n.start.row, n.start.col);
  const b = addr(n.end.row, n.end.col);
  return a === b ? a : `${a}:${b}`;
}

export function Grid(props: GridProps) {
  const { model, rows, cols, colWidths = {}, targets = [], readOnly, onChange, onSelect, cellStyle, hiddenRows } = props;
  const lang = model.lang;
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [active, setActive] = useState<Pos>({ row: 0, col: 0 });
  const [anchor, setAnchor] = useState<Pos>({ row: 0, col: 0 });
  const [edit, setEdit] = useState<EditState | null>(null);
  const drag = useRef<null | 'select' | 'point' | 'fill'>(null);
  const [fillTo, setFillTo] = useState<Pos | null>(null);
  const fillRef = useRef<Pos | null>(null);
  const clip = useRef<{ range: Range; cells: string[][] } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cellInput = useRef<HTMLInputElement>(null);
  const barInput = useRef<HTMLInputElement>(null);
  const undo = useRef<Map<string, string>[]>([]);
  const redo = useRef<Map<string, string>[]>([]);

  const sel: Range = useMemo(() => norm({ start: anchor, end: active }), [anchor, active]);

  // ---- géométrie ----
  const widths = useMemo(() => Array.from({ length: cols }, (_, c) => colWidths[c] ?? DEFAULT_W), [cols, colWidths]);
  const lefts = useMemo(() => {
    const l = [HEAD_W];
    for (let c = 0; c < cols; c++) l.push(l[c] + widths[c]);
    return l;
  }, [widths, cols]);
  const visibleRows = useMemo(() => {
    const v: number[] = [];
    for (let r = 0; r < rows; r++) if (!hiddenRows?.has(r)) v.push(r);
    return v;
  }, [rows, hiddenRows]);
  const tops = useMemo(() => {
    const t = new Map<number, number>();
    visibleRows.forEach((r, i) => t.set(r, ROW_H * (i + 1)));
    return t;
  }, [visibleRows]);
  const rectOf = useCallback(
    (r: Range) => {
      const n = norm(r);
      const vis = visibleRows.filter((x) => x >= n.start.row && x <= n.end.row);
      if (!vis.length) return null;
      const top = tops.get(vis[0])!;
      return {
        left: lefts[n.start.col],
        top,
        width: lefts[n.end.col + 1] - lefts[n.start.col],
        height: tops.get(vis[vis.length - 1])! + ROW_H - top,
      };
    },
    [lefts, tops, visibleRows],
  );

  // ---- valeurs affichées (recalculées quand le modèle change) ----
  const infos = useMemo(() => {
    const m: CellInfo[][] = [];
    for (let r = 0; r < rows; r++) {
      const line: CellInfo[] = [];
      for (let c = 0; c < cols; c++) line.push(model.info(r, c));
      m.push(line);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, model.version, model.lang, rows, cols]);

  const targetSet = useMemo(() => new Set(targets), [targets]);

  useEffect(() => {
    onSelect?.(sel);
  }, [sel, onSelect]);

  useEffect(() => {
    if (props.focusCell) {
      setEdit(null);
      setActive({ row: props.focusCell.row, col: props.focusCell.col });
      setAnchor({ row: props.focusCell.row, col: props.focusCell.col });
    }
  }, [props.focusCell]);

  // Garde la cellule active visible
  useEffect(() => {
    const sc = scrollRef.current;
    const top = tops.get(active.row);
    if (!sc || top === undefined) return;
    const left = lefts[active.col];
    const w = widths[active.col];
    if (top < sc.scrollTop + ROW_H) sc.scrollTop = top - ROW_H;
    else if (top + ROW_H > sc.scrollTop + sc.clientHeight) sc.scrollTop = top + ROW_H - sc.clientHeight;
    if (left < sc.scrollLeft + HEAD_W) sc.scrollLeft = left - HEAD_W;
    else if (left + w > sc.scrollLeft + sc.clientWidth) sc.scrollLeft = left + w - sc.clientWidth;
  }, [active, tops, lefts, widths]);

  // Le focus suit l'état d'édition
  const wasEditing = useRef(false);
  useEffect(() => {
    if (!edit) {
      if (wasEditing.current) rootRef.current?.focus({ preventScroll: true });
      wasEditing.current = false;
      return;
    }
    wasEditing.current = true;
    const el = edit.where === 'cell' ? cellInput.current : barInput.current;
    if (el && document.activeElement !== el) el.focus({ preventScroll: true });
    if (el && el.selectionStart !== edit.caret) el.setSelectionRange(edit.caret, edit.caret);
  }, [edit]);

  // ---- modifications du modèle ----
  const apply = useCallback(
    (cells: { row: number; col: number; raw: string }[]) => {
      if (readOnly || !cells.length) return;
      undo.current.push(model.snapshot());
      if (undo.current.length > 100) undo.current.shift();
      redo.current = [];
      model.setMany(cells);
      bump();
      onChange?.();
    },
    [model, readOnly, onChange],
  );

  const clamp = (p: Pos): Pos => ({ row: Math.max(0, Math.min(rows - 1, p.row)), col: Math.max(0, Math.min(cols - 1, p.col)) });

  const stepRow = (row: number, d: number) => {
    let r = row + d;
    while (hiddenRows?.has(r) && r >= 0 && r < rows) r += d;
    return r;
  };

  const moveTo = (p: Pos, extend = false) => {
    const q = clamp(p);
    setActive(q);
    if (!extend) setAnchor(q);
  };

  const commit = (dRow: number, dCol: number) => {
    if (!edit) return;
    const text = edit.text;
    setEdit(null);
    if (text !== model.getRaw(active.row, active.col)) apply([{ row: active.row, col: active.col, raw: text.trim() === '' ? '' : text }]);
    if (dRow || dCol) moveTo({ row: stepRow(active.row, dRow), col: active.col + dCol });
  };

  const startEdit = (text: string, mode: 'enter' | 'edit', where: 'cell' | 'bar' = 'cell') => {
    if (readOnly) return;
    setEdit({ text, caret: text.length, mode, where });
  };

  // Saut au bord du bloc de données (Cmd + flèche)
  const jump = (p: Pos, dr: number, dc: number): Pos => {
    const filled = (q: Pos) => model.getRaw(q.row, q.col) !== '';
    let cur = p;
    const next = (q: Pos) => ({ row: q.row + dr, col: q.col + dc });
    const inside = (q: Pos) => q.row >= 0 && q.row < rows && q.col >= 0 && q.col < cols;
    if (filled(cur) && inside(next(cur)) && filled(next(cur))) {
      while (inside(next(cur)) && filled(next(cur))) cur = next(cur);
    } else {
      cur = next(cur);
      while (inside(cur) && !filled(cur)) cur = next(cur);
      if (!inside(cur)) cur = { row: dr ? (dr > 0 ? rows - 1 : 0) : p.row, col: dc ? (dc > 0 ? cols - 1 : 0) : p.col };
    }
    return clamp(cur);
  };

  // ---- pointage de cellules pendant la saisie d'une formule ----
  const canPoint = (e: EditState) => e.text.startsWith('=') && (!!e.point || isPointable(e.text, e.caret, lang));

  const pointTo = (e: EditState, anchorPos: Pos, head: Pos) => {
    const ref = rangeLabel({ start: anchorPos, end: head });
    const start = e.point ? e.point.start : e.caret;
    const end = e.point ? e.point.end : e.caret;
    const text = e.text.slice(0, start) + ref + e.text.slice(end);
    setEdit({ ...e, text, caret: start + ref.length, point: { start, end: start + ref.length, anchor: anchorPos, head } });
  };

  // ---- clavier : édition ----
  const onEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!edit) return;
    const k = e.key;
    const caret = (e.target as HTMLInputElement).selectionStart ?? edit.caret;
    const cur = { ...edit, caret };
    const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (k === 'Enter') {
      e.preventDefault();
      commit(e.shiftKey ? -1 : 1, 0);
    } else if (k === 'Tab') {
      e.preventDefault();
      commit(0, e.shiftKey ? -1 : 1);
    } else if (k === 'Escape') {
      e.preventDefault();
      setEdit(null);
    } else if (arrows[k] && edit.mode === 'enter') {
      const [dr, dc] = arrows[k];
      if (canPoint(cur)) {
        e.preventDefault();
        const from = cur.point ? cur.point.head : active;
        const head = clamp({ row: stepRow(from.row, dr), col: from.col + dc });
        pointTo(cur, e.shiftKey && cur.point ? cur.point.anchor : head, head);
      } else if (!edit.text.startsWith('=') || edit.mode === 'enter') {
        e.preventDefault();
        commit(dr, dc);
      }
    } else if (extraEditKey(e, cur)) {
      e.preventDefault();
    }
  };

  // F4 (fn+F4 sur Mac) ou Cmd+T : rotation des $ sur la référence sous le curseur
  const extraEditKey = (e: KeyboardEvent<HTMLInputElement>, cur: EditState): boolean => {
    if (e.key === 'F4' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't')) {
      toggleAbs(cur);
      return true;
    }
    return false;
  };

  const toggleAbs = (cur: EditState) => {
    const r = toggleAbsoluteAt(cur.text, cur.caret, lang);
    setEdit({ ...cur, text: r.text, caret: r.caret, point: undefined });
  };

  // ---- recopie ----
  /** Recopie le contenu de src sur dest (formules décalées comme dans Excel). */
  const fill = (src: Range, dest: Range) => {
    const s0 = norm(src);
    const d = norm(dest);
    const h = s0.end.row - s0.start.row + 1;
    const w = s0.end.col - s0.start.col + 1;
    const cells = [];
    for (let r = d.start.row; r <= d.end.row; r++)
      for (let c = d.start.col; c <= d.end.col; c++) {
        if (r >= s0.start.row && r <= s0.end.row && c >= s0.start.col && c <= s0.end.col) continue;
        if (hiddenRows?.has(r)) continue;
        const sr = s0.start.row + ((((r - s0.start.row) % h) + h) % h);
        const sc = s0.start.col + ((((c - s0.start.col) % w) + w) % w);
        cells.push({ row: r, col: c, raw: shiftFormula(model.getRaw(sr, sc), r - sr, c - sc, lang) });
      }
    apply(cells);
  };

  const fillDown = () => {
    if (sel.start.row === sel.end.row) {
      if (sel.start.row === 0) return;
      fill({ start: { row: sel.start.row - 1, col: sel.start.col }, end: { row: sel.start.row - 1, col: sel.end.col } }, { start: { row: sel.start.row - 1, col: sel.start.col }, end: sel.end });
    } else fill({ start: sel.start, end: { row: sel.start.row, col: sel.end.col } }, sel);
  };

  const finishFill = (to: Pos | null) => {
    if (!to) return;
    let dest: Range;
    if (to.row > sel.end.row) dest = { start: sel.start, end: { row: to.row, col: sel.end.col } };
    else if (to.row < sel.start.row) dest = { start: { row: to.row, col: sel.start.col }, end: sel.end };
    else if (to.col > sel.end.col) dest = { start: sel.start, end: { row: sel.end.row, col: to.col } };
    else if (to.col < sel.start.col) dest = { start: { row: sel.start.row, col: to.col }, end: sel.end };
    else return;
    fill(sel, dest);
    setAnchor(norm(dest).start);
    setActive(norm(dest).end);
  };

  /** Double-clic sur la poignée : recopie jusqu'à la fin des données de la colonne voisine. */
  const fillToDataEnd = () => {
    const has = (r: number, c: number) => c >= 0 && c < cols && model.getRaw(r, c) !== '';
    let last = sel.end.row;
    const probe = has(sel.end.row, sel.start.col - 1) || has(sel.end.row + 1, sel.start.col - 1) ? sel.start.col - 1 : sel.end.col + 1;
    while (last + 1 < rows && has(last + 1, probe)) last++;
    if (last > sel.end.row) finishFill({ row: last, col: sel.end.col });
  };

  const copy = () => {
    const cells: string[][] = [];
    for (let r = sel.start.row; r <= sel.end.row; r++) {
      const line = [];
      for (let c = sel.start.col; c <= sel.end.col; c++) line.push(model.getRaw(r, c));
      cells.push(line);
    }
    clip.current = { range: sel, cells };
  };

  const paste = () => {
    const cb = clip.current;
    if (!cb) return;
    const h = cb.cells.length;
    const w = cb.cells[0].length;
    // Si la sélection est un multiple de la zone copiée, on la remplit entièrement (comme Excel).
    const selH = sel.end.row - sel.start.row + 1;
    const selW = sel.end.col - sel.start.col + 1;
    const H = selH % h === 0 ? selH : h;
    const W = selW % w === 0 ? selW : w;
    const out = [];
    for (let i = 0; i < H; i++)
      for (let j = 0; j < W; j++) {
        const r = sel.start.row + i;
        const c = sel.start.col + j;
        if (r >= rows || c >= cols) continue;
        out.push({ row: r, col: c, raw: shiftFormula(cb.cells[i % h][j % w], r - (cb.range.start.row + (i % h)), c - (cb.range.start.col + (j % w)), lang) });
      }
    apply(out);
  };

  // ---- clavier : navigation ----
  const onGridKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (edit) return;
    const k = e.key;
    const mod = e.metaKey || e.ctrlKey;
    const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (arrows[k]) {
      e.preventDefault();
      const [dr, dc] = arrows[k];
      const target = mod ? jump(active, dr, dc) : { row: dr ? stepRow(active.row, dr) : active.row, col: active.col + dc };
      moveTo(target, e.shiftKey);
    } else if (k === 'Enter') {
      e.preventDefault();
      moveTo({ row: stepRow(active.row, e.shiftKey ? -1 : 1), col: active.col });
    } else if (k === 'Tab') {
      e.preventDefault();
      moveTo({ row: active.row, col: active.col + (e.shiftKey ? -1 : 1) });
    } else if (k === 'F2') {
      e.preventDefault();
      startEdit(model.getRaw(active.row, active.col), 'edit');
    } else if (k === 'Delete' || k === 'Backspace') {
      e.preventDefault();
      const cells = [];
      for (let r = sel.start.row; r <= sel.end.row; r++) for (let c = sel.start.col; c <= sel.end.col; c++) cells.push({ row: r, col: c, raw: '' });
      apply(cells);
    } else if (mod && k.toLowerCase() === 'z') {
      e.preventDefault();
      const stackFrom = e.shiftKey ? redo.current : undo.current;
      const stackTo = e.shiftKey ? undo.current : redo.current;
      const snap = stackFrom.pop();
      if (snap) {
        stackTo.push(model.snapshot());
        model.restore(snap);
        bump();
        onChange?.();
      }
    } else if (mod && k.toLowerCase() === 'a') {
      e.preventDefault();
      setAnchor({ row: 0, col: 0 });
      setActive({ row: rows - 1, col: cols - 1 });
    } else if (extraGridKey(e)) {
      e.preventDefault();
    } else if (!mod && !e.altKey && k.length === 1) {
      e.preventDefault();
      startEdit(k, 'enter');
    }
  };

  const extraGridKey = (e: KeyboardEvent<HTMLDivElement>): boolean => {
    const mod = e.metaKey || e.ctrlKey;
    const k = e.key.toLowerCase();
    if (mod && k === 'd') fillDown();
    else if (mod && k === 'c') copy();
    else if (mod && k === 'v') paste();
    else return false;
    return true;
  };

  // ---- souris ----
  const cellAt = (e: MouseEvent): Pos | null => {
    const t = (e.target as HTMLElement).closest('[data-cell]') as HTMLElement | null;
    if (!t) return null;
    const [r, c] = t.dataset.cell!.split(',').map(Number);
    return { row: r, col: c };
  };

  const onMouseDown = (e: MouseEvent) => {
    const p = cellAt(e);
    if (!p || e.button !== 0) return;
    if (edit) {
      const el = edit.where === 'cell' ? cellInput.current : barInput.current;
      const cur = { ...edit, caret: el?.selectionStart ?? edit.caret };
      if (canPoint(cur)) {
        e.preventDefault();
        drag.current = 'point';
        pointTo(cur, p, p);
        return;
      }
      commit(0, 0);
    }
    e.preventDefault();
    drag.current = 'select';
    moveTo(p, e.shiftKey);
    rootRef.current?.focus({ preventScroll: true });
  };

  const onMouseOver = (e: MouseEvent) => {
    if (!drag.current) return;
    const p = cellAt(e);
    if (!p) return;
    if (drag.current === 'select') setActive(p);
    else if (drag.current === 'fill') {
      fillRef.current = p;
      setFillTo(p);
    }
    else if (drag.current === 'point' && edit?.point) pointTo(edit, edit.point.anchor, p);
  };

  const finishFillRef = useRef(finishFill);
  finishFillRef.current = finishFill;
  useEffect(() => {
    const up = () => {
      if (drag.current === 'fill') {
        finishFillRef.current(fillRef.current);
        fillRef.current = null;
        setFillTo(null);
      }
      drag.current = null;
    };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const onDoubleClick = (e: MouseEvent) => {
    const p = cellAt(e);
    if (!p || edit) return;
    moveTo(p);
    startEdit(model.getRaw(p.row, p.col), 'edit');
  };

  // ---- rendu ----
  const editRefs = edit && edit.text.startsWith('=') ? findRefs(edit.text, lang) : [];
  const activeInfo = infos[active.row]?.[active.col];
  const barText = edit ? edit.text : activeInfo?.raw ?? '';
  const totalW = lefts[cols];
  const totalH = ROW_H * (visibleRows.length + 1);
  const selRect = rectOf(sel);
  const activeRect = rectOf({ start: active, end: active });
  const multi = sel.start.row !== sel.end.row || sel.start.col !== sel.end.col;

  return (
    <div className="grid-wrap">
      <div className="formula-bar">
        <div className="name-box" data-testid="name-box" title="Référence de la cellule active">
          {drag.current === 'select' && multi ? `${sel.end.row - sel.start.row + 1}L x ${sel.end.col - sel.start.col + 1}C` : addr(active.row, active.col)}
        </div>
        <span className="fx">fx</span>
        <FormulaInput
          ref={barInput}
          testId="formula-bar"
          ariaLabel="Barre de formule"
          className="bar-input"
          value={barText}
          lang={lang}
          onFocus={() => {
            if (!edit && !readOnly) startEdit(activeInfo?.raw ?? '', 'edit', 'bar');
            else if (edit && edit.where !== 'bar') setEdit({ ...edit, where: 'bar' });
          }}
          onChange={(text, caret) => edit && setEdit({ ...edit, text, caret, point: undefined })}
          onCaret={(caret) => edit && caret !== edit.caret && setEdit({ ...edit, caret, point: undefined })}
          onKeyDown={onEditKey}
        />
        <button
          className="dollar-btn"
          title="Bloquer la référence avec des $ (F4, ou fn+F4 sur Mac ; Cmd+T dans le vrai Excel)"
          data-testid="dollar-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            if (readOnly) return;
            const el = edit ? (edit.where === 'cell' ? cellInput.current : barInput.current) : null;
            if (edit) toggleAbs({ ...edit, caret: el?.selectionStart ?? edit.caret });
            else if (activeInfo?.isFormula) toggleAbs({ text: activeInfo.raw, caret: activeInfo.raw.length, mode: 'edit', where: 'cell' });
          }}
        >
          $
        </button>
      </div>
      <div
        className="grid-root"
        ref={rootRef}
        tabIndex={0}
        data-testid="grid"
        onKeyDown={onGridKey}
        onMouseDown={onMouseDown}
        onMouseOver={onMouseOver}
        onDoubleClick={onDoubleClick}
      >
        <div className="grid-scroll" ref={scrollRef} style={{ height: props.height ?? 420 }}>
          <div className="grid-canvas" style={{ width: totalW, height: totalH }}>
            <div className="g-corner" style={{ width: HEAD_W, height: ROW_H }} />
            {widths.map((w, c) => (
              <div
                key={c}
                className={`g-colhead ${c >= sel.start.col && c <= sel.end.col ? 'hl' : ''}`}
                style={{ left: lefts[c], width: w, height: ROW_H }}
              >
                {colName(c)}
                {props.headerExtra?.(c)}
              </div>
            ))}
            {visibleRows.map((r) => (
              <div key={r} className="g-row" style={{ top: tops.get(r), height: ROW_H }}>
                <div className={`g-rowhead ${r >= sel.start.row && r <= sel.end.row ? 'hl' : ''}`} style={{ width: HEAD_W }}>
                  {r + 1}
                </div>
                {widths.map((w, c) => {
                  const info = infos[r][c];
                  const isNum = typeof info.value === 'number';
                  const a = addr(r, c);
                  return (
                    <div
                      key={c}
                      data-cell={`${r},${c}`}
                      data-addr={a}
                      className={`g-cell ${isNum ? 'num' : ''} ${info.error ? 'err' : ''} ${targetSet.has(a) ? 'target' : ''}`}
                      style={{ left: lefts[c], width: w, ...cellStyle?.(r, c, info) }}
                      title={info.error ? `${info.error.text} : ${info.error.explanation}` : undefined}
                    >
                      {info.display}
                    </div>
                  );
                })}
              </div>
            ))}
            {editRefs.map((s, i) => {
              const rc = rectOf({ start: { row: s.from.row, col: s.from.col }, end: { row: s.to.row, col: s.to.col } });
              const color = REF_COLORS[i % REF_COLORS.length];
              return rc ? <div key={i} className="ref-hl" style={{ ...rc, borderColor: color, background: color + '14' }} /> : null;
            })}
            {selRect && multi && <div className="sel-rect" style={selRect} />}
            {activeRect && <div className="active-rect" style={activeRect} />}
            {fillTo && selRect && (() => {
              const fr = rectOf({ start: sel.start, end: { row: Math.max(fillTo.row, sel.end.row), col: Math.max(fillTo.col, sel.end.col) } });
              return fr ? <div className="fill-preview" style={fr} /> : null;
            })()}
            {!edit && !readOnly && selRect && (
              <div
                className="fill-handle"
                data-testid="fill-handle"
                title="Poignée de recopie : fais glisser (ou double-clique) pour recopier"
                style={{ left: selRect.left + selRect.width - 4, top: selRect.top + selRect.height - 4 }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  drag.current = 'fill';
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  fillToDataEnd();
                }}
              />
            )}
            {!edit && activeInfo?.error && activeRect && (
              <div className="err-bubble" data-testid="error-bubble" style={{ left: activeRect.left, top: activeRect.top + activeRect.height + 4 }}>
                <strong>{activeInfo.error.text}</strong> {activeInfo.error.explanation}
              </div>
            )}
            {edit && edit.where === 'cell' && activeRect && (
              <FormulaInput
                ref={cellInput}
                testId="cell-editor"
                ariaLabel="Saisie dans la cellule"
                className="cell-editor"
                style={{ left: activeRect.left, top: activeRect.top, minWidth: activeRect.width, width: Math.max(activeRect.width, edit.text.length * 8.2 + 16) }}
                value={edit.text}
                lang={lang}
                onChange={(text, caret) => setEdit({ ...edit, text, caret, point: undefined })}
                onCaret={(caret) => caret !== edit.caret && setEdit({ ...edit, caret, point: undefined })}
                onKeyDown={onEditKey}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
