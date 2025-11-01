import { useEffect } from 'react';

/**
 * Body scroll lock hook
 * Prevents background scrolling when drawer/modal is open
 * Preserves scroll position on unlock
 * Compensates for scrollbar width to prevent layout shift
 *
 * @param isLocked - Whether to lock body scroll
 *
 * @example
 * useBodyScrollLock(isMobileMenuOpen);
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // Store original overflow values
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width (prevents layout shift)
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    // Restore on cleanup
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
}
