import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  CreateRoomDTO,
  CreateRoomResponse,
  JoinRoomDTO,
  JoinRoomResponse,
  KickPlayerDTO,
  ReconnectDTO,
  ReconnectResponse,
  ServerToClientEvents,
  SetReadyDTO,
  SocketApiResponse,
  UpdateRoomSettingsDTO
} from '@feto-games/shared-types';

export type FetoSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: FetoSocket | null = null;

const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

export const getSocket = (): FetoSocket => {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket] Connected with ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket] Connection error:', err.message);
    });
  }
  return socket;
};

// ==========================================
// Session Reconnect Storage (sessionStorage)
// ==========================================

const SESSION_TOKEN_KEY = 'feto_reconnect_token_';
const SESSION_PLAYER_ID_KEY = 'feto_player_id_';

export const saveReconnectSession = (roomCode: string, token: string, playerId: string): void => {
  if (typeof window === 'undefined') return;
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
// Promise-based Socket Event Invokers
// ==========================================

export const socketCreateRoom = (dto: CreateRoomDTO): Promise<CreateRoomResponse> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    s.emit('room:create', dto, (res: SocketApiResponse<CreateRoomResponse>) => {
      if (res.success) {
        saveReconnectSession(res.data.roomCode, res.data.reconnectToken, res.data.player.id);
        resolve(res.data);
      } else {
        reject(new Error(res.error.message));
      }
    });
  });
};

export const socketJoinRoom = (dto: JoinRoomDTO): Promise<JoinRoomResponse> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    s.emit('room:join', dto, (res: SocketApiResponse<JoinRoomResponse>) => {
      if (res.success) {
        saveReconnectSession(res.data.roomCode, res.data.reconnectToken, res.data.player.id);
        resolve(res.data);
      } else {
        reject(new Error(res.error.message));
      }
    });
  });
};

export const socketReconnectRoom = (dto: ReconnectDTO): Promise<ReconnectResponse> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    s.emit('room:reconnect', dto, (res: SocketApiResponse<ReconnectResponse>) => {
      if (res.success) {
        resolve(res.data);
      } else {
        reject(new Error(res.error.message));
      }
    });
  });
};

export const socketSetReady = (dto: SetReadyDTO): Promise<void> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    s.emit('lobby:set-ready', dto, (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error.message));
    });
  });
};

export const socketUpdateSettings = (dto: UpdateRoomSettingsDTO): Promise<void> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    s.emit('lobby:update-settings', dto, (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error.message));
    });
  });
};

export const socketKickPlayer = (dto: KickPlayerDTO): Promise<void> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    s.emit('lobby:kick-player', dto, (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error.message));
    });
  });
};

export const socketStartGame = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    s.emit('lobby:start-game', (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error.message));
    });
  });
};

export const socketLeaveRoom = (): Promise<void> => {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('room:leave', () => {
      resolve();
    });
  });
};

export const socketSelectTeam = (team: import('@feto-games/shared-types').PlayerTeam): Promise<void> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    s.emit('room:select-team', { team }, (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error?.message || 'Failed to select team'));
    });
  });
};

export const socketRematch = (nextGameMode?: import('@feto-games/shared-types').GameMode): Promise<void> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    s.emit('room:rematch', { nextGameMode }, (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error?.message || 'Failed to rematch'));
    });
  });
};

export const socketSendReaction = (emoji: string): void => {
  const s = getSocket();
  s.emit('reaction:send', { emoji });
};

export const socketQuickPlay = (dto: { username: string; avatar: any }): Promise<{ roomCode: string }> => {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    s.emit('room:quick-play', dto, (res) => {
      if (res && res.success) resolve(res.data);
      else reject(new Error(res.error?.message || 'Quick play failed'));
    });
  });
};

