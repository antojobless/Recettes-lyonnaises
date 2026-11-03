import { MODULES } from '../exercises';
import { SUBJECTS } from '../exams/subjects';
import { sessionMinutes } from '../session/daily';
import { notionLabel } from '../state/notions';
import { streak } from '../state/progress';
import { bestTest, mastery, moduleRate, nextModule } from '../state/stats';
import { useStore } from '../state/store';
import { useTodaySession } from './DailyPage';
import { richText } from './Rich';
import { href } from './router';

export function LanguageSetup({ compact }: { compact?: boolean }) {
  const { progress, update } = useStore();
  const choose = (lang: 'fr' | 'en') => update((p) => ({ ...p, lang, langChosen: true }));
  return (
    <div className="card onboarding" data-testid="onboarding">
      {!compact && <h2>Avant de commencer : ton Excel est-il en français ?</h2>}
      <p>
        Les noms des fonctions changent selon la langue d’Excel : <code>SOMME</code> en français, <code>SUM</code> en anglais. Pour savoir :
      </p>
      <ol>
        <li>Ouvre Excel sur ton Mac et un classeur vide.</li>
        <li>
          Clique dans une cellule et tape <code>=SOM</code> (sans valider).
        </li>
        <li>
          Si Excel te propose <strong>SOMME</strong>, ton Excel est en <strong>français</strong> (on sépare les arguments par <code>;</code>). S’il ne propose rien, efface et tape <code>=SU</code> : s’il propose <strong>SUM</strong>, il est en <strong>anglais</strong> (séparateur <code>,</code>).
        </li>
      </ol>
      <div className="ex-actions">
        <button className={`btn ${progress.lang === 'fr' && progress.langChosen ? 'primary' : ''}`} data-testid="lang-fr" onClick={() => choose('fr')}>
          🇫🇷 Mon Excel est en français
        </button>
        <button className={`btn ${progress.lang === 'en' && progress.langChosen ? 'primary' : ''}`} data-testid="lang-en" onClick={() => choose('en')}>
          🇬🇧 Mon Excel est en anglais
        </button>
      </div>
      <p className="muted small">Tu pourras changer à tout moment avec le bouton FR / EN en haut. Le nom de la fonction dans l’autre langue est toujours affiché à côté.</p>
    </div>
  );
}

export function Home() {
  const { progress } = useStore();
  const lang = progress.lang;
  const m = nextModule(progress);
  const session = useTodaySession();
  const best = bestTest(progress);
  const notions = [...new Set(MODULES.flatMap((x) => x.functions))];
  const days = streak(progress);
  const sessionDone = session ? Object.keys(session.done).length : 0;

  if (!progress.langChosen)
    return (
      <div>
        <h1>Bienvenue dans Excel Coach 👋</h1>
        <p>De zéro jusqu’au niveau d’un test Excel d’entreprise, 30 à 45 minutes par jour.</p>
        <LanguageSetup />
      </div>
    );

  return (
    <div data-testid="dashboard">
      <h1>Tableau de bord</h1>
      <div className="dash">
        <div className="card dash-main">
          <h2>Séance du jour</h2>
          {session ? (
            <p>
              {session.items.length} exercices + un mini-test · environ <strong>{sessionMinutes(session)} min</strong>
              {sessionDone > 0 && ` · ${sessionDone}/${session.items.length} faits`}
              {session.testResult && ` · terminée ✓`}
            </p>
          ) : (
            <p>Préparation…</p>
          )}
          <a className="btn primary" href={href({ page: 'seance' })} data-testid="dash-start">
            {session?.testResult ? 'Voir la séance' : sessionDone ? 'Continuer' : 'Commencer'}
          </a>
        </div>
        <div className="card">
          <h2>Prochain module</h2>
          <p>
            <strong>Module {m.id}</strong> · {richText(m.title, lang)}
          </p>
          <div className="bar">
            <div style={{ width: `${moduleRate(progress, m) * 100}%` }} />
          </div>
          <p className="muted small">{Math.round(moduleRate(progress, m) * 100)} % réussi · le suivant s’ouvre à 80 %</p>
          <a className="btn" href={href({ page: 'module', id: m.id, tab: progress.lessons[m.id] ? 'exercices' : 'lecon' })} data-testid="dash-module">
            Continuer le module
          </a>
        </div>
        <div className="card stat">
          <span className="big" data-testid="streak">🔥 {days}</span>
          <span>jour{days > 1 ? 's' : ''} d’entraînement d’affilée</span>
        </div>
        <div className="card stat">
          <span className="big">{best ? `${best.score}/${best.max}` : '—'}</span>
          <span>meilleur score aux tests d’entreprise{best ? ` (${SUBJECTS.find((s) => s.id === best.subject)?.title})` : ''}</span>
          <a href={href({ page: 'test' })}>Passer un test →</a>
        </div>
      </div>
      <div className="card">
        <h2>Maîtrise par fonction</h2>
        <div className="mastery" data-testid="mastery">
          {notions.map((n) => {
            const v = mastery(progress, n);
            return (
              <div key={n} className="mastery-row">
                <span className="mastery-label">{notionLabel(n, lang)}</span>
                <div className="bar">
                  <div style={{ width: `${v * 100}%` }} />
                </div>
                <span className="mastery-pct">{Math.round(v * 100)} %</span>
              </div>
            );
          })}
        </div>
        <p className="muted small">Un exercice réussi sans indice compte 100 %, avec 1 indice 75 %, 2 indices 50 %, la réponse affichée 25 %.</p>
      </div>
    </div>
  );
}
