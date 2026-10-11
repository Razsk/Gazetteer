import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from './useIsMobile';

describe('useIsMobile', () => {
  let listeners: ((e: any) => void)[] = [];
  let matches = false;

  beforeEach(() => {
    listeners = [];
    matches = false;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn((fn) => listeners.push(fn)),
      removeListener: vi.fn((fn) => {
        listeners = listeners.filter((l) => l !== fn);
      }),
      addEventListener: vi.fn((_, fn) => listeners.push(fn)),
      removeEventListener: vi.fn((_, fn) => {
        listeners = listeners.filter((l) => l !== fn);
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when viewport is desktop size', () => {
    matches = false;
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);
  });

  it('returns true when viewport matches mobile query', () => {
    matches = true;
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(true);
  });

  it('updates dynamically when media query changes', () => {
    matches = false;
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach((l) => l({ matches: true }));
    });

    expect(result.current).toBe(true);
  });
});
