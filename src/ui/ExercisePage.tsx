import { MODULES, findExercise } from '../exercises';
import { useStore } from '../state/store';
import { ExercisePlayer } from './ExercisePlayer';
import { richText } from './Rich';
import { href } from './router';

export function ExercisePage({ id }: { id: string }) {
  const lang = useStore().progress.lang;
  const ex = findExercise(id);
  if (!ex) return <p>Exercice introuvable.</p>;
  const m = MODULES.find((x) => x.id === ex.module)!;
  const k = m.exercises.indexOf(ex);
  const prev = m.exercises[k - 1];
  const next = m.exercises[k + 1];
  return (
    <div>
      <a className="back" href={href({ page: 'module', id: m.id, tab: 'exercices' })}>
        ← Module {m.id} · {richText(m.title, lang)}
      </a>
      <h1>
        Exercice {k + 1}/{m.exercises.length} · {richText(ex.title, lang)}
      </h1>
      <ExercisePlayer ex={ex} />
      <div className="row-between nav-ex">
        {prev ? <a className="btn ghost" href={href({ page: 'ex', id: prev.id })}>← Précédent</a> : <span />}
        {next ? (
          <a className="btn" data-testid="next-ex" href={href({ page: 'ex', id: next.id })}>
            Exercice suivant →
          </a>
        ) : (
          <a className="btn" href={href({ page: 'parcours' })}>
            Retour au parcours
          </a>
        )}
      </div>
    </div>
  );
}
