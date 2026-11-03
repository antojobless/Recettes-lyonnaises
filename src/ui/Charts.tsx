const COLORS = ['#107c41', '#1f6fd1', '#d13a1f', '#b26a00', '#7b3fbf', '#00838f', '#c2185b', '#5d6670'];

interface Props {
  labels: string[];
  values: number[];
  title?: string;
  /** Valeur basse de l'axe (pour montrer le piège de l'axe tronqué) */
  min?: number;
  horizontal?: boolean;
}

const W = 420;
const H = 220;
const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { notation: n >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);

export function BarChart({ labels, values, title, min = 0, horizontal }: Props) {
  const max = Math.max(...values);
  const pad = { l: horizontal ? 110 : 44, r: 10, t: title ? 26 : 10, b: horizontal ? 10 : 40 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const scale = (v: number) => ((v - min) / (max - min || 1)) * (horizontal ? iw : ih);
  const n = values.length;
  const band = (horizontal ? ih : iw) / n;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={title ?? 'Graphique en barres'}>
      {title && (
        <text x={W / 2} y={16} textAnchor="middle" className="chart-title">
          {title}
        </text>
      )}
      {!horizontal && (
        <>
          <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="#c9ced3" />
          <text x={pad.l - 6} y={pad.t + 4} textAnchor="end" className="chart-axis">
            {fmt(max)}
          </text>
          <text x={pad.l - 6} y={pad.t + ih} textAnchor="end" className="chart-axis">
            {fmt(min)}
          </text>
        </>
      )}
      {values.map((v, i) =>
        horizontal ? (
          <g key={i}>
            <rect x={pad.l} y={pad.t + i * band + band * 0.15} width={Math.max(scale(v), 1)} height={band * 0.7} fill={COLORS[0]} rx={2} />
            <text x={pad.l - 6} y={pad.t + i * band + band / 2 + 4} textAnchor="end" className="chart-axis">
              {labels[i]}
            </text>
          </g>
        ) : (
          <g key={i}>
            <rect x={pad.l + i * band + band * 0.15} y={pad.t + ih - scale(v)} width={band * 0.7} height={Math.max(scale(v), 1)} fill={COLORS[0]} rx={2} />
            <text x={pad.l + i * band + band / 2} y={H - pad.b + 14} textAnchor="middle" className="chart-axis">
              {labels[i].length > 9 ? labels[i].slice(0, 8) + '…' : labels[i]}
            </text>
          </g>
        ),
      )}
    </svg>
  );
}

export function LineChart({ labels, values, title }: Props) {
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const pad = { l: 44, r: 12, t: title ? 26 : 10, b: 36 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (i / Math.max(values.length - 1, 1)) * iw;
  const y = (v: number) => pad.t + ih - ((v - min) / (max - min || 1)) * ih;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={title ?? 'Courbe'}>
      {title && (
        <text x={W / 2} y={16} textAnchor="middle" className="chart-title">
          {title}
        </text>
      )}
      <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="#c9ced3" />
      <polyline fill="none" stroke={COLORS[1]} strokeWidth={2.5} points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={COLORS[1]} />
      ))}
      {labels.map((l, i) =>
        i % Math.ceil(labels.length / 8) === 0 ? (
          <text key={i} x={x(i)} y={H - pad.b + 16} textAnchor="middle" className="chart-axis">
            {l}
          </text>
        ) : null,
      )}
      <text x={pad.l - 6} y={pad.t + 4} textAnchor="end" className="chart-axis">
        {fmt(max)}
      </text>
    </svg>
  );
}

export function PieChart({ labels, values, title }: Props) {
  const total = values.reduce((s, v) => s + v, 0);
  const cx = 110;
  const cy = (title ? 26 : 10) + 92;
  const r = 88;
  let a0 = -Math.PI / 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label={title ?? 'Secteurs'}>
      {title && (
        <text x={W / 2} y={16} textAnchor="middle" className="chart-title">
          {title}
        </text>
      )}
      {values.map((v, i) => {
        const a1 = a0 + (v / total) * Math.PI * 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const d = `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`;
        a0 = a1;
        return <path key={i} d={d} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={1} />;
      })}
      {labels.slice(0, 9).map((l, i) => (
        <g key={i}>
          <rect x={230} y={(title ? 30 : 14) + i * 19} width={11} height={11} fill={COLORS[i % COLORS.length]} />
          <text x={246} y={(title ? 40 : 24) + i * 19} className="chart-axis" textAnchor="start">
            {l} ({Math.round((values[i] / total) * 100)} %)
          </text>
        </g>
      ))}
      {labels.length > 9 && (
        <text x={246} y={(title ? 40 : 24) + 9 * 19} className="chart-axis">
          … et {labels.length - 9} autres
        </text>
      )}
    </svg>
  );
}
