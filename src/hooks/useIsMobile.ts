'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect whether current viewport is smaller than mobile breakpoint (default: 768px).
 * Safely handles SSR and dynamically responds to viewport resize.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    update(mql);

    if (mql.addEventListener) {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    } else {
      // Fallback for older environments
      mql.addListener(update);
      return () => mql.removeListener(update);
    }
  }, [breakpoint]);

  return isMobile;
}
