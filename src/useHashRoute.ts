import { useCallback, useSyncExternalStore } from 'react';

interface HashRoute {
  module: string;
  tab?: string;
}

let cachedHash: string | undefined;
let cachedRoute: HashRoute = { module: 'home', tab: undefined };

function parseHash(): HashRoute {
  const hash = window.location.hash;
  if (hash !== cachedHash) {
    const raw = hash.replace(/^#\/?/, '');
    const [module, tab] = raw.split('/').filter(Boolean);
    cachedHash = hash;
    cachedRoute = { module: module || 'home', tab };
  }
  return cachedRoute;
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function useHashRoute() {
  const route = useSyncExternalStore(subscribe, parseHash, parseHash);

  const navigate = useCallback((module: string, tab?: string) => {
    window.location.hash = tab ? `/${module}/${tab}` : `/${module}`;
  }, []);

  return { ...route, navigate };
}
