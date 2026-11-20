'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameMode,
  GamePhaseChangePayload,
  PlayerSummary,
  PlayerTeam,
  PrivateRolePayload,
  PublicRoomConfig,
  PublicRoomState,
  SecretRolePayload,
  TimerTickPayload
} from '@feto-games/shared-types';
import { getAblyRealtime, publishDirectToChannel } from '@/lib/ably-client';
import { sound } from '@/lib/sound';

export interface UseRoomRealtimeOptions {
  roomCode: string;
  playerId: string | null;
  initialRoom?: PublicRoomState | null;
  onKicked?: (reason: string) => void;
  onToast?: (message: string) => void;
}

export function useRoomRealtime({
  roomCode,
  playerId,
  initialRoom = null,
  onKicked,
  onToast
}: UseRoomRealtimeOptions) {
  const normalizedCode = roomCode.toUpperCase().trim();

  // State
  const [room, setRoom] = useState<PublicRoomState | null>(initialRoom);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerSummary | null>(null);
  const [gameState, setGameState] = useState<any | null>(null);
  const [gameMode, setGameMode] = useState<GameMode | null>(initialRoom?.config.gameMode || null);
  const [privateRole, setPrivateRole] = useState<PrivateRolePayload | null>(null);
  const [secretRole, setSecretRole] = useState<SecretRolePayload | null>(null);
  const [currentPhase, setCurrentPhase] = useState<GamePhaseChangePayload | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolution lock flag on client to avoid re-triggering resolution before server responds
  const isResolvingRef = useRef(false);
  const lastResolvedPhaseKeyRef = useRef<string>('');

  // 1. Immediate fetch on mount & helper for refreshing state
  const fetchLatestRoom = useCallback(async () => {
    if (!normalizedCode) return;
    try {
      const res = await fetch(`/api/rooms/${normalizedCode}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.room) {
          setRoom((prev) => {
            if (!prev || (json.room.updatedAt || 0) >= (prev.updatedAt || 0)) {
              return json.room;
            }
            return prev;
          });
        }
      }
    } catch {
      // quiet fallback
    }
  }, [normalizedCode]);

  useEffect(() => {
    fetchLatestRoom();
  }, [fetchLatestRoom]);

  // 2. Lightweight 2-second background state sync fallback active while in Lobby phase or loading
  useEffect(() => {
    if (!normalizedCode) return;
    if (room && room.status !== 'lobby' && gameState) return;

    const interval = setInterval(() => {
      fetchLatestRoom();
    }, 2000);

    return () => clearInterval(interval);
  }, [normalizedCode, room, gameState, fetchLatestRoom]);

  // 3. Refresh current player reference when room updates
  useEffect(() => {
    if (!room || !playerId) return;

    const found =
      room.players.find((p) => p.id === playerId) ||
      room.spectators.find((s) => s.id === playerId);

    if (found) {
      setCurrentPlayer(found);
    }
    if (room.config.gameMode) {
      setGameMode(room.config.gameMode);
    }
  }, [room, playerId]);

  // 4. Synced Countdown Timer with server phaseEndsAt
  useEffect(() => {
    const phaseEndsAt = gameState?.phaseEndsAt;
    if (!phaseEndsAt || (room?.status !== 'in_game' && room?.status !== 'playing')) {
      setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((phaseEndsAt - now) / 1000));
      setRemainingSeconds(diff);

      // Trigger automatic phase resolution when timer reaches 0
      const phaseKey = `${room?.code}:${room?.currentRound}:${gameState?.phase}`;
      if (diff === 0 && !isResolvingRef.current && lastResolvedPhaseKeyRef.current !== phaseKey) {
        lastResolvedPhaseKeyRef.current = phaseKey;
        isResolvingRef.current = true;

        fetch('/api/game/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: normalizedCode,
            playerId,
            actionType: 'RESOLVE_PHASE'
          })
        })
          .catch((err) => {
            console.warn('⚠️ [useRoomRealtime] Auto phase resolution err:', err);
          })
          .finally(() => {
            setTimeout(() => {
              isResolvingRef.current = false;
            }, 1000);
          });
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 500);

    return () => clearInterval(timerInterval);
  }, [gameState?.phaseEndsAt, gameState?.phase, room?.status, room?.currentRound, room?.code, normalizedCode, playerId]);

  // 5. Connect to Ably Realtime Channels (Public Room + Private Player)
  useEffect(() => {
    if (!normalizedCode) return;

    const ably = getAblyRealtime(playerId || undefined);
    if (!ably) {
      // Ably not yet configured in local dev, mark connected
      setIsConnected(true);
      return;
    }

    const roomChannelName = `feto:room:${normalizedCode}`;
    const roomChannel = ably.channels.get(roomChannelName);

    let playerChannel: any = null;
    if (playerId) {
      playerChannel = ably.channels.get(`feto:player:${playerId}`);
    }

    setIsConnected(true);

    // Connection state listeners: re-fetch room on connect/reconnect
    const handleConnStateChange = (stateChange: any) => {
      if (stateChange.current === 'connected' || stateChange.current === 'reconnected') {
        setIsConnected(true);
        fetchLatestRoom();
      } else if (stateChange.current === 'disconnected' || stateChange.current === 'suspended') {
        setIsConnected(false);
      }
    };
    try {
      ably.connection.on(handleConnStateChange);
    } catch {
      // ignore
    }

    // --- Public Room Event Listeners ---
    const handleRoomState = (msg: any) => {
      const newRoom: PublicRoomState = msg.data;
      if (!newRoom) return;
      setRoom(newRoom);
      if (newRoom.status === 'lobby') {
        setPrivateRole(null);
        setSecretRole(null);
        setGameState(null);
        setCountdown(null);
      } else if (newRoom.status === 'playing' || newRoom.status === 'in_game') {
        if (newRoom.config?.gameMode) setGameMode(newRoom.config.gameMode);
        if (newRoom.gameState) setGameState(newRoom.gameState);
        else if (newRoom.gameData) setGameState(newRoom.gameData);
        setCountdown(null);
      }
    };

    const handleGameStarted = (msg: any) => {
      const data = msg.data;
      if (data?.room) {
        setRoom(data.room);
      }
      if (data?.gameMode) {
        setGameMode(data.gameMode);
      }
      if (data?.gameState) {
        setGameState(data.gameState);
      }
      setCountdown(null);
    };

    const handlePlayerJoined = (msg: any) => {
      sound.playPlayerJoined();
      if (onToast) onToast(`${msg.data.username} joined the room!`);
    };

    const handlePlayerLeft = (msg: any) => {
      sound.playUnready();
      if (onToast) onToast(`${msg.data.username} left the room.`);
    };

    const handleHostMigrated = (msg: any) => {
      sound.playClick();
      if (onToast) onToast(`${msg.data.newHostUsername} is now the Host!`);
    };

    const handleSettingsUpdated = (msg: any) => {
      sound.playClick();
      if (onToast) onToast('Room settings updated.');
    };

    const handleGameStarting = (msg: any) => {
      setCountdown(msg.data.countdownSeconds || 3);
      sound.playCountdown();
    };

    const handleGamePhaseChange = (msg: any) => {
      setCurrentPhase(msg.data);
    };

    const handleGameStateSync = (msg: any) => {
      const data = msg.data;
      if (data?.gameMode) setGameMode(data.gameMode);
      if (data?.state) setGameState(data.state);
      setCountdown(null);
    };

    roomChannel.subscribe('room:state', handleRoomState);
    roomChannel.subscribe('room_state', handleRoomState);
    roomChannel.subscribe('room_state_updated', handleRoomState);
    roomChannel.subscribe('room:updated', handleRoomState);
    roomChannel.subscribe('game:started', handleGameStarted);
    roomChannel.subscribe('room:player-joined', handlePlayerJoined);
    roomChannel.subscribe('room:player-left', handlePlayerLeft);
    roomChannel.subscribe('room:host-migrated', handleHostMigrated);
    roomChannel.subscribe('lobby:settings-updated', handleSettingsUpdated);
    roomChannel.subscribe('game:starting', handleGameStarting);
    roomChannel.subscribe('game:phase-change', handleGamePhaseChange);
    roomChannel.subscribe('game:state_sync', handleGameStateSync);

    // --- Player Kicked Event Listener ---
    const handlePlayerKicked = (msg: any) => {
      const targetPlayerId = msg.data?.targetPlayerId;
      if (targetPlayerId === playerId) {
        sound.playUnready();
        if (onKicked) onKicked(msg.data?.reason || 'You were removed from the room by the host');
      } else {
        setRoom((prev) => {
          if (!prev) return prev;
          const updated = prev.players.filter((p) => p.id !== targetPlayerId);
          return {
            ...prev,
            players: updated,
            playerCount: updated.length
          };
        });
      }
    };
    roomChannel.subscribe('player_kicked', handlePlayerKicked);

    // --- Presence Sync & Leave Cleanup ---
    try {
      const myUsername = typeof window !== 'undefined' ? localStorage.getItem('feto_username') || 'Player' : 'Player';
      const myAvatar = typeof window !== 'undefined' ? localStorage.getItem('feto_avatar') || 'cyber_cat' : 'cyber_cat';
      roomChannel.presence.enter({ playerId, username: myUsername, avatar: myAvatar }).catch(() => { });
    } catch {
      // ignore
    }

    roomChannel.presence.subscribe('leave', (member: any) => {
      const leavingId = member.clientId || member.data?.playerId;
      if (leavingId) {
        setRoom((prev) => {
          if (!prev) return prev;
          const updated = prev.players.filter((p) => p.id !== leavingId);
          return {
            ...prev,
            players: updated,
            playerCount: updated.length
          };
        });
      }
    });

    // --- Private Player Channel Listeners (Secret roles, Words) ---
    if (playerChannel) {
      playerChannel.subscribe('game:private_role', (msg: any) => {
        setPrivateRole(msg.data);
      });

      playerChannel.subscribe('game:secret-role', (msg: any) => {
        setSecretRole(msg.data);
      });

      playerChannel.subscribe('room:kicked', (msg: any) => {
        sound.playUnready();
        if (onKicked) onKicked(msg.data?.reason || 'Kicked by host');
      });
    }

    return () => {
      roomChannel.unsubscribe();
      if (playerChannel) playerChannel.unsubscribe();
    };
  }, [normalizedCode, playerId, onKicked, onToast]);

  // 4. Server-Authoritative Action Dispatcher (POST /api/game/action)
  const dispatchGameAction = useCallback(
    async (actionType: string, payload: any = {}): Promise<any> => {
      try {
        const res = await fetch('/api/game/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: normalizedCode,
            playerId,
            actionType,
            payload
          })
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error?.message || 'Action failed.');
        }

        if (data.room) setRoom(data.room);
        if (data.gameState) setGameState(data.gameState);

        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [normalizedCode, playerId]
  );

  // 5. Convenience Action Helpers
  const setReady = useCallback(
    async (isReady?: boolean) => {
      sound.playClick();
      await dispatchGameAction('TOGGLE_READY', { isReady });
    },
    [dispatchGameAction]
  );

  const updateSettings = useCallback(
    async (settings: Partial<PublicRoomConfig> | any) => {
      sound.playClick();
      const res = await fetch('/api/rooms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: normalizedCode,
          playerId,
          settings
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to update settings');
      }
      if (data.data?.room) {
        setRoom(data.data.room);
      }
      return data;
    },
    [normalizedCode, playerId]
  );

  const startGame = useCallback(
    async (isSoloDevMode = false, force = false) => {
      sound.playClick();
      const res = await fetch('/api/rooms/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: normalizedCode,
          playerId,
          isSoloDevMode,
          force
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to start game');
      }
      if (data.data?.room) setRoom(data.data.room);
      if (data.data?.gameState) setGameState(data.data.gameState);
      return data;
    },
    [normalizedCode, playerId]
  );

  const forceStartGame = useCallback(
    async () => {
      return startGame(false, true);
    },
    [startGame]
  );

  const selectGames = useCallback(
    async (selectedGames: GameMode[]) => {
      sound.playClick();
      await dispatchGameAction('SELECT_GAMES', { selectedGames });
    },
    [dispatchGameAction]
  );

  const leaveRoom = useCallback(async () => {
    sound.playClick();
    await fetch('/api/rooms/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: normalizedCode, playerId })
    });
  }, [normalizedCode, playerId]);

  const selectTeam = useCallback(
    async (team?: PlayerTeam) => {
      sound.playClick();
      const res = await fetch('/api/rooms/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: normalizedCode,
          playerId,
          team
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to switch team');
      }
      if (data.data?.room) setRoom(data.data.room);
      return data;
    },
    [normalizedCode, playerId]
  );

  const kickPlayer = useCallback(
    async (targetPlayerId: string, reason = 'Removed by room host') => {
      sound.playClick();
      const res = await fetch('/api/rooms/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: normalizedCode,
          playerId,
          targetPlayerId,
          reason
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to kick player.');
      }
      if (data.data?.room) {
        setRoom(data.data.room);
      }
    },
    [normalizedCode, playerId]
  );

  const rematch = useCallback(
    async (nextGameMode?: GameMode) => {
      sound.playClick();
      await dispatchGameAction('REMATCH', { nextGameMode });
    },
    [dispatchGameAction]
  );

  const sendReaction = useCallback(
    async (emoji: string) => {
      await dispatchGameAction('EMOJI_REACTION', { emoji });
    },
    [dispatchGameAction]
  );

  // 6. Direct High-Frequency Canvas Stroke Publishing (sub-30ms latency)
  const publishStroke = useCallback(
    (stroke: any) => {
      publishDirectToChannel(`feto:room:${normalizedCode}`, 'draw:stroke', stroke);
    },
    [normalizedCode]
  );

  const clearCanvas = useCallback(() => {
    publishDirectToChannel(`feto:room:${normalizedCode}`, 'draw:clear', {});
  }, [normalizedCode]);

  return {
    room,
    setRoom,
    fetchLatestRoom,
    currentPlayer,
    gameState,
    setGameState,
    gameMode,
    privateRole,
    secretRole,
    currentPhase,
    countdown,
    remainingSeconds,
    isConnected,
    error,
    dispatchGameAction,
    setReady,
    updateSettings,
    selectGames,
    startGame,
    forceStartGame,
    leaveRoom,
    selectTeam,
    kickPlayer,
    rematch,
    sendReaction,
    publishStroke,
    clearCanvas
  };
}
