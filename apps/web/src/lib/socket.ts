import {
  ClientToServerEvents,
  CreateRoomDTO,
  CreateRoomResponse,
  GameMode,
  JoinRoomDTO,
  JoinRoomResponse,
  KickPlayerDTO,
  PlayerSummary,
  PlayerTeam,
  PublicRoomState,
  ReconnectDTO,
  ReconnectResponse,
  ServerToClientEvents,
  SetReadyDTO,
  UpdateRoomSettingsDTO
} from '@feto-games/shared-types';
import { getAblyRealtime, publishDirectToChannel } from './ably-client';

export const SOCKET_URL = '';
export const BACKEND_URL = '';

// ==========================================
// Session Reconnect Storage (sessionStorage)
// ==========================================

const SESSION_TOKEN_KEY = 'feto_reconnect_token_';
const SESSION_PLAYER_ID_KEY = 'feto_player_id_';
let activeRoomCode: string = '';
let activePlayerId: string = '';

export const saveReconnectSession = (roomCode: string, token: string, playerId: string): void => {
  if (typeof window === 'undefined') return;
  activeRoomCode = roomCode.toUpperCase();
  activePlayerId = playerId;
  try {
    sessionStorage.setItem(`${SESSION_TOKEN_KEY}${roomCode.toUpperCase()}`, token);
    sessionStorage.setItem(`${SESSION_PLAYER_ID_KEY}${roomCode.toUpperCase()}`, playerId);
  } catch (err) {
    console.error('Failed to save session token in sessionStorage:', err);
  }
};

export const getReconnectToken = (roomCode: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(`${SESSION_TOKEN_KEY}${roomCode.toUpperCase()}`);
  } catch {
    return null;
  }
};

export const getSavedPlayerId = (roomCode: string): string | null => {
  if (typeof window === 'undefined') return activePlayerId || null;
  try {
    return sessionStorage.getItem(`${SESSION_PLAYER_ID_KEY}${roomCode.toUpperCase()}`) || activePlayerId || null;
  } catch {
    return activePlayerId || null;
  }
};

export const clearReconnectSession = (roomCode: string): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`${SESSION_TOKEN_KEY}${roomCode.toUpperCase()}`);
    sessionStorage.removeItem(`${SESSION_PLAYER_ID_KEY}${roomCode.toUpperCase()}`);
  } catch (err) {
    console.error('Failed to clear session token:', err);
  }
};

// ==========================================
// Serverless REST Room Invocations
// ==========================================

export async function socketCreateRoom(dto: CreateRoomDTO): Promise<CreateRoomResponse> {
  const res = await fetch('/api/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto)
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Failed to create room.');
  }

  saveReconnectSession(json.data.roomCode, json.data.reconnectToken, json.data.player.id);
  getSocket().bindRoom(json.data.roomCode, json.data.player.id);

  return json.data;
}

export async function socketJoinRoom(dto: JoinRoomDTO): Promise<JoinRoomResponse> {
  const res = await fetch('/api/rooms/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto)
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Failed to join room.');
  }

  saveReconnectSession(json.data.roomCode, json.data.reconnectToken, json.data.player.id);
  getSocket().bindRoom(json.data.roomCode, json.data.player.id);

  return json.data;
}

export async function socketReconnectRoom(dto: ReconnectDTO): Promise<ReconnectResponse> {
  // Extract roomCode from URL if possible or activeRoomCode
  const roomCodeMatch = typeof window !== 'undefined' ? window.location.pathname.match(/\/room\/([a-zA-Z0-9_-]+)/) : null;
  const roomCode = roomCodeMatch ? roomCodeMatch[1].toUpperCase() : activeRoomCode;
  const playerId = getSavedPlayerId(roomCode);

  const res = await fetch('/api/rooms/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode,
      username: typeof window !== 'undefined' ? localStorage.getItem('feto_username') || 'Player' : 'Player',
      avatar: typeof window !== 'undefined' ? localStorage.getItem('feto_avatar') || 'cyber_cat' : 'cyber_cat'
    })
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'Failed to reconnect.');
  }

  getSocket().bindRoom(roomCode, playerId || json.data.player.id);

  return {
    roomCode,
    room: json.data.room,
    player: json.data.player,
    gameState: null
  };
}

export async function socketSetReady(dto: SetReadyDTO): Promise<void> {
  const roomCode = getActiveRoomCode();
  const playerId = getSavedPlayerId(roomCode);
  if (!playerId) return;

  const res = await fetch('/api/game/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode,
      playerId,
      actionType: 'TOGGLE_READY',
      payload: dto
    })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to toggle ready');
}

export async function socketUpdateSettings(dto: UpdateRoomSettingsDTO): Promise<void> {
  const roomCode = getActiveRoomCode();
  const playerId = getSavedPlayerId(roomCode);
  if (!playerId) return;

  const res = await fetch('/api/game/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode,
      playerId,
      actionType: 'UPDATE_SETTINGS',
      payload: (dto as any).config || dto
    })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to update settings');
}

export async function socketKickPlayer(dto: KickPlayerDTO): Promise<void> {
  const roomCode = getActiveRoomCode();
  const playerId = getSavedPlayerId(roomCode);
  if (!playerId) return;

  const res = await fetch('/api/game/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode,
      playerId,
      actionType: 'KICK_PLAYER',
      payload: { targetPlayerId: (dto as any).targetPlayerId || (dto as any).playerId }
    })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to kick player');
}

export async function socketStartGame(): Promise<void> {
  const roomCode = getActiveRoomCode();
  const playerId = getSavedPlayerId(roomCode);
  if (!playerId) return;

  const res = await fetch('/api/game/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode,
      playerId,
      actionType: 'START_GAME'
    })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to start game');
}

export async function socketLeaveRoom(): Promise<void> {
  const roomCode = getActiveRoomCode();
  const playerId = getSavedPlayerId(roomCode);
  if (!roomCode || !playerId) return;

  await fetch('/api/rooms/leave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, playerId })
  });
}

export async function socketSelectTeam(team: PlayerTeam): Promise<void> {
  const roomCode = getActiveRoomCode();
  const playerId = getSavedPlayerId(roomCode);
  if (!playerId) return;

  const res = await fetch('/api/game/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode,
      playerId,
      actionType: 'SELECT_TEAM',
      payload: { team }
    })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to select team');
}

export async function socketRematch(nextGameMode?: GameMode): Promise<void> {
  const roomCode = getActiveRoomCode();
  const playerId = getSavedPlayerId(roomCode);
  if (!playerId) return;

  const res = await fetch('/api/game/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode,
      playerId,
      actionType: 'REMATCH',
      payload: { nextGameMode }
    })
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to rematch');
}

export async function socketSendReaction(emoji: string): Promise<void> {
  const roomCode = getActiveRoomCode();
  const playerId = getSavedPlayerId(roomCode);
  if (!playerId) return;

  await fetch('/api/game/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomCode,
      playerId,
      actionType: 'EMOJI_REACTION',
      payload: { emoji }
    })
  });
}

export async function socketQuickPlay(dto: { username: string; avatar: any }): Promise<{ roomCode: string }> {
  try {
    const listRes = await fetch('/api/rooms/public');
    const listData = await listRes.json();
    if (listData.success && listData.data?.rooms?.length > 0) {
      const available = listData.data.rooms.find((r: any) => !r.hasPin && (r.playerCount || 1) < (r.maxPlayers || 15));
      if (available) {
        const joinRes = await socketJoinRoom({
          roomCode: available.code,
          username: dto.username,
          avatar: dto.avatar
        });
        return { roomCode: joinRes.roomCode };
      }
    }
  } catch {
    // fallback to creating new room
  }

  const createRes = await socketCreateRoom({
    username: dto.username,
    avatar: dto.avatar,
    isPrivate: false,
    maxPlayers: 15,
    gameMode: 'who_is_imposter'
  });

  return { roomCode: createRes.roomCode };
}

function getActiveRoomCode(): string {
  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/\/room\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1].toUpperCase();
  }
  return activeRoomCode;
}

// ==========================================
// Ably Realtime Event Bridge
// ==========================================

class AblySocketBridge {
  public connected: boolean = true;
  public id: string = `client_${Math.random().toString(36).substring(2, 9)}`;
  private listeners: Map<string, Set<Function>> = new Map();
  private boundRoomCode: string = '';
  private boundPlayerId: string = '';
  private isSubscribed: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const code = getActiveRoomCode();
        const pid = getSavedPlayerId(code);
        if (code) this.bindRoom(code, pid || undefined);
      }, 100);
    }
  }

  public bindRoom(roomCode: string, playerId?: string) {
    const normalized = roomCode.toUpperCase().trim();
    if (this.boundRoomCode === normalized && this.isSubscribed && playerId === this.boundPlayerId) {
      return;
    }

    this.boundRoomCode = normalized;
    if (playerId) this.boundPlayerId = playerId;

    const ably = getAblyRealtime(playerId || this.boundPlayerId || undefined);
    if (!ably) return;

    const roomChannel = ably.channels.get(`feto:room:${normalized}`);

    // Subscribe to all public events
    roomChannel.subscribe((msg: any) => {
      this.dispatch(msg.name, msg.data);
    });

    if (playerId || this.boundPlayerId) {
      const pChannel = ably.channels.get(`feto:player:${playerId || this.boundPlayerId}`);
      pChannel.subscribe((msg: any) => {
        this.dispatch(msg.name, msg.data);
      });
    }

    this.isSubscribed = true;
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return this;
  }

  public off(event: string, callback: Function) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback);
    }
    return this;
  }

  public dispatch(event: string, data: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in socket listener for ${event}:`, err);
        }
      });
    }
  }

  public connect() {
    this.connected = true;
    const code = getActiveRoomCode();
    const pid = getSavedPlayerId(code);
    if (code) this.bindRoom(code, pid || undefined);
    return this;
  }

  public disconnect() {
    this.connected = false;
    return this;
  }

  /**
   * Translates socket.emit() calls into direct Ably broadcasts (for canvas strokes)
   * or serverless API dispatches (for server-authoritative game actions).
   */
  public emit(event: string, ...args: any[]) {
    const payload = args[0];
    const callback = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null;

    const roomCode = getActiveRoomCode();
    const playerId = getSavedPlayerId(roomCode);

    // 1. High-frequency canvas strokes: Direct Ably Realtime broadcast (<30ms global latency)
    if (event === 'draw:stroke') {
      publishDirectToChannel(`feto:room:${roomCode}`, 'draw:stroke', payload);
      if (callback) callback({ success: true });
      return;
    }

    if (event === 'draw:clear') {
      publishDirectToChannel(`feto:room:${roomCode}`, 'draw:clear', {});
      if (callback) callback({ success: true });
      return;
    }

    if (event === 'draw:undo') {
      publishDirectToChannel(`feto:room:${roomCode}`, 'draw:undo', {});
      if (callback) callback({ success: true });
      return;
    }

    // 2. Server-Authoritative Game Actions
    let actionType: string | null = null;
    let actionPayload: any = payload;

    switch (event) {
      case 'imposter:submit_clue':
        actionType = 'SUBMIT_CLUE';
        break;
      case 'imposter:cast_vote':
        actionType = 'SUBMIT_VOTE';
        break;
      case 'imposter:sudden_death_guess':
        actionType = 'GUESS_WORD';
        actionPayload = { guess: payload?.guessedWord };
        break;
      case 'chat:send':
        actionType = 'GUESS_WORD';
        actionPayload = { guess: payload?.message };
        break;
      case 'draw:select_word':
        actionType = 'GUESS_WORD';
        break;
      case 'quiz:submit_answer':
        actionType = 'SUBMIT_ANSWER';
        break;
      case 'word_battle:submit_word':
        actionType = 'SUBMIT_WORD';
        break;
      case 'tod:choose_type':
        actionType = 'TOD_VOTE';
        actionPayload = { choice: payload?.choice };
        break;
      case 'tod:complete_action':
        actionType = 'TOD_VOTE';
        actionPayload = { action: 'completed' };
        break;
      case 'tod:vote':
        actionType = 'TOD_VOTE';
        actionPayload = { vote: payload?.vote };
        break;
      case 'nhie:submit_choice':
        actionType = 'NHIE_CHOICE';
        actionPayload = { choice: payload?.choice };
        break;
      case 'reaction:send':
        actionType = 'EMOJI_REACTION';
        break;
      case 'lobby:set-ready':
        actionType = 'TOGGLE_READY';
        break;
      case 'lobby:start-game':
        actionType = 'START_GAME';
        break;
      case 'lobby:update-settings':
        actionType = 'UPDATE_SETTINGS';
        actionPayload = payload?.config;
        break;
      case 'lobby:kick-player':
        actionType = 'KICK_PLAYER';
        actionPayload = { targetPlayerId: payload?.playerId };
        break;
      case 'room:select-team':
        actionType = 'SELECT_TEAM';
        break;
      case 'room:rematch':
        actionType = 'REMATCH';
        break;
    }

    if (actionType && roomCode && playerId) {
      fetch('/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          playerId,
          actionType,
          payload: actionPayload
        })
      })
        .then((res) => res.json())
        .then((res) => {
          if (callback) callback(res);
        })
        .catch((err) => {
          if (callback) callback({ success: false, error: { message: err.message } });
        });
    } else if (callback) {
      callback({ success: true });
    }
  }
}

let socketBridgeInstance: AblySocketBridge | null = null;

export const getSocket = (): any => {
  if (!socketBridgeInstance) {
    socketBridgeInstance = new AblySocketBridge();
  }
  return socketBridgeInstance;
};

export type FetoSocket = any;
