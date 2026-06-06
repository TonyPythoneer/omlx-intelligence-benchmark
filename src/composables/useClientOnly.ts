/**
 * useClientOnly - Guard composable for browser-only APIs
 * Provides a safe way to check if code is running in a browser context
 * Prevents SSR issues when File System Access, clipboard, or hostname APIs are used
 */

export function useClientOnly() {
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

  return {
    isBrowser,
  };
}
