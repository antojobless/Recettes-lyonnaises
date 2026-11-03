import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { load, Progress, save } from './progress';

interface Store {
  progress: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  replace: (p: Progress) => void;
  saveOk: boolean;
}

const Ctx = createContext<Store | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => load());
  const [saveOk, setSaveOk] = useState(true);
  useEffect(() => {
    setSaveOk(save(progress));
  }, [progress]);
  const update = useCallback((fn: (p: Progress) => Progress) => setProgress((p) => fn(p)), []);
  const replace = useCallback((p: Progress) => setProgress(p), []);
  return <Ctx.Provider value={{ progress, update, replace, saveOk }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('ProgressProvider manquant');
  return s;
}

export const useLang = () => useStore().progress.lang;
