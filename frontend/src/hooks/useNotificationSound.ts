import { useCallback, useRef } from 'react';

/**
 * Custom hook that generates a notification ring tone using the Web Audio API.
 * No external audio files needed — works offline and is 100% reliable.
 */
export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);

  const getContext = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  /**
   * Plays a single "ding-dong" bell tone
   */
  const playBellOnce = useCallback(() => {
    try {
      const ctx = getContext();
      const now = ctx.currentTime;

      // First tone (higher pitch - "ding")
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(830, now);
      osc1.frequency.exponentialRampToValueAtTime(780, now + 0.3);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Second tone (lower pitch - "dong")
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(660, now + 0.2);
      osc2.frequency.exponentialRampToValueAtTime(620, now + 0.6);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.8);

      // Third harmonic overlay for richer sound
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1245, now);
      gain3.gain.setValueAtTime(0.08, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now);
      osc3.stop(now + 0.3);
    } catch (e) {
      console.warn('Notification sound failed:', e);
    }
  }, []);

  /**
   * Starts a repeating ring — plays the bell every `intervalMs` milliseconds
   * until `stopRing()` is called.
   */
  const startRing = useCallback((intervalMs = 3000) => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;

    // Play immediately
    playBellOnce();

    // Then repeat
    intervalRef.current = setInterval(() => {
      playBellOnce();
    }, intervalMs);
  }, [playBellOnce]);

  /**
   * Stops the repeating ring.
   */
  const stopRing = useCallback(() => {
    isPlayingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { playBellOnce, startRing, stopRing };
}
