import { Server } from 'socket.io';
import {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from '@feto-games/shared-types';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export class TimerService {
  private static graceTimers = new Map<string, NodeJS.Timeout>(); // key: `${roomCode}:${playerId}`
  private static roomTimers = new Map<string, NodeJS.Timeout>(); // key: `${roomCode}:game`

  /**
   * Starts a 45-second grace period timer for a disconnected player.
   */
  public static startGracePeriod(
    roomCode: string,
    playerId: string,
    durationSeconds: number,
    onExpired: () => Promise<void>
  ): void {
    const key = `${roomCode}:${playerId}`;
    this.clearGracePeriod(roomCode, playerId);

    const timer = setTimeout(async () => {
      this.graceTimers.delete(key);
      console.log(`⏰ [TimerService] Grace period expired for player ${playerId} in room ${roomCode}`);
      await onExpired();
    }, durationSeconds * 1000);

    this.graceTimers.set(key, timer);
  }

  /**
   * Clears the grace period timer if a player reconnects before it expires.
   */
  public static clearGracePeriod(roomCode: string, playerId: string): boolean {
    const key = `${roomCode}:${playerId}`;
    const timer = this.graceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.graceTimers.delete(key);
      console.log(`✅ [TimerService] Cleared grace period for player ${playerId} in room ${roomCode}`);
      return true;
    }
    return false;
  }

  /**
   * Starts a server-authoritative countdown/round timer with 1-second ticks.
   */
  public static startRoundTimer(
    io: TypedServer,
    roomCode: string,
    durationSeconds: number,
    phase: any,
    round: number,
    onComplete: () => Promise<void>
  ): void {
    const key = `${roomCode}:game`;
    this.clearRoomTimer(roomCode);

    let remaining = durationSeconds;

    // Send initial tick
    io.to(roomCode).emit('game:timer-tick', {
      remainingSeconds: remaining,
      totalDurationSeconds: durationSeconds,
      phase,
      round
    });

    const interval = setInterval(async () => {
      remaining -= 1;

      if (remaining > 0) {
        io.to(roomCode).emit('game:timer-tick', {
          remainingSeconds: remaining,
          totalDurationSeconds: durationSeconds,
          phase,
          round
        });
      } else {
        clearInterval(interval);
        this.roomTimers.delete(key);
        io.to(roomCode).emit('game:timer-tick', {
          remainingSeconds: 0,
          totalDurationSeconds: durationSeconds,
          phase,
          round
        });
        await onComplete();
      }
    }, 1000);

    this.roomTimers.set(key, interval as unknown as NodeJS.Timeout);
  }

  /**
   * Clears active game timer for a room.
   */
  public static clearRoomTimer(roomCode: string): void {
    const key = `${roomCode}:game`;
    const timer = this.roomTimers.get(key);
    if (timer) {
      clearInterval(timer as unknown as NodeJS.Timeout);
      this.roomTimers.delete(key);
    }
  }

  /**
   * Clean up all timers associated with a room.
   */
  public static clearAllForRoom(roomCode: string): void {
    this.clearRoomTimer(roomCode);
    for (const [key, timer] of this.graceTimers.entries()) {
      if (key.startsWith(`${roomCode}:`)) {
        clearTimeout(timer);
        this.graceTimers.delete(key);
      }
    }
  }
}
