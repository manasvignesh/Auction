import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for game audio cues.
 * Pre-loads audio files and exposes play methods.
 * Handles browser autoplay policy by unlocking on first user interaction.
 */
export function useAudio() {
  const tickRef = useRef<HTMLAudioElement | null>(null);
  const bidRef = useRef<HTMLAudioElement | null>(null);
  const gavelRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    tickRef.current = new Audio('/tick.mp3');
    bidRef.current = new Audio('/bid.mp3');
    gavelRef.current = new Audio('/gavel.mp3');

    // Add error logging
    [tickRef, bidRef, gavelRef].forEach(ref => {
      if (ref.current) {
        ref.current.addEventListener('error', (e) => {
          console.error(`Audio error on ${ref.current?.src}:`, e);
        });
      }
    });

    // Pre-set volumes
    tickRef.current.volume = 0.4;
    bidRef.current.volume = 0.6;
    gavelRef.current.volume = 0.8;

    // Unlock audio context on first user interaction
    const unlock = () => {
      if (unlockedRef.current) return;
      unlockedRef.current = true;
      // Play and immediately pause each audio to unlock them
      [tickRef, bidRef, gavelRef].forEach(ref => {
        if (ref.current) {
          ref.current.play().then(() => {
            ref.current!.pause();
            ref.current!.currentTime = 0;
          }).catch(() => {});
        }
      });
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };

    document.addEventListener('click', unlock, { once: false });
    document.addEventListener('keydown', unlock, { once: false });

    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
  }, []);

  const play = useCallback((ref: React.RefObject<HTMLAudioElement | null>) => {
    if (ref.current) {
      ref.current.currentTime = 0;
      ref.current.play().catch(() => {});
    }
  }, []);

  const playTick = useCallback(() => play(tickRef), [play]);
  const playBid = useCallback(() => play(bidRef), [play]);
  const playGavel = useCallback(() => play(gavelRef), [play]);

  return { playTick, playBid, playGavel };
}
