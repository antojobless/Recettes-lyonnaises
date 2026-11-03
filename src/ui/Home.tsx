import { useStore } from '../state/store';
import { nextModule } from '../state/stats';
import { richText } from './Rich';
import { href } from './router';

export function Home() {
  const { progress } = useStore();
  const m = nextModule(progress);
  return (
    <div>
      <h1>Bonjour 👋</h1>
      <div className="card">
        <h2>Prochain module</h2>
        <p>
          Module {m.id} · {richText(m.title, progress.lang)}
        </p>
        <a className="btn primary" href={href({ page: 'module', id: m.id, tab: 'lecon' })}>
          Continuer
        </a>
      </div>
    </div>
  );
}
