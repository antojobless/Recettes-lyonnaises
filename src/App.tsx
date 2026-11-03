import { useEffect, useMemo, useState } from 'react';
import { SheetModel } from './engine/engine';
import { Grid } from './grid/Grid';
import { ProgressProvider, useStore } from './state/store';
import { ExercisePage } from './ui/ExercisePage';
import { XlsxButton } from './ui/ExercisePlayer';
import { ModulePage, Parcours } from './ui/ModulePage';
import { href, Route, useRoute } from './ui/router';
import { Home } from './ui/Home';
import { DailyPage } from './ui/DailyPage';
import { ExamPage } from './ui/ExamPage';
import { Cheatsheet } from './ui/Cheatsheet';
import { LangToggle, Settings } from './ui/Settings';

function Sandbox() {
  const lang = useStore().progress.lang;
  const model = useMemo(() => new SheetModel(lang, { A1: 'Prix HT', A2: 100, A3: 250, A4: 80, A5: 40, B1: 'TVA', D1: 'Taux', E1: '20%' }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [, setTick] = useState(0);
  useEffect(() => {
    model.setLang(lang);
    setTick((t) => t + 1);
  }, [model, lang]);
  return (
    <div>
      <h1>Bac à sable</h1>
      <p>Une feuille libre pour essayer ce que tu veux. Tape <code>=</code> puis clique sur une cellule pour insérer sa référence.</p>
      <Grid model={model} rows={60} cols={14} height={520} />
      <div className="ex-actions">
        <XlsxButton model={model} name="bac-a-sable.xlsx" />
      </div>
    </div>
  );
}

const NAV: [Route['page'], string][] = [
  ['home', 'Accueil'],
  ['parcours', 'Parcours'],
  ['seance', 'Séance du jour'],
  ['test', 'Test d’entreprise'],
  ['antiseche', 'Antisèche'],
  ['sandbox', 'Bac à sable'],
  ['reglages', 'Réglages'],
];

function Shell() {
  const route = useRoute();
  const { saveOk } = useStore();
  let page;
  switch (route.page) {
    case 'parcours':
      page = <Parcours />;
      break;
    case 'module':
      page = <ModulePage id={route.id} tab={route.tab} />;
      break;
    case 'ex':
      page = <ExercisePage id={route.id} />;
      break;
    case 'sandbox':
      page = <Sandbox />;
      break;
    case 'seance':
      page = <DailyPage />;
      break;
    case 'test':
      page = <ExamPage />;
      break;
    case 'antiseche':
      page = <Cheatsheet />;
      break;
    case 'reglages':
      page = <Settings />;
      break;
    default:
      page = <Home />;
  }
  const active = route.page === 'module' || route.page === 'ex' ? 'parcours' : route.page;
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="logo">X</span> Excel Coach
        </a>
        <nav className="mainnav">
          {NAV.map(([p, label]) => (
            <a key={p} href={href({ page: p } as Route)} className={active === p ? 'on' : ''} data-testid={`nav-${p}`}>
              {label}
            </a>
          ))}
        </nav>
        <div className="topbar-right">
          <LangToggle />
        </div>
      </header>
      {!saveOk && <div className="warn-box center">Ton navigateur bloque l’enregistrement : ta progression sera perdue en fermant la page. Pense à l’exporter (Réglages).</div>}
      <main className="page">{page}</main>
    </div>
  );
}

export function App() {
  return (
    <ProgressProvider>
      <Shell />
    </ProgressProvider>
  );
}
