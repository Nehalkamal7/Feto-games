import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GameMode,
  PlayerScoreUpdate,
  QuizPublicQuestion,
  QuizPublicState,
  QuizQuestionItem,
  RoomState
} from '@feto-games/shared-types';
import { IPartyGameEngine } from '../engine/IPartyGameEngine.js';
import { RoomManager } from '../../services/roomManager.js';
import { TimerService } from '../../services/timerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const quizDataPath = path.resolve(__dirname, '../data/quizQuestions.json');
const QUIZ_QUESTIONS: QuizQuestionItem[] = JSON.parse(
  readFileSync(quizDataPath, 'utf-8')
);

interface ActiveQuizSession {
  roomCode: string;
  questions: QuizQuestionItem[];
  currentQuestionIndex: number;
  phase: 'question' | 'reveal' | 'leaderboard' | 'game_over';
  phaseEndsAt: number;
  durationSeconds: number;
  answers: Map<
    string,
    {
      optionIndex: number;
      isCorrect: boolean;
      points: number;
      answeredAt: number;
    }
  >;
}

export class QuizBattleEngine implements IPartyGameEngine {
  public readonly gameMode: GameMode = 'quiz_battle';
  public readonly name = 'Quiz Battle';
  public readonly description = 'Simultaneous competitive speed trivia across categories!';
  public readonly minPlayers = 2;
  public readonly maxPlayers = 15;

  private sessions = new Map<string, ActiveQuizSession>();

  public async initializeGame(room: RoomState, io: any): Promise<void> {
    const players = Object.values(room.players).filter(
      (p) => p.connectionStatus === 'connected'
    );

    if (players.length < this.minPlayers) {
      throw new Error(`At least ${this.minPlayers} players are required.`);
    }

    const totalQuestions = room.config.totalRounds || 5;

    // Pick random non-repeating questions
    const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, Math.min(totalQuestions, QUIZ_QUESTIONS.length));

    const session: ActiveQuizSession = {
      roomCode: room.code,
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      phase: 'question',
      phaseEndsAt: 0,
      durationSeconds: room.config.roundDurationSeconds || 15,
      answers: new Map()
    };

    this.sessions.set(room.code, session);
    room.status = 'in_game';
    await RoomManager.saveRoomState(room);

    await this.startQuestion(room, session, io);
  }

  /**
   * Starts a question round with server-authoritative timestamps.
   */
  private async startQuestion(
    room: RoomState,
    session: ActiveQuizSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);

    const question = session.questions[session.currentQuestionIndex];
    if (!question) {
      await this.concludeGame(room, session, io);
      return;
    }

    session.phase = 'question';
    session.answers.clear();
    const duration = session.durationSeconds;
    session.phaseEndsAt = Date.now() + duration * 1000;

    room.currentRound = session.currentQuestionIndex + 1;
    await RoomManager.saveRoomState(room);

    this.broadcastState(room, session, io);

    // Authoritative countdown timer with 1s ticks
    TimerService.startRoundTimer(
      io,
      room.code,
      duration,
      'question_prompt',
      room.currentRound,
      async () => {
        console.log(`⏰ Time up for question ${room.currentRound} in room ${room.code}`);
        await this.revealAnswer(room, session, io);
      }
    );
  }

  /**
   * Reveals correct answer and awards speed-weighted scores.
   */
  private async revealAnswer(
    room: RoomState,
    session: ActiveQuizSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);
    session.phase = 'reveal';

    const question = session.questions[session.currentQuestionIndex];
    const scoreUpdates: PlayerScoreUpdate[] = [];

    // Award scores
    Object.values(room.players).forEach((p) => {
      const answer = session.answers.get(p.id);
      const delta = answer?.points || 0;
      const prev = p.score;
      p.score += delta;

      scoreUpdates.push({
        playerId: p.id,
        username: p.username,
        avatar: p.avatar,
        previousScore: prev,
        roundScoreDelta: delta,
        totalScore: p.score,
        rank: 1
      });
    });

    scoreUpdates.sort((a, b) => b.totalScore - a.totalScore);
    scoreUpdates.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    await RoomManager.saveRoomState(room);

    this.broadcastState(room, session, io, question.correctIndex, scoreUpdates);
    io.to(room.code).emit('game:scores-updated', scoreUpdates);

    // Reveal duration: 4 seconds before advancing
    setTimeout(async () => {
      await this.showLeaderboard(room, session, io, scoreUpdates);
    }, 4000);
  }

  /**
   * Shows animated leaderboard between rounds.
   */
  private async showLeaderboard(
    room: RoomState,
    session: ActiveQuizSession,
    io: any,
    scoreUpdates: PlayerScoreUpdate[]
  ): Promise<void> {
    session.phase = 'leaderboard';
    this.broadcastState(room, session, io, undefined, scoreUpdates);

    setTimeout(async () => {
      session.currentQuestionIndex++;
      if (session.currentQuestionIndex >= session.questions.length) {
        await this.concludeGame(room, session, io);
      } else {
        await this.startQuestion(room, session, io);
      }
    }, 4000);
  }

  /**
   * Concludes the game, announces podium winners.
   */
  private async concludeGame(
    room: RoomState,
    session: ActiveQuizSession,
    io: any
  ): Promise<void> {
    TimerService.clearRoomTimer(room.code);
    session.phase = 'game_over';
    room.status = 'game_over';
    await RoomManager.saveRoomState(room);

    const scores = Object.values(room.players)
      .map((p) => ({
        playerId: p.id,
        username: p.username,
        avatar: p.avatar,
        previousScore: p.score,
        roundScoreDelta: 0,
        totalScore: p.score,
        rank: 1
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    scores.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    this.broadcastState(room, session, io, undefined, scores);

    io.to(room.code).emit('game:ended', {
      roomCode: room.code,
      winner: scores[0],
      podium: scores.slice(0, 3),
      leaderboard: scores,
      mvpTitle: 'Trivia Grandmaster',
      mvpPlayerId: scores[0]?.playerId || '',
      totalRounds: session.questions.length
    });
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

    if (actionType === 'submit_answer') {
      if (session.phase !== 'question') {
        throw new Error('NOT_IN_QUESTION_PHASE');
      }

      // Prevent duplicate answers
      if (session.answers.has(playerId)) {
        throw new Error('ALREADY_ANSWERED');
      }

      const optionIndex = Number(payload.optionIndex);
      if (isNaN(optionIndex) || optionIndex < 0 || optionIndex > 3) {
        throw new Error('INVALID_OPTION_INDEX');
      }

      const question = session.questions[session.currentQuestionIndex];
      const isCorrect = optionIndex === question.correctIndex;

      // Speed-weighted score calculation
      const remainingMs = Math.max(0, session.phaseEndsAt - Date.now());
      const speedMultiplier = remainingMs / (session.durationSeconds * 1000);
      const points = isCorrect ? Math.round(500 + 500 * speedMultiplier) : 0;

      session.answers.set(playerId, {
        optionIndex,
        isCorrect,
        points,
        answeredAt: Date.now()
      });

      this.broadcastState(room, session, io);

      // Check if all active connected players have submitted their answer
      const connectedCount = Object.values(room.players).filter(
        (p) => p.connectionStatus === 'connected'
      ).length;

      if (session.answers.size >= connectedCount) {
        console.log('⚡ All players answered! Revealing answer immediately.');
        await this.revealAnswer(room, session, io);
      }

      return { success: true, answered: true };
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

    // Check if remaining players have all answered
    if (session.phase === 'question') {
      const connectedCount = Object.values(room.players).filter(
        (p) => p.connectionStatus === 'connected' && p.id !== playerId
      ).length;

      if (session.answers.size >= connectedCount && connectedCount > 0) {
        await this.revealAnswer(room, session, io);
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

    socket.emit('game:state_sync', {
      gameMode: this.gameMode,
      state: this.getPublicGameState(room, playerId)
    });
  }

  public getPublicGameState(room: RoomState, _forPlayerId?: string): QuizPublicState {
    const session = this.sessions.get(room.code);
    if (!session) {
      return {
        phase: 'question',
        questionNumber: 1,
        totalQuestions: 5,
        answeredPlayerIds: [],
        totalActivePlayers: 0
      };
    }

    const question = session.questions[session.currentQuestionIndex];
    let publicQuestion: QuizPublicQuestion | undefined;

    if (question) {
      publicQuestion = {
        id: question.id,
        question: question.question,
        category: question.category,
        difficulty: question.difficulty,
        options: question.options,
        phaseEndsAt: session.phaseEndsAt,
        durationSeconds: session.durationSeconds
      };
    }

    const connectedPlayers = Object.values(room.players).filter(
      (p) => p.connectionStatus === 'connected'
    );

    return {
      phase: session.phase,
      questionNumber: session.currentQuestionIndex + 1,
      totalQuestions: session.questions.length,
      currentQuestion: publicQuestion,
      answeredPlayerIds: Array.from(session.answers.keys()),
      totalActivePlayers: connectedPlayers.length,
      correctAnswerIndex: session.phase === 'reveal' ? question?.correctIndex : undefined
    };
  }

  private broadcastState(
    room: RoomState,
    session: ActiveQuizSession,
    io: any,
    correctAnswerIndex?: number,
    roundScoreUpdates?: PlayerScoreUpdate[]
  ): void {
    const state = this.getPublicGameState(room);
    if (correctAnswerIndex !== undefined) state.correctAnswerIndex = correctAnswerIndex;
    if (roundScoreUpdates) state.roundScoreUpdates = roundScoreUpdates;

    io.to(room.code).emit('game:state_sync', {
      gameMode: this.gameMode,
      state
    });
  }

  public destroyGame(roomCode: string): void {
    this.sessions.delete(roomCode);
    TimerService.clearRoomTimer(roomCode);
  }
}
