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
let lastSocketError: string | null = null;

// Standalone Socket.IO backend URL configured via NEXT_PUBLIC_SOCKET_URL
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  'http://localhost:4000';

export const BACKEND_URL = SOCKET_URL;

/**
 * Initializes and returns the singleton Socket.IO client instance.
 * Transports are configured for persistent WebSocket with polling fallback,
 * credentials enabled for cross-origin Vercel-to-backend deployments.
 */
export const getSocket = (): FetoSocket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    socket.on('connect', () => {
      lastSocketError = null;
      console.log(`⚡ [Socket.IO] Connected to backend at ${SOCKET_URL} (ID: ${socket?.id})`);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Socket.IO] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      lastSocketError = err.message;
      console.warn(`⚠️ [Socket.IO] Connection error to ${SOCKET_URL}:`, err.message);
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
// Timeout Guard for Socket Calls
// ==========================================

const SOCKET_OP_TIMEOUT_MS = 8000;

/**
 * Wraps a Socket.IO acknowledgement call with an 8-second timeout guard.
 * Prevents UI from hanging forever on "Create Room" / "Join" when backend is unreachable.
 */
function withSocketTimeout<T>(
  actionName: string,
  executor: (resolve: (val: T) => void, reject: (err: Error) => void) => void,
  timeoutMs: number = SOCKET_OP_TIMEOUT_MS
): Promise<T> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    let isSettled = false;

    // Trigger connect if client is currently disconnected
    if (!s.connected) {
      s.connect();
    }

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        const errorDetail = lastSocketError
          ? ` (${lastSocketError})`
          : !s.connected
          ? ' (Socket is not connected)'
          : '';
        reject(
          new Error(
            `Multiplayer server unreachable at ${SOCKET_URL}${errorDetail}. Please verify the standalone backend is running and NEXT_PUBLIC_SOCKET_URL is configured.`
          )
        );
      }
    }, timeoutMs);

    const safeResolve = (val: T) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve(val);
      }
    };

    const safeReject = (err: Error) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        reject(err);
      }
    };

    try {
      executor(safeResolve, safeReject);
    } catch (err: any) {
      safeReject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

// ==========================================
// Promise-based Socket Event Invokers
// ==========================================

export const socketCreateRoom = (dto: CreateRoomDTO): Promise<CreateRoomResponse> => {
  return withSocketTimeout('Create Room', (resolve, reject) => {
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
  return withSocketTimeout('Join Room', (resolve, reject) => {
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
  return withSocketTimeout('Reconnect Room', (resolve, reject) => {
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
  return withSocketTimeout('Set Ready', (resolve, reject) => {
    const s = getSocket();
    s.emit('lobby:set-ready', dto, (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error.message));
    });
  });
};

export const socketUpdateSettings = (dto: UpdateRoomSettingsDTO): Promise<void> => {
  return withSocketTimeout('Update Settings', (resolve, reject) => {
    const s = getSocket();
    s.emit('lobby:update-settings', dto, (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error.message));
    });
  });
};

export const socketKickPlayer = (dto: KickPlayerDTO): Promise<void> => {
  return withSocketTimeout('Kick Player', (resolve, reject) => {
    const s = getSocket();
    s.emit('lobby:kick-player', dto, (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error.message));
    });
  });
};

export const socketStartGame = (): Promise<void> => {
  return withSocketTimeout('Start Game', (resolve, reject) => {
    const s = getSocket();
    s.emit('lobby:start-game', (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error.message));
    });
  });
};

export const socketLeaveRoom = (): Promise<void> => {
  return withSocketTimeout(
    'Leave Room',
    (resolve) => {
      const s = getSocket();
      s.emit('room:leave', () => {
        resolve();
      });
    },
    3000
  );
};

export const socketSelectTeam = (team: import('@feto-games/shared-types').PlayerTeam): Promise<void> => {
  return withSocketTimeout('Select Team', (resolve, reject) => {
    const s = getSocket();
    s.emit('room:select-team', { team }, (res) => {
      if (!res || res.success) resolve();
      else reject(new Error(res.error?.message || 'Failed to select team'));
    });
  });
};

export const socketRematch = (nextGameMode?: import('@feto-games/shared-types').GameMode): Promise<void> => {
  return withSocketTimeout('Rematch', (resolve, reject) => {
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
  return withSocketTimeout('Quick Play', (resolve, reject) => {
    const s = getSocket();
    s.emit('room:quick-play', dto, (res) => {
      if (res && res.success) resolve(res.data);
      else reject(new Error(res.error?.message || 'Quick play failed'));
    });
  });
};
