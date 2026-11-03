import { useMemo, useState } from 'react';
import { SheetModel } from './engine/engine';
import { Lang } from './engine/lang';
import { Grid } from './grid/Grid';

export function App() {
  const [lang] = useState<Lang>('fr');
  const model = useMemo(() => new SheetModel(lang, { A1: 5, A2: 7, A3: 12, B1: '=SOMME(A1:A3)', B2: '=SI(A1>10;"oui";"non")' }), [lang]);
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
