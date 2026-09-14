import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { ProgressProvider, useProgress } from './ProgressContext';
import { storageKey } from '../../lib/storage';

const VISITED_KEY = storageKey('visited');

function wrapper({ children }: { children: ReactNode }) {
  return <ProgressProvider>{children}</ProgressProvider>;
}

describe('ProgressContext', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts with no visited landmarks', () => {
    const { result } = renderHook(() => useProgress(), { wrapper });
    expect(result.current.visited.size).toBe(0);
  });

  it('marks a landmark visited and persists it', () => {
    const { result } = renderHook(() => useProgress(), { wrapper });

    act(() => result.current.markVisited('kiosk'));

    expect(result.current.visited.has('kiosk')).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(VISITED_KEY) ?? '[]')).toContain('kiosk');
  });

  it('recovers gracefully from corrupted localStorage data', () => {
    window.localStorage.setItem(VISITED_KEY, '{not json');
    const { result } = renderHook(() => useProgress(), { wrapper });
    expect(result.current.visited.size).toBe(0);
  });
});
