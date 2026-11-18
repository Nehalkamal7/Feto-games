import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ChatMessage,
  DrawAndGuessPublicState,
  DrawStroke,
  GameMode,
  PlayerScoreUpdate,
  RoomState
} from '@feto-games/shared-types';
import { IPartyGameEngine } from '../engine/IPartyGameEngine.js';
import { RoomManager } from '../../services/roomManager.js';
import { TimerService } from '../../services/timerService.js';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const drawDataPath = path.resolve(__dirname, '../data/drawWords.json');
const DRAW_WORDS: { word: string; category: string; difficulty: string }[] = JSON.parse(
  readFileSync(drawDataPath, 'utf-8')
);

interface ActiveDrawSession {
  roomCode: string;
  drawerOrder: string[]; // List of playerIds who will draw in order
  currentDrawerIndex: number;
  currentDrawerId: string;
  secretWord: string;
  category: string;
  wordChoices: string[];
  correctGuessers: Set<string>; // Player IDs who guessed correctly
  drawingStrokes: DrawStroke[]; // Cached strokes for late rejoiners
  phase: 'word_selection' | 'drawing' | 'round_result' | 'game_over';
  phaseEndsAt: number;
  totalDurationSeconds: number;
  wordSelectionTimer?: NodeJS.Timeout;
}

export class DrawAndGuessEngine implements IPartyGameEngine {
  public readonly gameMode: GameMode = 'draw_and_guess';
  public readonly name = 'Draw & Guess';
  public readonly description = '1 drawer, up to 14 rapid guessers, real-time canvas!';
  public readonly minPlayers = 2;
  public readonly maxPlayers = 15;

  private sessions = new Map<string, ActiveDrawSession>();

  public async initializeGame(room: RoomState, io: any): Promise<void> {
    const players = Object.values(room.players).filter(
      (p) => p.connectionStatus === 'connected'
    );

    if (players.length < this.minPlayers) {
      throw new Error(`At least ${this.minPlayers} players are required.`);
    }

    // Shuffle drawer order so everyone gets an equal turn
    const drawerOrder = [...players].sort(() => 0.5 - Math.random()).map((p) => p.id);

    const session: ActiveDrawSession = {
      roomCode: room.code,
      drawerOrder,
      currentDrawerIndex: 0,
      currentDrawerId: drawerOrder[0] || '',
      secretWord: '',
      category: '',
      wordChoices: [],
      correctGuessers: new Set(),
      drawingStrokes: [],
      phase: 'word_selection',
      phaseEndsAt: 0,
      totalDurationSeconds: room.config.roundDurationSeconds || 60
    };

    this.sessions.set(room.code, session);
    room.status = 'in_game';
    await RoomManager.saveRoomState(room);

    await this.startWordSelection(room, session, io);
  }

  /**
   * Drawer picks from 3 random words (easy, medium, hard).
   */
  private async startWordSelection(
    room: RoomState,
    session: ActiveDrawSession,
    io: any
  ): Promise<void> {
    session.phase = 'word_selection';
    session.correctGuessers.clear();
    session.drawingStrokes = [];

    // Find active drawer
    const drawerId = session.drawerOrder[session.currentDrawerIndex % session.drawerOrder.length] || '';
    session.currentDrawerId = drawerId;
    const drawer = room.players[drawerId];

    if (!drawer || drawer.connectionStatus !== 'connected') {
      // Skip disconnected drawer
      session.currentDrawerIndex++;
      await this.startWordSelection(room, session, io);
      return;
    }

    // Pick 3 candidate words
    const shuffled = [...DRAW_WORDS].sort(() => 0.5 - Math.random());
    const candidates = shuffled.slice(0, 3);
    session.wordChoices = candidates.map((c) => c.word);

    session.phaseEndsAt = Date.now() + 15000;

    // Broadcast public state
    this.broadcastState(room, session, io);

    // Send private word choices only to the drawer
    const drawerSocket = io.sockets.sockets.get(drawer.socketId);
    if (drawerSocket) {
      drawerSocket.emit('game:private_role', {
        role: 'civilian',
        category: 'Drawing Choices',
        secretWord: session.wordChoices.join(' | '),
        imposterCount: 0
      });
    }

    // 15-second selection timer: auto-pick if drawer doesn't select
    TimerService.startRoundTimer(
      io,
      room.code,
      15,
      'word_selection',
      room.currentRound,
      async () => {
        if (session.phase === 'word_selection') {
          const defaultPick = candidates[0] || { word: 'Cat', category: 'Animals', difficulty: 'easy' };
          await this.beginDrawingPhase(room, session, defaultPick.word, defaultPick.category, io);
        }
      }
    );
  }

  /**
   * Begins the actual drawing phase with real-time canvas streaming.
   */
  private async beginDrawingPhase(
    room: RoomState,
    session: ActiveDrawSession,
    word: string,
    category: string,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);

    session.phase = 'drawing';
    session.secretWord = word;
    session.category = category;
    session.correctGuessers.clear();
    session.drawingStrokes = [];

    const duration = session.totalDurationSeconds;
    session.phaseEndsAt = Date.now() + duration * 1000;

    // Notify drawer of their chosen word
    const drawer = room.players[session.currentDrawerId];
    if (drawer) {
      const drawerSocket = io.sockets.sockets.get(drawer.socketId);
      if (drawerSocket) {
        drawerSocket.emit('game:private_role', {
          role: 'civilian',
          category: session.category,
          secretWord: session.secretWord,
          imposterCount: 0
        });
      }
    }

    this.broadcastState(room, session, io);

    // Announce in chat
    io.to(room.code).emit('chat:message', {
      id: nanoid(8),
      playerId: 'system',
      username: 'SYSTEM',
      text: `🎨 ${drawer?.username} is now drawing! Category: ${category} (${word.length} letters)`,
      isSystem: true,
      timestamp: Date.now()
    });

    // Start authoritative round timer
    TimerService.startRoundTimer(
      io,
      room.code,
      duration,
      'drawing',
      room.currentRound,
      async () => {
        console.log(`⏰ Drawing timer expired for room ${room.code}`);
        await this.concludeDrawingRound(room, session, io);
      }
    );
  }

  /**
   * Intercepts chat messages: detects correct word guesses in real time.
   */
  public async handleChatMessage(
    room: RoomState,
    playerId: string,
    messageText: string,
    io: any
  ): Promise<{ intercepted: boolean; broadcastMessage?: ChatMessage }> {
    const session = this.sessions.get(room.code);
    const player = room.players[playerId];
    if (!session || !player) {
      return { intercepted: false };
    }

    if (session.phase !== 'drawing') {
      return {
        intercepted: false,
        broadcastMessage: {
          id: nanoid(8),
          playerId: player.id,
          username: player.username,
          text: messageText,
          timestamp: Date.now()
        }
      };
    }

    // Drawer cannot chat the secret word
    if (playerId === session.currentDrawerId) {
      return {
        intercepted: false,
        broadcastMessage: {
          id: nanoid(8),
          playerId: player.id,
          username: player.username,
          text: messageText,
          timestamp: Date.now()
        }
      };
    }

    // If player has already guessed correctly, prevent spoiling
    if (session.correctGuessers.has(playerId)) {
      const socket = io.sockets.sockets.get(player.socketId);
      if (socket) {
        socket.emit('chat:message', {
          id: nanoid(8),
          playerId: 'system',
          username: 'SYSTEM',
          text: 'You have already guessed the word! Please keep quiet for others.',
          isSystem: true,
          timestamp: Date.now()
        });
      }
      return { intercepted: true };
    }

    // Check if guess matches secret word (case-insensitive & trimmed)
    const normalizedGuess = messageText.trim().toLowerCase();
    const normalizedSecret = session.secretWord.trim().toLowerCase();

    if (normalizedGuess === normalizedSecret) {
      // 🎉 CORRECT GUESS INTERCEPTED!
      session.correctGuessers.add(playerId);

      const remainingSeconds = Math.max(
        0,
        Math.ceil((session.phaseEndsAt - Date.now()) / 1000)
      );

      // Speed-weighted points: up to 1000 points
      const guesserPoints = Math.round(
        350 + 650 * (remainingSeconds / session.totalDurationSeconds)
      );
      player.score += guesserPoints;

      // Drawer awarded +150 pts per correct guess
      const drawer = room.players[session.currentDrawerId];
      if (drawer) {
        drawer.score += 150;
      }

      await RoomManager.saveRoomState(room);

      // Broadcast celebratory notifications
      io.to(room.code).emit('game:correct_guess', {
        playerId: player.id,
        username: player.username,
        points: guesserPoints
      });

      io.to(room.code).emit('chat:message', {
        id: nanoid(8),
        playerId: 'system',
        username: 'SYSTEM',
        text: `🎉 ${player.username} guessed the secret word! (+${guesserPoints} pts)`,
        isCorrectGuess: true,
        timestamp: Date.now()
      });

      this.broadcastState(room, session, io);

      // Check if all non-drawers have guessed correctly!
      const nonDrawers = Object.values(room.players).filter(
        (p) => p.id !== session.currentDrawerId && p.connectionStatus === 'connected'
      );

      if (session.correctGuessers.size >= nonDrawers.length && nonDrawers.length > 0) {
        console.log('⚡ All players guessed correctly! Concluding drawing round early.');
        TimerService.clearRoomTimer(room.code);
        await this.concludeDrawingRound(room, session, io);
      }

      return { intercepted: true };
    }

    // Normal non-matching guess: broadcast to public chat
    return {
      intercepted: false,
      broadcastMessage: {
        id: nanoid(8),
        playerId: player.id,
        username: player.username,
        text: messageText,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Concludes the round, reveals the word, and calculates score podium.
   */
  private async concludeDrawingRound(
    room: RoomState,
    session: ActiveDrawSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);
    session.phase = 'round_result';

    const scoreUpdates: PlayerScoreUpdate[] = Object.values(room.players).map((p) => ({
      playerId: p.id,
      username: p.username,
      avatar: p.avatar,
      previousScore: p.score,
      roundScoreDelta: 0,
      totalScore: p.score,
      rank: 1
    }));

    scoreUpdates.sort((a, b) => b.totalScore - a.totalScore);
    scoreUpdates.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    this.broadcastState(room, session, io, scoreUpdates);
    io.to(room.code).emit('game:scores-updated', scoreUpdates);

    // 6-second round result display before advancing to next drawer
    setTimeout(async () => {
      session.currentDrawerIndex++;

      // Check if game completed all rounds
      if (session.currentDrawerIndex >= session.drawerOrder.length * (room.config.totalRounds || 3)) {
        session.phase = 'game_over';
        room.status = 'game_over';
        await RoomManager.saveRoomState(room);
        this.broadcastState(room, session, io);
      } else {
        await this.startWordSelection(room, session, io);
      }
    }, 6000);
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

    // Action 1: Drawer selects word
    if (actionType === 'select_word') {
      if (session.phase !== 'word_selection' || session.currentDrawerId !== playerId) {
        throw new Error('NOT_DRAWER_OR_NOT_SELECTION_PHASE');
      }

      const selectedWord = (payload.word || '').trim();
      const matched = DRAW_WORDS.find((w) => w.word.toLowerCase() === selectedWord.toLowerCase());
      const category = matched ? matched.category : 'General';

      TimerService.clearRoomTimer(room.code);
      await this.beginDrawingPhase(room, session, selectedWord, category, io);
      return { success: true };
    }

    // Action 2: Canvas stroke (streamed with volatile)
    if (actionType === 'draw_stroke') {
      if (session.phase !== 'drawing' || session.currentDrawerId !== playerId) {
        return;
      }
      const stroke: DrawStroke = payload;
      session.drawingStrokes.push(stroke);

      // Low-latency volatile broadcast to other 14 players
      io.to(room.code).volatile.emit('draw:stroke', stroke);
      return;
    }

    // Action 3: Clear canvas
    if (actionType === 'draw_clear') {
      if (session.phase !== 'drawing' || session.currentDrawerId !== playerId) return;
      session.drawingStrokes = [];
      io.to(room.code).emit('draw:clear');
      return;
    }

    // Action 4: Undo canvas
    if (actionType === 'draw_undo') {
      if (session.phase !== 'drawing' || session.currentDrawerId !== playerId) return;
      session.drawingStrokes.pop();
      io.to(room.code).emit('draw:undo');
      return;
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

    // If active drawer disconnects, advance immediately
    if (session.currentDrawerId === playerId && session.phase === 'drawing') {
      io.to(room.code).emit('chat:message', {
        id: nanoid(8),
        playerId: 'system',
        username: 'SYSTEM',
        text: '⚠️ Drawer disconnected! Advancing to next round...',
        isSystem: true,
        timestamp: Date.now()
      });
      await this.concludeDrawingRound(room, session, io);
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

    socket.emit('game:state_sync', {
      gameMode: this.gameMode,
      state: this.getPublicGameState(room, playerId)
    });

    // Replay cached strokes to restore canvas on reconnected device
    if (session.drawingStrokes.length > 0) {
      session.drawingStrokes.forEach((st) => {
        socket.emit('draw:stroke', st);
      });
    }
  }

  public getPublicGameState(room: RoomState, forPlayerId?: string): DrawAndGuessPublicState {
    const session = this.sessions.get(room.code);
    if (!session) {
      return {
        phase: 'word_selection',
        currentDrawerId: '',
        currentDrawerUsername: '',
        currentDrawerAvatar: 'cyber_cat',
        wordLength: 0,
        wordMask: '',
        category: '',
        correctGuessers: [],
        phaseEndsAt: 0
      };
    }

    const drawer = room.players[session.currentDrawerId];
    const isDrawer = forPlayerId === session.currentDrawerId;
    const hasGuessed = forPlayerId && session.correctGuessers.has(forPlayerId);
    const isRoundResult = session.phase === 'round_result' || session.phase === 'game_over';

    // Mask the word for non-drawers unless round ended
    const wordMask = session.secretWord
      ? session.secretWord
          .split('')
          .map((char) => (char === ' ' ? '  ' : '_ '))
          .join('')
      : '';

    return {
      phase: session.phase,
      currentDrawerId: session.currentDrawerId,
      currentDrawerUsername: drawer ? drawer.username : 'Unknown',
      currentDrawerAvatar: drawer ? drawer.avatar : 'cyber_cat',
      wordLength: session.secretWord.length,
      wordMask,
      category: session.category,
      secretWord: isDrawer || hasGuessed || isRoundResult ? session.secretWord : undefined,
      wordChoices: isDrawer && session.phase === 'word_selection' ? session.wordChoices : undefined,
      correctGuessers: Array.from(session.correctGuessers),
      phaseEndsAt: session.phaseEndsAt
    };
  }

  private broadcastState(
    room: RoomState,
    _session: ActiveDrawSession,
    io: any,
    roundScoreUpdates?: PlayerScoreUpdate[]
  ): void {
    // Each socket receives customized mask vs full word
    Object.values(room.players).forEach((p) => {
      const socket = io.sockets.sockets.get(p.socketId);
      if (socket) {
        const state = this.getPublicGameState(room, p.id);
        if (roundScoreUpdates) state.roundScoreUpdates = roundScoreUpdates;
        socket.emit('game:state_sync', {
          gameMode: this.gameMode,
          state
        });
      }
    });
  }

  public destroyGame(roomCode: string): void {
    const session = this.sessions.get(roomCode);
    if (session) {
      if (session.wordSelectionTimer) clearTimeout(session.wordSelectionTimer);
      this.sessions.delete(roomCode);
    }
    TimerService.clearRoomTimer(roomCode);
  }
}
