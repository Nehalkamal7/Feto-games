import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GameMode,
  RoomState,
  WordBattlePublicState,
  WordBattleSubmission
} from '@feto-games/shared-types';
import { IPartyGameEngine } from '../engine/IPartyGameEngine.js';
import { RoomManager } from '../../services/roomManager.js';
import { TimerService } from '../../services/timerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const categoriesDataPath = path.resolve(__dirname, '../data/wordBattleCategories.json');
const WORD_CATEGORIES: { category: string; letter: string; validWords: string[] }[] = JSON.parse(
  readFileSync(categoriesDataPath, 'utf-8')
);

interface ActiveWordBattleSession {
  roomCode: string;
  round: number;
  totalRounds: number;
  phase: 'starting' | 'word_racing' | 'round_results' | 'game_over';
  category: string;
  startingLetter: string;
  validWordsSet: Set<string>;
  claimedWords: Set<string>;
  recentSubmissions: WordBattleSubmission[];
  playerWordCounts: Map<string, number>;
  roundScores: Map<string, number>;
  phaseEndsAt: number;
  durationSeconds: number;
}

export class WordBattleEngine implements IPartyGameEngine {
  public readonly gameMode: GameMode = 'word_battle';
  public readonly name = 'Word Battle';
  public readonly description = 'Fast-paced word challenge! Race against the clock with unique words.';
  public readonly minPlayers = 2;
  public readonly maxPlayers = 15;

  private sessions = new Map<string, ActiveWordBattleSession>();

  public async initializeGame(room: RoomState, io: any): Promise<void> {
    const players = Object.values(room.players).filter(
      (p) => p.connectionStatus === 'connected'
    );

    if (players.length < this.minPlayers) {
      throw new Error(`At least ${this.minPlayers} players are required.`);
    }

    const session: ActiveWordBattleSession = {
      roomCode: room.code,
      round: 0,
      totalRounds: room.config.totalRounds || 5,
      phase: 'starting',
      category: '',
      startingLetter: '',
      validWordsSet: new Set(),
      claimedWords: new Set(),
      recentSubmissions: [],
      playerWordCounts: new Map(),
      roundScores: new Map(),
      phaseEndsAt: 0,
      durationSeconds: 25
    };

    this.sessions.set(room.code, session);
    room.status = 'in_game';
    await RoomManager.saveRoomState(room);

    await this.startNextRound(room, session, io);
  }

  /**
   * Starts a new round with a random category & starting letter.
   */
  private async startNextRound(
    room: RoomState,
    session: ActiveWordBattleSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);

    if (session.round >= session.totalRounds) {
      await this.concludeGame(room, session, io);
      return;
    }

    session.round += 1;
    session.claimedWords.clear();
    session.playerWordCounts.clear();
    session.roundScores.clear();
    session.recentSubmissions = [];

    // Pick a random category item
    const candidate = WORD_CATEGORIES[Math.floor(Math.random() * WORD_CATEGORIES.length)] || {
      category: 'Animals',
      letter: 'T',
      validWords: ['tiger', 'turtle', 'toucan', 'tarantula']
    };

    session.category = candidate.category;
    session.startingLetter = candidate.letter.toUpperCase();
    session.validWordsSet = new Set(candidate.validWords.map((w) => w.toLowerCase()));

    // 3-second preview phase
    session.phase = 'starting';
    session.phaseEndsAt = Date.now() + 3000;

    await this.broadcastState(room, io);

    setTimeout(async () => {
      const active = this.sessions.get(room.code);
      if (!active || active.round !== session.round) return;

      // Enter 25-second word racing phase
      active.phase = 'word_racing';
      const duration = active.durationSeconds;
      active.phaseEndsAt = Date.now() + duration * 1000;

      await this.broadcastState(room, io);

      TimerService.startRoundTimer(
        io,
        room.code,
        duration,
        'word_racing',
        active.round,
        async () => {
          await this.endWordRacing(room, active, io);
        }
      );
    }, 3000);
  }

  /**
   * Handles player submitting a word in the race.
   */
  public async handlePlayerAction(
    room: RoomState,
    playerId: string,
    actionType: string,
    payload: any,
    io: any
  ): Promise<any> {
    const session = this.sessions.get(room.code);
    if (!session || session.phase !== 'word_racing') {
      return { accepted: false, reason: 'Not in word racing phase.' };
    }
    if (room.status !== 'in_game') {
      return { accepted: false, reason: 'Room not in active game.' };
    }
    if (session.phaseEndsAt && Date.now() > session.phaseEndsAt + 1000) {
      return { accepted: false, reason: 'Word racing round has ended.' };
    }

    if (actionType === 'submit_word') {
      const rawWord = (payload?.word || '').trim();
      const normalized = rawWord.toLowerCase();

      // 1. Validate starting letter
      if (!normalized.startsWith(session.startingLetter.toLowerCase())) {
        io.to(room.code).emit('word_battle:rejected', {
          word: rawWord,
          reason: 'invalid_letter'
        });
        return { accepted: false, reason: `Word must start with "${session.startingLetter}"!` };
      }

      // 2. Validate word uniqueness in current round
      if (session.claimedWords.has(normalized)) {
        io.to(room.code).emit('word_battle:rejected', {
          word: rawWord,
          reason: 'already_taken'
        });
        return { accepted: false, reason: `"${rawWord}" was already claimed by someone else!` };
      }

      // 3. Validate against word length and dictionary / category bank
      const isValidLength = normalized.length >= 2 && /^[a-z\s-]+$/.test(normalized);
      const isKnownValid =
        session.validWordsSet.has(normalized) ||
        (isValidLength && normalized.length >= 3);

      if (!isValidLength || !isKnownValid) {
        io.to(room.code).emit('word_battle:rejected', {
          word: rawWord,
          reason: 'invalid_word'
        });
        return { accepted: false, reason: `"${rawWord}" is not recognized.` };
      }

      // Claim word
      session.claimedWords.add(normalized);

      // Calculate speed & length score
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.ceil((session.phaseEndsAt - now) / 1000));
      const lengthBonus = Math.min(100, normalized.length * 10);
      const speedBonus = Math.min(100, remainingSeconds * 4);
      const points = 50 + lengthBonus + speedBonus;

      // Update room player scores
      const player = room.players[playerId];
      if (player) {
        player.score = (player.score || 0) + points;
        await RoomManager.saveRoomState(room);
      }

      // Track round stats
      const currentCount = session.playerWordCounts.get(playerId) || 0;
      session.playerWordCounts.set(playerId, currentCount + 1);

      const currentScore = session.roundScores.get(playerId) || 0;
      session.roundScores.set(playerId, currentScore + points);

      const submission: WordBattleSubmission = {
        playerId,
        username: player?.username || 'Player',
        avatar: player?.avatar || 'cyber_cat',
        word: rawWord,
        points,
        submittedAt: now
      };

      session.recentSubmissions.unshift(submission);
      if (session.recentSubmissions.length > 20) {
        session.recentSubmissions.pop();
      }

      // Emit success feedback to submitter
      io.to(room.code).emit('word_battle:accepted', {
        word: rawWord,
        points,
        username: player?.username || 'Player'
      });

      // Broadcast state update to all players
      await this.broadcastState(room, io);
      return { accepted: true, points, word: rawWord };
    }
  }

  /**
   * Concludes the word racing phase and displays round results.
   */
  private async endWordRacing(
    room: RoomState,
    session: ActiveWordBattleSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);
    session.phase = 'round_results';
    session.phaseEndsAt = Date.now() + 5000;

    await this.broadcastState(room, io);

    setTimeout(async () => {
      const active = this.sessions.get(room.code);
      if (!active) return;
      await this.startNextRound(room, active, io);
    }, 5000);
  }

  /**
   * Concludes the game and announces winners.
   */
  private async concludeGame(
    room: RoomState,
    session: ActiveWordBattleSession,
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

    console.log(`🏆 [Word Battle] Match ended in room ${room.code}`);
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

  public getPublicGameState(room: RoomState, _forPlayerId?: string): WordBattlePublicState | null {
    const session = this.sessions.get(room.code);
    if (!session) return null;

    const counts: Record<string, number> = {};
    session.playerWordCounts.forEach((cnt, pid) => {
      counts[pid] = cnt;
    });

    const scoresMap: Record<string, number> = {};
    session.roundScores.forEach((sc, pid) => {
      scoresMap[pid] = sc;
    });

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((session.phaseEndsAt - now) / 1000));

    return {
      phase: session.phase,
      round: session.round,
      totalRounds: session.totalRounds,
      category: session.category,
      startingLetter: session.startingLetter,
      claimedWords: Array.from(session.claimedWords),
      recentSubmissions: session.recentSubmissions,
      scores: scoresMap,
      playerWordCounts: counts,
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
