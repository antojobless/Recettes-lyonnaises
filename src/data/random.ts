/** Générateur pseudo-aléatoire à graine fixe (mulberry32) : mêmes données à chaque fois. */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    /** Tirage pondéré */
    weighted: <T,>(arr: readonly T[], weights: readonly number[]): T => {
      const total = weights.reduce((s, w) => s + w, 0);
      let x = next() * total;
      for (let i = 0; i < arr.length; i++) {
        x -= weights[i];
        if (x < 0) return arr[i];
      }
      return arr[arr.length - 1];
    },
  };
}

export const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** Date au format jj/mm/aaaa (comme on la tape dans Excel en français). */
export function dmy(y: number, m: number, d: number): string {
  return `${pad(d)}/${pad(m)}/${y}`;
}

export function randomDate(r: ReturnType<typeof rng>, y0: number, y1: number): string {
  const y = r.int(y0, y1);
  const m = r.int(1, 12);
  const d = r.int(1, 28);
  return dmy(y, m, d);
}
