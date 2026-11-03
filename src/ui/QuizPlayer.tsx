import { useState } from 'react';
import { QuizExercise } from '../exercises/types';
import { BarChart, LineChart, PieChart } from './Charts';
import { HintsBox, PlayerProps, ResultBox, useExerciseState } from './ExercisePlayer';
import { ExcelTaskPanel } from './PivotPlayer';
import { Rich } from './Rich';

export function checkQuiz(ex: QuizExercise, choice: number | null) {
  if (choice === null) return { ok: false, messages: ['Choisis une réponse.'], cells: {} };
  if (choice === ex.answer) return { ok: true, messages: [], cells: {} };
  return { ok: false, messages: [ex.why[choice] || 'Ce n’est pas la bonne réponse.'], cells: {} };
}

export function Illustration({ ill }: { ill: NonNullable<QuizExercise['illustration']> }) {
  const p = { labels: ill.labels, values: ill.values, title: ill.title, min: ill.min };
  if (ill.type === 'line') return <LineChart {...p} />;
  if (ill.type === 'pie') return <PieChart {...p} />;
  return <BarChart {...p} horizontal={ill.type === 'hbars'} />;
}

export function QuizPlayer(props: PlayerProps) {
  const ex = props.ex as QuizExercise;
  const { allowHints = true } = props;
  const st = useExerciseState(ex, props);
  const { lang } = st;
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <div className="exercise" data-testid={`exercise-${ex.id}`}>
      <div className="instruction">
        <Rich text={ex.instruction} lang={lang} />
      </div>
      {ex.illustration && (
        <div className="chart-box">
          <Illustration ill={ex.illustration} />
        </div>
      )}
      <div className="choices">
        {ex.choices.map((c, i) => (
          <label key={i} className={`choice ${choice === i ? 'on' : ''}`}>
            <input type="radio" name={ex.id} checked={choice === i} onChange={() => setChoice(i)} data-testid={`choice-${i}`} /> <Rich text={c} lang={lang} />
          </label>
        ))}
      </div>
      <div className="ex-actions">
        <button className="btn primary" data-testid="check-btn" onClick={() => st.submit(checkQuiz(ex, choice))}>
          Vérifier
        </button>
      </div>
      <ResultBox result={st.result} lang={lang} after={st.result?.ok ? ex.why[ex.answer] : undefined} />
      {ex.excel && <ExcelTaskPanel task={ex.excel} lang={lang} />}
      {allowHints && !st.solved && <HintsBox ex={ex} hints={st.hints} setHints={st.setHints} lang={lang} />}
    </div>
  );
}
