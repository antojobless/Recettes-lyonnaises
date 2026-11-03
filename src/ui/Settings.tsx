import { useRef, useState } from 'react';
import { emptyProgress, sanitize, today } from '../state/progress';
import { useStore } from '../state/store';
import { LanguageSetup } from './Home';

export function LangToggle() {
  const { progress, update } = useStore();
  return (
    <div className="lang-toggle" role="group" aria-label="Langue des formules">
      {(['fr', 'en'] as const).map((l) => (
        <button key={l} className={progress.lang === l ? 'on' : ''} data-testid={`toggle-${l}`} onClick={() => update((p) => ({ ...p, lang: l, langChosen: true }))} title={l === 'fr' ? 'Formules en français (SOMME, séparateur ;)' : 'Formules en anglais (SUM, séparateur ,)'}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Settings() {
  const { progress, replace, saveOk } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `excel-coach-progression-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const importJson = async (f: File) => {
    try {
      const p = sanitize(JSON.parse(await f.text()));
      if (!window.confirm('Remplacer ta progression actuelle par celle du fichier ?')) return;
      replace(p);
      const n = Object.values(p.ex).filter((e) => e.solved).length;
      setMsg({ ok: true, text: `Progression importée : ${n} exercice${n > 1 ? 's' : ''} réussi${n > 1 ? 's' : ''}, ${p.tests.length} test(s).` });
    } catch (e) {
      setMsg({ ok: false, text: `Import impossible : ${(e as Error).message}` });
    }
  };

  const solved = Object.values(progress.ex).filter((e) => e.solved).length;
  return (
    <div>
      <h1>Réglages</h1>
      <LanguageSetup compact />
      <div className="card">
        <h2>Ma progression</h2>
        <p>
          {solved} exercice{solved > 1 ? 's' : ''} réussi{solved > 1 ? 's' : ''}, {progress.tests.length} test{progress.tests.length > 1 ? 's' : ''} d’entreprise, {progress.days.length} jour{progress.days.length > 1 ? 's' : ''} d’entraînement.
        </p>
        <p className="muted small">
          Elle est enregistrée dans ce navigateur{saveOk ? '' : ' (enregistrement impossible ici : exporte-la avant de fermer)'}. Pour passer de la version en ligne à la version fichier (ou à un autre ordinateur), exporte-la puis importe-la de l’autre côté.
        </p>
        <div className="ex-actions">
          <button className="btn primary" data-testid="export-progress" onClick={exportJson}>
            ⬇ Exporter ma progression (.json)
          </button>
          <button className="btn" data-testid="import-progress" onClick={() => file.current?.click()}>
            ⬆ Importer une progression
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            data-testid="import-file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = '';
            }}
          />
          <button
            className="btn ghost"
            onClick={() => {
              if (window.confirm('Effacer toute ta progression ? (pense à l’exporter avant)')) {
                replace(emptyProgress());
                setMsg({ ok: true, text: 'Progression remise à zéro.' });
              }
            }}
          >
            Tout effacer
          </button>
        </div>
        {msg && (
          <div className={`result ${msg.ok ? 'ok' : 'ko'}`} data-testid="import-msg">
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
