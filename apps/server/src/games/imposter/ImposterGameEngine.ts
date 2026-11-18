import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ClueSubmission,
  GameMode,
  ImposterPublicState,
  ImposterRole,
  PlayerScoreUpdate,
  RoomState
} from '@feto-games/shared-types';
import { IPartyGameEngine } from '../engine/IPartyGameEngine.js';
import { RoomManager } from '../../services/roomManager.js';
import { TimerService } from '../../services/timerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wordsDataPath = path.resolve(__dirname, '../data/imposterWords.json');
const IMPOSTER_WORDS: { category: string; word: string }[] = JSON.parse(
  readFileSync(wordsDataPath, 'utf-8')
);

interface ActiveImposterSession {
  roomCode: string;
  category: string;
  secretWord: string;
  imposterIds: Set<string>;
  turnOrder: string[]; // player IDs in turn order
  currentTurnIndex: number;
  clues: Record<string, ClueSubmission>;
  votes: Record<string, string>; // voterId -> targetPlayerId
  voteTallies: Record<string, number>; // targetPlayerId -> count
  caughtImposterIds: string[];
  suddenDeathActive: boolean;
  suddenDeathPlayerId?: string;
  suddenDeathEndsAt?: number;
  phase: 'role_reveal' | 'clue_giving' | 'voting' | 'imposter_sudden_death' | 'round_result' | 'game_over';
  suddenDeathTimer?: NodeJS.Timeout;
}

export class ImposterGameEngine implements IPartyGameEngine {
  public readonly gameMode: GameMode = 'who_is_imposter';
  public readonly name = 'Who Is The Imposter?';
  public readonly description = 'Find the secret infiltrator before they blend in!';
  public readonly minPlayers = 3;
  public readonly maxPlayers = 15;

  private sessions = new Map<string, ActiveImposterSession>();

  /**
   * Scale imposters dynamically based on player count.
   * 3-6 players: 1 imposter
   * 7-11 players: 2 imposters
   * 12-15 players: 3 imposters
   */
  public getImposterCount(playerCount: number): number {
    if (playerCount >= 12) return 3;
    if (playerCount >= 7) return 2;
    return 1;
  }

  public async initializeGame(room: RoomState, io: any): Promise<void> {
    const players = Object.values(room.players).filter(
      (p) => p.connectionStatus === 'connected'
    );

    if (players.length < this.minPlayers) {
      throw new Error(`At least ${this.minPlayers} players are required.`);
    }

    // 1. Pick secret word and category
    const selectedItem =
      IMPOSTER_WORDS[Math.floor(Math.random() * IMPOSTER_WORDS.length)] || { category: 'Animals', word: 'Elephant' };
    const category = selectedItem.category;
    const secretWord = selectedItem.word;

    // 2. Select imposters
    const imposterCount = this.getImposterCount(players.length);
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const imposterPlayers = shuffled.slice(0, imposterCount);
    const imposterIds = new Set(imposterPlayers.map((p) => p.id));

    // Turn order for clue giving
    const turnOrder = shuffled.map((p) => p.id);

    const session: ActiveImposterSession = {
      roomCode: room.code,
      category,
      secretWord,
      imposterIds,
      turnOrder,
      currentTurnIndex: 0,
      clues: {},
      votes: {},
      voteTallies: {},
      caughtImposterIds: [],
      suddenDeathActive: false,
      phase: 'role_reveal'
    };

    this.sessions.set(room.code, session);

    // 3. Emit Targeted Private Roles (civilians get secretWord; imposters DO NOT)
    players.forEach((p) => {
      const isImp = imposterIds.has(p.id);
      const targetSocket = io.sockets.sockets.get(p.socketId);

      p.secretRole = isImp ? 'The Imposter' : 'Civilian';

      if (targetSocket) {
        if (isImp) {
          const fellowImposters = imposterPlayers
            .filter((imp) => imp.id !== p.id)
            .map((imp) => imp.username);

          targetSocket.emit('game:private_role', {
            role: 'imposter' as ImposterRole,
            category,
            imposterCount,
            teammateNames: fellowImposters
          });
        } else {
          targetSocket.emit('game:private_role', {
            role: 'civilian' as ImposterRole,
            category,
            secretWord,
            imposterCount
          });
        }
      }
    });

    room.status = 'in_game';
    await RoomManager.saveRoomState(room);

    // Broadcast initial state
    this.broadcastState(room, session, io);

    // 4. Role reveal duration: 5 seconds, then transition to turn-based clues
    setTimeout(() => {
      this.startClueGivingPhase(room, session, io);
    }, 5000);
  }

  /**
   * Starts turn-based clue submission phase.
   */
  private startClueGivingPhase(
    room: RoomState,
    session: ActiveImposterSession,
    io: any
  ): void {
    session.phase = 'clue_giving';
    session.currentTurnIndex = 0;
    this.startPlayerTurn(room, session, io);
  }

  private startPlayerTurn(
    room: RoomState,
    session: ActiveImposterSession,
    io: any
  ): void {
    if (session.currentTurnIndex >= session.turnOrder.length) {
      // All players have submitted clues, transition to Voting!
      this.startVotingPhase(room, session, io);
      return;
    }

    const currentTurnPlayerId = session.turnOrder[session.currentTurnIndex];
    if (!currentTurnPlayerId) {
      this.startVotingPhase(room, session, io);
      return;
    }
    const player = room.players[currentTurnPlayerId];

    if (!player || player.connectionStatus !== 'connected') {
      // Skip disconnected player
      session.currentTurnIndex++;
      this.startPlayerTurn(room, session, io);
      return;
    }

    const turnDuration = 25; // 25 seconds per clue
    this.broadcastState(room, session, io);

    TimerService.startRoundTimer(
      io,
      room.code,
      turnDuration,
      'clue_giving',
      room.currentRound,
      async () => {
        // Auto-submit fallback if player timed out
        if (currentTurnPlayerId && !session.clues[currentTurnPlayerId]) {
          session.clues[currentTurnPlayerId] = {
            playerId: player.id,
            username: player.username,
            avatar: player.avatar,
            clue: '...',
            submittedAt: Date.now()
          };
        }
        session.currentTurnIndex++;
        this.startPlayerTurn(room, session, io);
      }
    );
  }

  /**
   * Starts interactive voting phase with live tallies.
   */
  private startVotingPhase(
    room: RoomState,
    session: ActiveImposterSession,
    io: any
  ): void {
    TimerService.clearRoomTimer(room.code);
    session.phase = 'voting';
    session.votes = {};
    session.voteTallies = {};

    this.broadcastState(room, session, io);

    const votingDuration = 30; // 30 seconds to vote
    TimerService.startRoundTimer(
      io,
      room.code,
      votingDuration,
      'player_voting',
      room.currentRound,
      async () => {
        await this.tallyVotesAndConclude(room, session, io);
      }
    );
  }

  /**
   * Tallies votes and resolves whether imposter is caught.
   */
  private async tallyVotesAndConclude(
    room: RoomState,
    session: ActiveImposterSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);

    // Find highest voted player(s)
    let maxVotes = 0;
    const highestVotedIds: string[] = [];

    for (const [targetId, count] of Object.entries(session.voteTallies)) {
      if (count > maxVotes) {
        maxVotes = count;
        highestVotedIds.length = 0;
        highestVotedIds.push(targetId);
      } else if (count === maxVotes && maxVotes > 0) {
        highestVotedIds.push(targetId);
      }
    }

    const caughtImposters = highestVotedIds.filter((id) =>
      session.imposterIds.has(id)
    );

    if (caughtImposters.length > 0) {
      // AT LEAST ONE IMPOSTER WAS CAUGHT!
      session.caughtImposterIds = caughtImposters;
      const primeCaughtId = caughtImposters[0] || '';
      const caughtPlayer = room.players[primeCaughtId];

      console.log(`🚨 Imposter ${caughtPlayer?.username} was caught! Entering Sudden Death!`);

      // 10-Second Sudden Death Phase
      session.phase = 'imposter_sudden_death';
      session.suddenDeathActive = true;
      session.suddenDeathPlayerId = primeCaughtId;
      session.suddenDeathEndsAt = Date.now() + 10000;

      this.broadcastState(room, session, io);

      // Autorun 10-second timer
      TimerService.startRoundTimer(
        io,
        room.code,
        10,
        'imposter_sudden_death',
        room.currentRound,
        async () => {
          if (session.suddenDeathActive) {
            // Sudden death timed out: Civilians win!
            console.log('⏰ Sudden death expired. Civilians win!');
            await this.finalizeRoundScores(room, session, io, false);
          }
        }
      );
    } else {
      // Imposters escaped!
      console.log('😈 Imposters escaped! Imposters win!');
      await this.finalizeRoundScores(room, session, io, true);
    }
  }

  /**
   * Finalizes round scores and broadcasts results.
   */
  private async finalizeRoundScores(
    room: RoomState,
    session: ActiveImposterSession,
    io: any,
    impostersWon: boolean
  ): Promise<void> {
    session.phase = 'round_result';
    session.suddenDeathActive = false;
    TimerService.clearRoomTimer(room.code);

    const scoreUpdates: PlayerScoreUpdate[] = [];

    Object.values(room.players).forEach((player) => {
      const isImp = session.imposterIds.has(player.id);
      let delta = 0;

      if (impostersWon) {
        if (isImp) delta = 500;
      } else {
        if (!isImp) {
          delta = 350;
          // Bonus if this civilian voted for the caught imposter
          const playerVotedFor = session.votes[player.id];
          if (playerVotedFor && session.caughtImposterIds.includes(playerVotedFor)) {
            delta += 150;
          }
        }
      }

      const prev = player.score;
      player.score += delta;

      scoreUpdates.push({
        playerId: player.id,
        username: player.username,
        avatar: player.avatar,
        previousScore: prev,
        roundScoreDelta: delta,
        totalScore: player.score,
        rank: 1
      });
    });

    scoreUpdates.sort((a, b) => b.totalScore - a.totalScore);
    scoreUpdates.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    await RoomManager.saveRoomState(room);

    this.broadcastState(room, session, io, impostersWon, scoreUpdates);
    io.to(room.code).emit('game:scores-updated', scoreUpdates);
  }

  public async handlePlayerAction(
    room: RoomState,
    playerId: string,
    actionType: string,
    payload: any,
    io: any
  ): Promise<any> {
    const session = this.sessions.get(room.code);
    if (!session) throw new Error('NO_ACTIVE_GAME');

    const player = room.players[playerId];
    if (!player) throw new Error('PLAYER_NOT_IN_ROOM');

    // Action 1: Submit Clue
    if (actionType === 'submit_clue') {
      if (session.phase !== 'clue_giving') {
        throw new Error('NOT_IN_CLUE_PHASE');
      }

      const currentTurnId = session.turnOrder[session.currentTurnIndex];
      if (currentTurnId !== playerId) {
        throw new Error('NOT_YOUR_TURN');
      }

      const clueText = (payload.clue || '').trim().slice(0, 40);
      if (!clueText) throw new Error('EMPTY_CLUE');

      session.clues[playerId] = {
        playerId,
        username: player.username,
        avatar: player.avatar,
        clue: clueText,
        submittedAt: Date.now()
      };

      TimerService.clearRoomTimer(room.code);
      session.currentTurnIndex++;
      this.startPlayerTurn(room, session, io);
      return { success: true };
    }

    // Action 2: Cast Vote
    if (actionType === 'cast_vote') {
      if (session.phase !== 'voting') {
        throw new Error('NOT_IN_VOTING_PHASE');
      }

      const targetPlayerId = payload.targetPlayerId;
      if (!room.players[targetPlayerId]) {
        throw new Error('INVALID_TARGET_PLAYER');
      }

      // Record / update vote
      const previousVote = session.votes[playerId];
      if (previousVote) {
        session.voteTallies[previousVote] = Math.max(0, (session.voteTallies[previousVote] || 1) - 1);
      }

      session.votes[playerId] = targetPlayerId;
      session.voteTallies[targetPlayerId] = (session.voteTallies[targetPlayerId] || 0) + 1;

      this.broadcastState(room, session, io);

      // Check if all connected active players have voted
      const connectedCount = Object.values(room.players).filter(
        (p) => p.connectionStatus === 'connected'
      ).length;

      if (Object.keys(session.votes).length >= connectedCount) {
        await this.tallyVotesAndConclude(room, session, io);
      }

      return { success: true };
    }

    // Action 3: Imposter Sudden-Death Guess
    if (actionType === 'sudden_death_guess') {
      if (!session.suddenDeathActive || session.phase !== 'imposter_sudden_death') {
        throw new Error('SUDDEN_DEATH_NOT_ACTIVE');
      }

      if (playerId !== session.suddenDeathPlayerId) {
        throw new Error('ONLY_CAUGHT_IMPOSTER_CAN_GUESS');
      }

      const guessedWord = (payload.guessedWord || '').trim().toLowerCase();
      const actualWord = session.secretWord.trim().toLowerCase();

      console.log(`🎯 Imposter guessed: "${guessedWord}", Actual: "${actualWord}"`);

      if (guessedWord === actualWord) {
        // Imposter nailed it! Imposter steals the win!
        console.log('🔥 Imposter guessed the word correctly in Sudden Death!');
        await this.finalizeRoundScores(room, session, io, true);
        return { success: true, correct: true };
      } else {
        // Wrong guess! Civilians win!
        console.log('❌ Imposter guessed incorrectly in Sudden Death!');
        await this.finalizeRoundScores(room, session, io, false);
        return { success: true, correct: false };
      }
    }

    throw new Error(`UNKNOWN_ACTION: ${actionType}`);
  }

  public async handlePlayerDisconnect(
    room: RoomState,
    playerId: string,
    io: any
  ): Promise<void> {
    const session = this.sessions.get(room.code);
    if (!session) return;

    // If it was the disconnected player's turn to give a clue, skip them
    if (session.phase === 'clue_giving') {
      const currentTurnId = session.turnOrder[session.currentTurnIndex];
      if (currentTurnId === playerId) {
        session.currentTurnIndex++;
        this.startPlayerTurn(room, session, io);
      }
    }
  }

  public async handlePlayerReconnect(
    room: RoomState,
    playerId: string,
    socket: any,
    _io: any
  ): Promise<void> {
    const session = this.sessions.get(room.code);
    if (!session) return;

    const isImp = session.imposterIds.has(playerId);
    const fellowImposters = Object.values(room.players)
      .filter((p) => session.imposterIds.has(p.id) && p.id !== playerId)
      .map((p) => p.username);

    // Re-send private role
    socket.emit('game:private_role', {
      role: (isImp ? 'imposter' : 'civilian') as ImposterRole,
      category: session.category,
      secretWord: isImp ? undefined : session.secretWord,
      imposterCount: session.imposterIds.size,
      teammateNames: isImp ? fellowImposters : undefined
    });

    // Send latest public state
    socket.emit('game:state_sync', {
      gameMode: this.gameMode,
      state: this.getPublicGameState(room, playerId)
    });
  }

  public getPublicGameState(room: RoomState, _forPlayerId?: string): ImposterPublicState {
    const session = this.sessions.get(room.code);
    if (!session) {
      return {
        phase: 'role_reveal',
        category: '',
        turnOrder: [],
        clues: {},
        votes: {},
        voteTallies: {},
        caughtImposterIds: [],
        suddenDeathActive: false
      };
    }

    const currentTurnPlayerId =
      session.phase === 'clue_giving'
        ? session.turnOrder[session.currentTurnIndex]
        : undefined;

    const currentTurnUsername = currentTurnPlayerId
      ? room.players[currentTurnPlayerId]?.username
      : undefined;

    const suddenDeathPlayerUsername = session.suddenDeathPlayerId
      ? room.players[session.suddenDeathPlayerId]?.username
      : undefined;

    // Revealed word and imposter list only exposed at round_result
    const isResult = session.phase === 'round_result' || session.phase === 'game_over';

    return {
      phase: session.phase,
      category: session.category,
      currentTurnPlayerId,
      currentTurnUsername,
      turnOrder: session.turnOrder,
      clues: session.clues,
      votes: session.votes,
      voteTallies: session.voteTallies,
      caughtImposterIds: session.caughtImposterIds,
      suddenDeathActive: session.suddenDeathActive,
      suddenDeathPlayerId: session.suddenDeathPlayerId,
      suddenDeathPlayerUsername,
      suddenDeathEndsAt: session.suddenDeathEndsAt,
      revealedWord: isResult ? session.secretWord : undefined,
      impostersWon: undefined,
      imposterList: isResult
        ? Object.values(room.players).map((p) => ({
            id: p.id,
            username: p.username,
            role: session.imposterIds.has(p.id) ? ('imposter' as ImposterRole) : ('civilian' as ImposterRole)
          }))
        : undefined
    };
  }

  private broadcastState(
    room: RoomState,
    _session: ActiveImposterSession,
    io: any,
    impostersWon?: boolean,
    roundScoreUpdates?: PlayerScoreUpdate[]
  ): void {
    const state = this.getPublicGameState(room);
    if (impostersWon !== undefined) state.impostersWon = impostersWon;
    if (roundScoreUpdates) state.roundScoreUpdates = roundScoreUpdates;

    io.to(room.code).emit('game:state_sync', {
      gameMode: this.gameMode,
      state
    });
  }

  public destroyGame(roomCode: string): void {
    const session = this.sessions.get(roomCode);
    if (session) {
      if (session.suddenDeathTimer) clearTimeout(session.suddenDeathTimer);
      this.sessions.delete(roomCode);
    }
    TimerService.clearRoomTimer(roomCode);
  }
}
