import { NeonAvatarId } from './player';

export type GamePhase =
  | 'idle'
  | 'countdown'
  | 'role_distribution'
  | 'question_prompt'
  | 'player_answering'
  | 'player_voting'
  | 'round_reveal'
  | 'round_leaderboard'
  | 'game_over'
  | 'word_selection'
  | 'drawing'
  | 'clue_giving'
  | 'imposter_sudden_death';

export interface SecretRolePayload {
  playerId: string;
  roleTitle: string;
  roleDescription: string;
  isImposter?: boolean;
  secretWord?: string;
  team?: 'civilians' | 'imposters' | 'anarchists';
}

export interface TimerTickPayload {
  remainingSeconds: number;
  totalDurationSeconds: number;
  phase: GamePhase;
  round: number;
}

export interface GamePhaseChangePayload {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  durationSeconds: number;
  phaseEndsAt?: number;
  prompt?: {
    id: string;
    question: string;
    category?: string;
    options?: string[]; // for trivia/voting
    imageUrl?: string;
  };
}

export interface PlayerScoreUpdate {
  playerId: string;
  username: string;
  avatar: NeonAvatarId;
  previousScore: number;
  roundScoreDelta: number;
  totalScore: number;
  rank: number;
}

export interface GameResultsPayload {
  roomCode: string;
  winner: PlayerScoreUpdate;
  podium: PlayerScoreUpdate[];
  leaderboard: PlayerScoreUpdate[];
  mvpTitle: string;
  mvpPlayerId: string;
  totalRounds: number;
}

// ========================================================
// GAME A: WHO IS THE IMPOSTER? (Social Deduction, 3-15 players)
// ========================================================

export type ImposterRole = 'civilian' | 'imposter';

export interface PrivateRolePayload {
  role: ImposterRole;
  category: string;
  secretWord?: string; // STRICTLY excluded for imposters
  imposterCount: number;
  teammateNames?: string[]; // Names of fellow imposters if > 1
}

export interface ClueSubmission {
  playerId: string;
  username: string;
  avatar: NeonAvatarId;
  clue: string;
  submittedAt: number;
}

export interface VoteTally {
  targetPlayerId: string;
  targetUsername: string;
  votesCount: number;
  voters: { playerId: string; username: string }[];
}

export interface ImposterPublicState {
  phase: 'role_reveal' | 'clue_giving' | 'voting' | 'imposter_sudden_death' | 'round_result' | 'game_over';
  category: string;
  currentTurnPlayerId?: string;
  currentTurnUsername?: string;
  turnOrder: string[]; // array of playerIds
  clues: Record<string, ClueSubmission>;
  votes: Record<string, string>; // voterId -> targetPlayerId
  voteTallies: Record<string, number>; // targetPlayerId -> count
  caughtImposterIds: string[];
  suddenDeathActive: boolean;
  suddenDeathPlayerId?: string;
  suddenDeathPlayerUsername?: string;
  suddenDeathEndsAt?: number;
  revealedWord?: string; // Only populated at round_result
  impostersWon?: boolean;
  imposterList?: { id: string; username: string; role: ImposterRole }[];
  roundScoreUpdates?: PlayerScoreUpdate[];
}

// ========================================================
// GAME B: DRAW & GUESS (Drawing & Guessing, 2-15 players)
// ========================================================

export interface DrawStroke {
  prevX: number;
  prevY: number;
  currX: number;
  currY: number;
  color: string;
  brushSize: number;
  isEraser: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  text: string;
  isCorrectGuess?: boolean;
  isSystem?: boolean;
  timestamp: number;
}

export interface DrawAndGuessPublicState {
  phase: 'word_selection' | 'drawing' | 'round_result' | 'game_over';
  currentDrawerId: string;
  currentDrawerUsername: string;
  currentDrawerAvatar: NeonAvatarId;
  wordLength: number;
  wordMask: string; // e.g. "_ _ _ _ _"
  category: string;
  secretWord?: string; // Only sent to drawer during drawing, and everyone at round_result
  wordChoices?: string[]; // Sent privately to drawer during word_selection
  correctGuessers: string[]; // List of playerIds who already guessed
  phaseEndsAt: number;
  roundScoreUpdates?: PlayerScoreUpdate[];
}

// ========================================================
// GAME C: QUIZ BATTLE (Speed Trivia, 2-15 players)
// ========================================================

export interface QuizQuestionItem {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: [string, string, string, string];
  correctIndex: number; // Server-authoritative only
}

export interface QuizPublicQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: [string, string, string, string];
  phaseEndsAt: number;
  durationSeconds: number;
}

export interface QuizPublicState {
  phase: 'question' | 'reveal' | 'leaderboard' | 'game_over';
  questionNumber: number;
  totalQuestions: number;
  currentQuestion?: QuizPublicQuestion;
  answeredPlayerIds: string[];
  totalActivePlayers: number;
  correctAnswerIndex?: number; // Only revealed during 'reveal' phase
  roundScoreUpdates?: PlayerScoreUpdate[];
}

// ========================================================
// GAME D: WORD BATTLE (Speed Word Race, 2-15 players)
// ========================================================

export interface WordBattleSubmission {
  playerId: string;
  username: string;
  avatar: NeonAvatarId;
  word: string;
  points: number;
  submittedAt: number;
}

export interface WordBattlePublicState {
  phase: 'starting' | 'word_racing' | 'round_results' | 'game_over';
  round: number;
  totalRounds: number;
  category: string;
  startingLetter: string;
  claimedWords: string[];
  recentSubmissions: WordBattleSubmission[];
  scores: Record<string, number>;
  playerWordCounts: Record<string, number>;
  phaseEndsAt: number;
  remainingSeconds: number;
}

// ========================================================
// GAME E: TRUTH OR DARE (Party Roulette & Voting, 2-15 players)
// ========================================================

export type TodIntensityMode = 'chill' | 'party' | 'wild';
export type TodPhase =
  | 'roulette'
  | 'decision'
  | 'performing'
  | 'voting'
  | 'round_results'
  | 'game_over';

export interface TruthOrDareItem {
  id: string;
  type: 'truth' | 'dare';
  intensity: TodIntensityMode;
  prompt: string;
}

export interface TruthOrDarePublicState {
  phase: TodPhase;
  round: number;
  totalRounds: number;
  targetPlayerId: string;
  targetUsername: string;
  targetAvatar: NeonAvatarId;
  intensity: TodIntensityMode;
  chosenType?: 'truth' | 'dare';
  currentPrompt?: string;
  votes: Record<string, 'completed' | 'refused'>;
  voteTallies: { completed: number; refused: number };
  scores: Record<string, number>;
  phaseEndsAt: number;
  remainingSeconds: number;
}

// ========================================================
// GAME F: NEVER HAVE I EVER (Party Confessions, 3-15 players)
// ========================================================

export interface NeverHaveIEverItem {
  id: string;
  statement: string;
  category: string;
}

export type NhiePhase = 'statement' | 'reveal' | 'round_results' | 'game_over';

export interface NeverHaveIEverPublicState {
  phase: NhiePhase;
  round: number;
  totalRounds: number;
  statement: string;
  category: string;
  innocencePoints: Record<string, number>;
  roundChoices: Record<string, 'have' | 'havenot'>;
  stats?: {
    haveCount: number;
    haveNotCount: number;
    totalVoted: number;
    havePercentage: number;
  };
  phaseEndsAt: number;
  remainingSeconds: number;
}

