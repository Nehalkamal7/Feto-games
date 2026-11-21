'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { socketPhaseTimeout } from '@/lib/socket';

export interface UseGameTimerOptions {
  phaseEndsAt?: number | null;
  durationSeconds?: number;
  phase?: string;
  round?: number;
  onTimeout?: () => void | Promise<void>;
  autoTriggerTimeout?: boolean;
  roomCode?: string;
  enabled?: boolean;
}

export interface UseGameTimerReturn {
  remainingSeconds: number;
  formatted: string;
  isUrgent: boolean;
  isExpired: boolean;
  progressPercent: number;
}

/**
 * High-precision, server-synchronized countdown timer hook.
 * Calculates remaining seconds live from `phaseEndsAt - Date.now()`.
 * The exact moment remaining time reaches <= 0, automatically triggers
 * the onTimeout callback or dispatches PHASE_TIMEOUT guarded by the server atomic lock.
 */
export function useGameTimer({
  phaseEndsAt,
  durationSeconds = 30,
  onTimeout,
  autoTriggerTimeout = true,
  roomCode,
  enabled = true
}: UseGameTimerOptions): UseGameTimerReturn {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (!phaseEndsAt || !enabled) return 0;
    return Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000));
  });

  const lastTriggeredPhaseRef = useRef<number | null>(null);

  const triggerTimeout = useCallback(async () => {
    if (!phaseEndsAt) return;
    if (lastTriggeredPhaseRef.current === phaseEndsAt) return;
    lastTriggeredPhaseRef.current = phaseEndsAt;

    try {
      if (onTimeout) {
        await onTimeout();
      } else if (autoTriggerTimeout) {
        await socketPhaseTimeout(roomCode);
      }
    } catch (err) {
      console.warn('⚠️ [useGameTimer] Timeout trigger handled:', err);
    }
  }, [phaseEndsAt, onTimeout, autoTriggerTimeout, roomCode]);

  useEffect(() => {
    if (!enabled || !phaseEndsAt || phaseEndsAt <= 0) {
      setRemainingSeconds(0);
      return;
    }

    // Reset triggered marker when phaseEndsAt changes to a future timestamp
    if (lastTriggeredPhaseRef.current !== phaseEndsAt && phaseEndsAt > Date.now()) {
      lastTriggeredPhaseRef.current = null;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = phaseEndsAt - now;
      const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));

      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        triggerTimeout();
      }
    };

    // Run immediate check
    updateTimer();

    // High frequency 200ms tick for responsive countdown without UI stutter
    const interval = setInterval(updateTimer, 200);

    return () => clearInterval(interval);
  }, [phaseEndsAt, enabled, triggerTimeout]);

  // Format as MM:SS (e.g., 00:15)
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 5;
  const isExpired = remainingSeconds <= 0;

  const totalDuration = durationSeconds > 0 ? durationSeconds : 30;
  const progressPercent = Math.min(100, Math.max(0, (remainingSeconds / totalDuration) * 100));

  return {
    remainingSeconds,
    formatted,
    isUrgent,
    isExpired,
    progressPercent
  };
}
