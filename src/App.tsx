import { useMemo, useState } from 'react';
import { SheetModel } from './engine/engine';
import { Lang } from './engine/lang';
import { Grid } from './grid/Grid';

export function App() {
  const [lang] = useState<Lang>('fr');
  const model = useMemo(() => new SheetModel(lang, { A1: 'Prix HT', A2: 100, A3: 250, A4: 80, A5: 40, B1: 'TVA', D1: 'Taux', E1: '20%' }), [lang]);
  return (
    <div className="app">
      <header className="topbar">
        <strong>Excel Coach</strong>
      </header>
      <main className="page">
        <h1>Bac à sable</h1>
        <p>Tape <code>=</code> puis clique sur une cellule pour insérer sa référence.</p>
        <Grid model={model} rows={30} cols={10} />
      </main>
    </div>
  );
}
