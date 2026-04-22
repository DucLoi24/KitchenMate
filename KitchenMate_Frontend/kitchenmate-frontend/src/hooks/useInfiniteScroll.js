import { useEffect, useRef } from 'react';

export function useInfiniteScroll(callback, options = {}) {
  const { threshold = 200, enabled = true } = options;
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          callback();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, threshold, enabled]);

  return sentinelRef;
}