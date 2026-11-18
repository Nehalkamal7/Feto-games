import { GameMode, RoomState } from '@feto-games/shared-types';

export interface IPartyGameEngine {
  readonly gameMode: GameMode;
  readonly name: string;
  readonly description: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;

  /**
   * Initializes the game session on the server.
   * Sets up roles, word selection, questions, and starts authoritative timers.
   */
  initializeGame(room: RoomState, io: any): Promise<void>;

  /**
   * Handles player input and actions (e.g. clue submission, voting, drawing, answering).
   */
  handlePlayerAction(
    room: RoomState,
    playerId: string,
    actionType: string,
    payload: any,
    io: any
  ): Promise<any>;

  /**
   * Optional hook for games that intercept chat messages (e.g. Draw & Guess).
   */
  handleChatMessage?(
    room: RoomState,
    playerId: string,
    messageText: string,
    io: any
  ): Promise<{ intercepted: boolean; broadcastMessage?: any }>;

  /**
   * Handles player disconnection during active game.
   */
  handlePlayerDisconnect(room: RoomState, playerId: string, io: any): Promise<void>;

  /**
   * Restores player game state upon successful 45s grace reconnection.
   */
  handlePlayerReconnect(room: RoomState, playerId: string, socket: any, io: any): Promise<void>;

  /**
   * Returns sanitized public game state for broadcasting to clients.
   */
  getPublicGameState(room: RoomState, forPlayerId?: string): any;

  /**
   * Cleans up timers, intervals, and memory associated with the room.
   */
  destroyGame(roomCode: string): void;
}
