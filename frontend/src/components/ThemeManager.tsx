import { useEffect, type ReactNode } from 'react'; // 👈 ReactNode import karein
import { useLocation } from 'react-router-dom';

const SELF_THEMED_PATHS = ['/'];

export const isDarkSaved = (): boolean => {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

// 👈 Yahan { children }: { children: ReactNode } add karein
export const ThemeManager = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    const apply = () => {
      const root = document.documentElement;
      const dark = isDarkSaved();

      if (SELF_THEMED_PATHS.includes(pathname)) {
        root.removeAttribute('data-app-dark');
        root.classList.toggle('dark', dark);
      } else {
        root.classList.remove('dark');
        if (dark) root.setAttribute('data-app-dark', 'true');
        else root.removeAttribute('data-app-dark');
      }
    };

    apply();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') apply();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [pathname]);

  // 👈 null ki jagah children return karein taaki Routes render ho sakein
  return <>{children}</>; 
};