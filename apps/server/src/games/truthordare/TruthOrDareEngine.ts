import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GameMode,
  RoomState,
  TodIntensityMode,
  TodPhase,
  TruthOrDareItem,
  TruthOrDarePublicState
} from '@feto-games/shared-types';
import { IPartyGameEngine } from '../engine/IPartyGameEngine.js';
import { RoomManager } from '../../services/roomManager.js';
import { TimerService } from '../../services/timerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promptsDataPath = path.resolve(__dirname, '../data/truthOrDarePrompts.json');
const TOD_PROMPTS: TruthOrDareItem[] = JSON.parse(
  readFileSync(promptsDataPath, 'utf-8')
);

interface ActiveTodSession {
  roomCode: string;
  round: number;
  totalRounds: number;
  phase: TodPhase;
  targetPlayerId: string;
  intensity: TodIntensityMode;
  chosenType?: 'truth' | 'dare';
  currentPrompt?: string;
  votes: Map<string, 'completed' | 'refused'>;
  usedPromptIds: Set<string>;
  phaseEndsAt: number;
}

export class TruthOrDareEngine implements IPartyGameEngine {
  public readonly gameMode: GameMode = 'truth_or_dare';
  public readonly name = 'Truth or Dare';
  public readonly description = 'Spin the roulette wheel, pick your courage, and face group judgment!';
  public readonly minPlayers = 2;
  public readonly maxPlayers = 15;

  private sessions = new Map<string, ActiveTodSession>();

  public async initializeGame(room: RoomState, io: any): Promise<void> {
    const players = Object.values(room.players).filter(
      (p) => p.connectionStatus === 'connected'
    );

    if (players.length < this.minPlayers) {
      throw new Error(`At least ${this.minPlayers} players are required.`);
    }

    const session: ActiveTodSession = {
      roomCode: room.code,
      round: 0,
      totalRounds: room.config.totalRounds || players.length * 2,
      phase: 'roulette',
      targetPlayerId: '',
      intensity: 'party',
      votes: new Map(),
      usedPromptIds: new Set(),
      phaseEndsAt: 0
    };

    this.sessions.set(room.code, session);
    room.status = 'in_game';
    await RoomManager.saveRoomState(room);

    await this.startRouletteSpin(room, session, io);
  }

  /**
   * Phase 1: Roulette Spin (5 seconds synced wheel spin)
   */
  private async startRouletteSpin(
    room: RoomState,
    session: ActiveTodSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);

    if (session.round >= session.totalRounds) {
      await this.concludeGame(room, session, io);
      return;
    }

    session.round += 1;
    session.chosenType = undefined;
    session.currentPrompt = undefined;
    session.votes.clear();

    const activePlayers = Object.values(room.players).filter(
      (p) => p.connectionStatus === 'connected'
    );
    if (activePlayers.length === 0) return;

    const chosen = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    if (!chosen) return;
    session.targetPlayerId = chosen.id;

    session.phase = 'roulette';
    session.phaseEndsAt = Date.now() + 5000;

    await this.broadcastState(room, io);

    setTimeout(async () => {
      const active = this.sessions.get(room.code);
      if (!active || active.round !== session.round) return;
      await this.startDecisionPhase(room, active, io);
    }, 5000);
  }

  /**
   * Phase 2: Decision (Target player chooses Truth or Dare within 15s)
   */
  private async startDecisionPhase(
    room: RoomState,
    session: ActiveTodSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);
    session.phase = 'decision';
    const duration = 15;
    session.phaseEndsAt = Date.now() + duration * 1000;

    await this.broadcastState(room, io);

    TimerService.startRoundTimer(
      io,
      room.code,
      duration,
      'decision',
      session.round,
      async () => {
        const active = this.sessions.get(room.code);
        if (!active || active.phase !== 'decision') return;
        const autoChoice = Math.random() > 0.5 ? 'truth' : 'dare';
        await this.selectPrompt(room, active, autoChoice, io);
      }
    );
  }

  /**
   * Phase 3: Performing (Target player performs challenge)
   */
  private async selectPrompt(
    room: RoomState,
    session: ActiveTodSession,
    choice: 'truth' | 'dare',
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);
    session.chosenType = choice;

    const candidates = TOD_PROMPTS.filter(
      (p) =>
        p.type === choice &&
        p.intensity === session.intensity &&
        !session.usedPromptIds.has(p.id)
    );

    const fallbackCandidates = TOD_PROMPTS.filter((p) => p.type === choice);
    const pool = candidates.length > 0 ? candidates : fallbackCandidates;
    const selected = pool[Math.floor(Math.random() * pool.length)] || {
      id: 'fallback',
      type: choice,
      intensity: 'party',
      prompt: choice === 'truth' ? 'What is your deepest secret?' : 'Do 10 jumping jacks!'
    };

    session.usedPromptIds.add(selected.id);
    session.currentPrompt = selected.prompt;
    session.phase = 'performing';

    const duration = 40;
    session.phaseEndsAt = Date.now() + duration * 1000;

    await this.broadcastState(room, io);

    TimerService.startRoundTimer(
      io,
      room.code,
      duration,
      'performing',
      session.round,
      async () => {
        const active = this.sessions.get(room.code);
        if (!active || active.phase !== 'performing') return;
        await this.startVotingPhase(room, active, io);
      }
    );
  }

  /**
   * Phase 4: Voting (All other players vote Completed or Refused)
   */
  private async startVotingPhase(
    room: RoomState,
    session: ActiveTodSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);
    session.phase = 'voting';
    session.votes.clear();

    const duration = 15;
    session.phaseEndsAt = Date.now() + duration * 1000;

    await this.broadcastState(room, io);

    TimerService.startRoundTimer(
      io,
      room.code,
      duration,
      'voting',
      session.round,
      async () => {
        const active = this.sessions.get(room.code);
        if (!active || active.phase !== 'voting') return;
        await this.resolveVotes(room, active, io);
      }
    );
  }

  /**
   * Phase 5: Resolve votes and award/deduct points
   */
  private async resolveVotes(
    room: RoomState,
    session: ActiveTodSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);

    let completedCount = 0;
    let refusedCount = 0;

    session.votes.forEach((v) => {
      if (v === 'completed') completedCount++;
      else refusedCount++;
    });

    const targetPlayer = room.players[session.targetPlayerId];
    if (targetPlayer) {
      if (completedCount >= refusedCount) {
        targetPlayer.score = (targetPlayer.score || 0) + 100;
      } else {
        targetPlayer.score = Math.max(0, (targetPlayer.score || 0) - 50);
      }
      await RoomManager.saveRoomState(room);
    }

    session.phase = 'round_results';
    session.phaseEndsAt = Date.now() + 5000;

    await this.broadcastState(room, io);

    setTimeout(async () => {
      const active = this.sessions.get(room.code);
      if (!active) return;
      await this.startRouletteSpin(room, active, io);
    }, 5000);
  }

  public async handlePlayerAction(
    room: RoomState,
    playerId: string,
    actionType: string,
    payload: any,
    io: any
  ): Promise<any> {
    const session = this.sessions.get(room.code);
    if (!session || room.status !== 'in_game') return;
    if (session.phaseEndsAt && Date.now() > session.phaseEndsAt + 1000) return;

    if (actionType === 'choose_type' || actionType === 'tod:choose_type') {
      if (session.phase === 'decision' && playerId === session.targetPlayerId) {
        const choice = payload?.choice === 'truth' ? 'truth' : 'dare';
        await this.selectPrompt(room, session, choice, io);
        return { success: true };
      }
    } else if (actionType === 'complete_action' || actionType === 'tod:complete_action') {
      if (session.phase === 'performing' && playerId === session.targetPlayerId) {
        await this.startVotingPhase(room, session, io);
        return { success: true };
      }
    } else if (actionType === 'vote' || actionType === 'tod:vote') {
      if (session.phase === 'voting' && playerId !== session.targetPlayerId) {
        const vote = payload?.vote === 'refused' ? 'refused' : 'completed';
        session.votes.set(playerId, vote);
        await this.broadcastState(room, io);

        // Check if all non-target connected players have voted
        const otherConnected = Object.values(room.players).filter(
          (p) => p.connectionStatus === 'connected' && p.id !== session.targetPlayerId
        );
        if (session.votes.size >= otherConnected.length) {
          await this.resolveVotes(room, session, io);
        }
        return { success: true };
      }
    }
  }

  private async concludeGame(
    room: RoomState,
    session: ActiveTodSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);
    session.phase = 'game_over';

    const ranked = Object.values(room.players)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((p, idx) => ({
        playerId: p.id,
        username: p.username,
        avatar: p.avatar,
        score: p.score || 0,
        rank: idx + 1
      }));

    room.status = 'game_over';
    await RoomManager.saveRoomState(room);
    await this.broadcastState(room, io);

    io.to(room.code).emit('game:ended', {
      gameMode: this.gameMode,
      leaderboard: ranked
    });

    console.log(`🏆 [Truth or Dare] Match ended in room ${room.code}`);
  }

  public async handleChatMessage(): Promise<{ intercepted: boolean; broadcastMessage?: any }> {
    return { intercepted: false };
  }

  public async handlePlayerDisconnect(
    room: RoomState,
    playerId: string,
    io: any
  ): Promise<void> {
    const session = this.sessions.get(room.code);
    if (session && session.targetPlayerId === playerId && session.phase !== 'game_over') {
      await this.startRouletteSpin(room, session, io);
    } else {
      await this.broadcastState(room, io);
    }
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

  public getPublicGameState(room: RoomState, _forPlayerId?: string): TruthOrDarePublicState | null {
    const session = this.sessions.get(room.code);
    if (!session) return null;

    let completed = 0;
    let refused = 0;
    const votesObj: Record<string, 'completed' | 'refused'> = {};
    session.votes.forEach((v, pid) => {
      votesObj[pid] = v;
      if (v === 'completed') completed++;
      else refused++;
    });

    const scoresMap: Record<string, number> = {};
    Object.values(room.players).forEach((p) => {
      scoresMap[p.id] = p.score || 0;
    });

    const targetUser = room.players[session.targetPlayerId];
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((session.phaseEndsAt - now) / 1000));

    return {
      phase: session.phase,
      round: session.round,
      totalRounds: session.totalRounds,
      targetPlayerId: session.targetPlayerId,
      targetUsername: targetUser?.username || 'Player',
      targetAvatar: targetUser?.avatar || 'cyber_cat',
      intensity: session.intensity,
      chosenType: session.chosenType,
      currentPrompt: session.currentPrompt,
      votes: votesObj,
      voteTallies: { completed, refused },
      scores: scoresMap,
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
