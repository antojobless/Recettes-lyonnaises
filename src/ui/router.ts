import { useEffect, useState } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'parcours' }
  | { page: 'module'; id: number; tab: 'lecon' | 'exemple' | 'exercices' }
  | { page: 'ex'; id: string }
  | { page: 'seance' }
  | { page: 'test' }
  | { page: 'antiseche' }
  | { page: 'sandbox' }
  | { page: 'reglages' };

export function parseHash(h: string): Route {
  const parts = h.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'parcours':
      return { page: 'parcours' };
    case 'module':
      return { page: 'module', id: Number(parts[1] ?? 0), tab: (parts[2] as 'lecon') ?? 'lecon' };
    case 'ex':
      return { page: 'ex', id: parts[1] ?? '' };
    case 'seance':
    case 'test':
    case 'antiseche':
    case 'sandbox':
    case 'reglages':
      return { page: parts[0] };
    default:
      return { page: 'home' };
  }
}

export function href(r: Route): string {
  switch (r.page) {
    case 'home':
      return '#/';
    case 'module':
      return `#/module/${r.id}/${r.tab}`;
    case 'ex':
      return `#/ex/${r.id}`;
    default:
      return `#/${r.page}`;
  }
}

export function go(r: Route) {
  window.location.hash = href(r);
}

export function useRoute(): Route {
  const [r, setR] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const f = () => {
      setR(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return r;
}
