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
  categoryAr?: string;
  secretWord?: string; // STRICTLY excluded for imposters
  secretWordAr?: string;
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
  round?: number;
  totalRounds?: number;
  phaseEndsAt?: number;
  category: string;
  categoryAr?: string;
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
  revealedWordAr?: string;
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
  categoryAr?: string;
  secretWord?: string; // Only sent to drawer during drawing, and everyone at round_result
  secretWordAr?: string;
  wordChoices?: string[]; // Sent privately to drawer during word_selection
  wordChoicesAr?: string[];
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
  questionAr?: string;
  category: string;
  categoryAr?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: [string, string, string, string];
  optionsAr?: [string, string, string, string];
  correctIndex: number; // Server-authoritative only
}

export interface QuizPublicQuestion {
  id: string;
  question: string;
  questionAr?: string;
  category: string;
  categoryAr?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: [string, string, string, string];
  optionsAr?: [string, string, string, string];
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
  categoryAr?: string;
  startingLetter: string;
  startingLetterAr?: string;
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
  promptAr?: string;
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
  currentPromptAr?: string;
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
  statementAr?: string;
  category: string;
  categoryAr?: string;
}

export type NhiePhase = 'statement' | 'reveal' | 'round_results' | 'game_over';

export interface NeverHaveIEverPublicState {
  phase: NhiePhase;
  round: number;
  totalRounds: number;
  statement: string;
  statementAr?: string;
  category: string;
  categoryAr?: string;
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

// ========================================================
// GAME G: MOST LIKELY TO... (Live Voting & Roasts, 2-15 players)
// ========================================================

export type MostLikelyToPhase = 'voting' | 'reveal' | 'penalty' | 'round_results' | 'game_over';

export interface MostLikelyToPromptItem {
  id: string;
  prompt: string;
  promptAr?: string;
  category: string;
  categoryAr?: string;
  penaltyDare: string;
  penaltyDareAr?: string;
}

export interface MostLikelyToPublicState {
  phase: MostLikelyToPhase;
  round: number;
  totalRounds: number;
  prompt: string;
  promptAr?: string;
  category: string;
  categoryAr?: string;
  penaltyDare: string;
  penaltyDareAr?: string;
  votes: Record<string, string>; // voterId -> targetPlayerId
  voteTallies: Record<string, number>; // targetPlayerId -> count
  votedOutPlayerId?: string;
  votedOutUsername?: string;
  votedOutAvatar?: NeonAvatarId;
  roastMessage?: string;
  roastMessageAr?: string;
  phaseEndsAt: number;
  remainingSeconds: number;
}

// ========================================================
// GAME H: SIP OR SPILL (Confessions vs Sips, 2-15 players)
// ========================================================

export type SipOrSpillPhase = 'dilemma' | 'answer_or_sip' | 'reaction' | 'round_results' | 'game_over';

export interface SipOrSpillItem {
  id: string;
  dilemma: string;
  dilemmaAr?: string;
  question: string;
  questionAr?: string;
  spicyLevel: 1 | 2 | 3;
}

export interface SipOrSpillPublicState {
  phase: SipOrSpillPhase;
  round: number;
  totalRounds: number;
  targetPlayerId: string;
  targetUsername: string;
  targetAvatar: NeonAvatarId;
  dilemma: string;
  dilemmaAr?: string;
  question: string;
  questionAr?: string;
  spicyLevel: number;
  chosenAction?: 'spill' | 'sip';
  confessionText?: string;
  reactions: Record<string, string>; // playerId -> emoji
  phaseEndsAt: number;
  remainingSeconds: number;
}

// ========================================================
// GAME I: SILLY ROULETTE / SPIN THE CHAOS (2-15 players)
// ========================================================

export type SillyRoulettePhase = 'spinning' | 'challenge' | 'voting' | 'round_results' | 'game_over';

export interface SillyChallengeItem {
  id: string;
  title: string;
  titleAr?: string;
  challenge: string;
  challengeAr?: string;
  category: 'physical' | 'vocal' | 'acting' | 'absurd';
  timeSeconds: number;
}

export interface SillyRoulettePublicState {
  phase: SillyRoulettePhase;
  round: number;
  totalRounds: number;
  targetPlayerId: string;
  targetUsername: string;
  targetAvatar: NeonAvatarId;
  challengeTitle: string;
  challengeTitleAr?: string;
  challengeText: string;
  challengeTextAr?: string;
  challengeCategory: string;
  targetAngle: number; // Synchronized roulette rotation angle
  isSpinning: boolean;
  votes: Record<string, 'nailed_it' | 'shame_penalty'>;
  voteTallies: { nailed_it: number; shame_penalty: number };
  phaseEndsAt: number;
  remainingSeconds: number;
}

// ========================================================
// GAME J: HOT POTATO / BOMB PASS (Fast Typing Panic, 2-15 players)
// ========================================================

export type HotPotatoPhase = 'bomb_ticking' | 'exploded' | 'penalty_round' | 'round_results' | 'game_over';

export interface HotPotatoCategoryItem {
  id: string;
  category: string;
  categoryAr?: string;
  goofyConsequence: string;
  goofyConsequenceAr?: string;
}

export interface HotPotatoPublicState {
  phase: HotPotatoPhase;
  round: number;
  totalRounds: number;
  activeHolderId: string;
  activeHolderUsername: string;
  activeHolderAvatar: NeonAvatarId;
  category: string;
  categoryAr?: string;
  goofyConsequence: string;
  goofyConsequenceAr?: string;
  passCount: number;
  recentWords: string[];
  bombTimerRemainingMs: number; // Dynamic fuse timer
  explodedPlayerId?: string;
  explodedUsername?: string;
  phaseEndsAt: number;
  remainingSeconds: number;
}

// ========================================================
// PARTY SPECIAL AWARDS & MVP
// ========================================================

export interface PartyAward {
  id: string;
  title: string; // e.g. "The Certified Liar", "Picasso From Wish 🎨", "Sip Champion 🥤"
  description: string;
  recipientId: string;
  recipientUsername: string;
  recipientAvatar: NeonAvatarId;
  badgeIcon: string;
  scoreOrStat: string;
  thumbnail?: string; // Optional saved drawing thumbnail for Hall of Shame
}


