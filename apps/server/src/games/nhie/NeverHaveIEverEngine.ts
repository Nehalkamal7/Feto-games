import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GameMode,
  NeverHaveIEverItem,
  NeverHaveIEverPublicState,
  NhiePhase,
  RoomState
} from '@feto-games/shared-types';
import { IPartyGameEngine } from '../engine/IPartyGameEngine.js';
import { RoomManager } from '../../services/roomManager.js';
import { TimerService } from '../../services/timerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const statementsDataPath = path.resolve(__dirname, '../data/neverHaveIEverStatements.json');
const NHIE_STATEMENTS: NeverHaveIEverItem[] = JSON.parse(
  readFileSync(statementsDataPath, 'utf-8')
);

interface ActiveNhieSession {
  roomCode: string;
  round: number;
  totalRounds: number;
  phase: NhiePhase;
  currentStatement?: NeverHaveIEverItem;
  usedStatementIds: Set<string>;
  innocencePoints: Map<string, number>;
  roundChoices: Map<string, 'have' | 'havenot'>;
  phaseEndsAt: number;
}

export class NeverHaveIEverEngine implements IPartyGameEngine {
  public readonly gameMode: GameMode = 'never_have_i_ever';
  public readonly name = 'Never Have I Ever';
  public readonly description = 'Party confessions! Hold on to your 10 Innocence Points.';
  public readonly minPlayers = 3;
  public readonly maxPlayers = 15;

  private sessions = new Map<string, ActiveNhieSession>();

  public async initializeGame(room: RoomState, io: any): Promise<void> {
    const players = Object.values(room.players).filter(
      (p) => p.connectionStatus === 'connected'
    );

    if (players.length < this.minPlayers) {
      throw new Error(`At least ${this.minPlayers} players are required.`);
    }

    const session: ActiveNhieSession = {
      roomCode: room.code,
      round: 0,
      totalRounds: room.config.totalRounds || 10,
      phase: 'statement',
      usedStatementIds: new Set(),
      innocencePoints: new Map(),
      roundChoices: new Map(),
      phaseEndsAt: 0
    };

    // Initialize each player with 10 innocence points
    players.forEach((p) => {
      session.innocencePoints.set(p.id, 10);
      p.score = 1000;
    });

    this.sessions.set(room.code, session);
    room.status = 'in_game';
    await RoomManager.saveRoomState(room);

    await this.startStatementRound(room, session, io);
  }

  /**
   * Starts a new statement round with 15-second countdown.
   */
  private async startStatementRound(
    room: RoomState,
    session: ActiveNhieSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);

    if (session.round >= session.totalRounds) {
      await this.concludeGame(room, session, io);
      return;
    }

    session.round += 1;
    session.roundChoices.clear();

    const available = NHIE_STATEMENTS.filter((s) => !session.usedStatementIds.has(s.id));
    const pool = available.length > 0 ? available : NHIE_STATEMENTS;
    const chosen = pool[Math.floor(Math.random() * pool.length)] || {
      id: 'default',
      category: 'Party',
      statement: 'Never have I ever stayed up past 4 AM playing party games.'
    };

    session.usedStatementIds.add(chosen.id);
    session.currentStatement = chosen;
    session.phase = 'statement';

    const duration = 15;
    session.phaseEndsAt = Date.now() + duration * 1000;

    await this.broadcastState(room, io);

    TimerService.startRoundTimer(
      io,
      room.code,
      duration,
      'statement',
      session.round,
      async () => {
        const active = this.sessions.get(room.code);
        if (!active || active.phase !== 'statement') return;
        await this.revealChoices(room, active, io);
      }
    );
  }

  /**
   * Reveal phase: show who has/hasn't done it and reveal statistics.
   */
  private async revealChoices(
    room: RoomState,
    session: ActiveNhieSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);
    session.phase = 'reveal';
    const duration = 7;
    session.phaseEndsAt = Date.now() + duration * 1000;

    // Deduct innocence points for those who chose 'have'
    session.roundChoices.forEach((choice, pid) => {
      if (choice === 'have') {
        const currentPoints = session.innocencePoints.get(pid) || 10;
        const newPoints = Math.max(0, currentPoints - 1);
        session.innocencePoints.set(pid, newPoints);

        const player = room.players[pid];
        if (player) {
          player.score = newPoints * 100;
        }
      }
    });

    await RoomManager.saveRoomState(room);
    await this.broadcastState(room, io);

    setTimeout(async () => {
      const active = this.sessions.get(room.code);
      if (!active) return;

      // Check if someone hit 0 innocence points
      let someoneEliminated = false;
      active.innocencePoints.forEach((pts) => {
        if (pts <= 0) someoneEliminated = true;
      });

      if (someoneEliminated || active.round >= active.totalRounds) {
        await this.concludeGame(room, active, io);
      } else {
        await this.startStatementRound(room, active, io);
      }
    }, 7000);
  }

  public async handlePlayerAction(
    room: RoomState,
    playerId: string,
    actionType: string,
    payload: any,
    io: any
  ): Promise<any> {
    const session = this.sessions.get(room.code);
    if (!session || session.phase !== 'statement' || room.status !== 'in_game') return;
    if (session.phaseEndsAt && Date.now() > session.phaseEndsAt + 1000) return;

    if (actionType === 'submit_choice' || actionType === 'nhie:submit_choice') {
      const choice = payload?.choice === 'have' ? 'have' : 'havenot';
      session.roundChoices.set(playerId, choice);
      await this.broadcastState(room, io);

      const activeCount = Object.values(room.players).filter(
        (p) => p.connectionStatus === 'connected'
      ).length;

      if (session.roundChoices.size >= activeCount) {
        await this.revealChoices(room, session, io);
      }
      return { success: true };
    }
  }

  private async concludeGame(
    room: RoomState,
    session: ActiveNhieSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);
    session.phase = 'game_over';

    const ranked = Object.values(room.players)
      .sort((a, b) => {
        const ptsA = session.innocencePoints.get(a.id) ?? 10;
        const ptsB = session.innocencePoints.get(b.id) ?? 10;
        return ptsB - ptsA;
      })
      .map((p, idx) => ({
        playerId: p.id,
        username: p.username,
        avatar: p.avatar,
        score: (session.innocencePoints.get(p.id) ?? 10) * 100,
        rank: idx + 1
      }));

    room.status = 'game_over';
    await RoomManager.saveRoomState(room);
    await this.broadcastState(room, io);

    io.to(room.code).emit('game:ended', {
      gameMode: this.gameMode,
      leaderboard: ranked
    });

    console.log(`🏆 [Never Have I Ever] Match ended in room ${room.code}`);
  }

  public async handleChatMessage(): Promise<{ intercepted: boolean; broadcastMessage?: any }> {
    return { intercepted: false };
  }

  public async handlePlayerDisconnect(
    room: RoomState,
    _playerId: string,
    io: any
  ): Promise<void> {
    await this.broadcastState(room, io);
  }

  public async handlePlayerReconnect(
    room: RoomState,
    _playerId: string,
    socket: any,
    _io: any
  ): Promise<void> {
    const session = this.sessions.get(room.code);
    if (!session) return;

    socket.emit('game:state_sync', {
      gameMode: this.gameMode,
      state: this.getPublicGameState(room)
    });
  }

  public getPublicGameState(room: RoomState, _forPlayerId?: string): NeverHaveIEverPublicState | null {
    const session = this.sessions.get(room.code);
    if (!session) return null;

    const innocenceObj: Record<string, number> = {};
    session.innocencePoints.forEach((pts, pid) => {
      innocenceObj[pid] = pts;
    });

    const choicesObj: Record<string, 'have' | 'havenot'> = {};
    let haveCount = 0;
    let haveNotCount = 0;

    session.roundChoices.forEach((ch, pid) => {
      if (session.phase === 'reveal' || session.phase === 'game_over') {
        choicesObj[pid] = ch;
      }
      if (ch === 'have') haveCount++;
      else haveNotCount++;
    });

    const totalVoted = session.roundChoices.size;
    const havePercentage = totalVoted > 0 ? Math.round((haveCount / totalVoted) * 100) : 0;

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((session.phaseEndsAt - now) / 1000));

    return {
      phase: session.phase,
      round: session.round,
      totalRounds: session.totalRounds,
      statement: session.currentStatement?.statement || '',
      category: session.currentStatement?.category || 'Party',
      innocencePoints: innocenceObj,
      roundChoices: choicesObj,
      stats:
        session.phase === 'reveal' || session.phase === 'game_over'
          ? {
              haveCount,
              haveNotCount,
              totalVoted,
              havePercentage
            }
          : undefined,
      phaseEndsAt: session.phaseEndsAt,
      remainingSeconds: remaining
    };
  }

  private async broadcastState(room: RoomState, io: any): Promise<void> {
    const state = this.getPublicGameState(room);
    if (state) {
      io.to(room.code).emit('game:state_sync', {
        gameMode: this.gameMode,
        state
      });
    }
  }

  public destroyGame(roomCode: string): void {
    TimerService.clearRoomTimer(roomCode);
    this.sessions.delete(roomCode);
  }
}
