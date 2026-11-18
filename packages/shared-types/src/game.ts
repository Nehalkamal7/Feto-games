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
  | 'game_over';

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
