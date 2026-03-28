import { useEffect, useState } from 'react';

/**
 * Handles hydration mismatch by deferring rendering until after mount.
 * This hook is useful when SSR and client rendering produce different content.
 *
 * @returns Whether the component has been mounted on the client side
 */
export function useHydrationSafe(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
