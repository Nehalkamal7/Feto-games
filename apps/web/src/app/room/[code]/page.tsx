'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Play,
  LogOut,
  Settings,
  UserX,
  Volume2,
  Share2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  Users,
  Shield,
  Sliders,
  ChevronDown,
  Gamepad2,
  Flame,
  Radio,
  Wine,
  PlusCircle
} from 'lucide-react';
import {
  GameMode,
  GamePhaseChangePayload,
  NeonAvatarId,
  NEON_AVATARS,
  PlayerSummary,
  PlayerTeam,
  PrivateRolePayload,
  PublicRoomConfig,
  PublicRoomState,
  SecretRolePayload,
  TimerTickPayload
} from '@feto-games/shared-types';
import { BrandLogo } from '@/components/BrandLogo';
import { NeonLogo } from '@/components/NeonLogo';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { FloatingReactions } from '@/components/FloatingReactions';
import { GamePodiumView } from '@/components/GamePodiumView';
import { SoundToggle } from '@/components/SoundToggle';
import { RoomLobbyQRCode } from '@/components/RoomLobbyQRCode';
import { RoomSettingsModal } from '@/components/RoomSettingsModal';
import { GamePlaylistQueue } from '@/components/GamePlaylistQueue';
import { SabotageDrawer, SabotageType } from '@/components/SabotageDrawer';
import { ImposterGameView } from '@/components/games/ImposterGameView';
import { DrawAndGuessGameView } from '@/components/games/DrawAndGuessGameView';
import { QuizBattleGameView } from '@/components/games/QuizBattleGameView';
import { WordBattleGameView } from '@/components/games/WordBattleGameView';
import { TruthOrDareGameView } from '@/components/games/TruthOrDareGameView';
import { NeverHaveIEverGameView } from '@/components/games/NeverHaveIEverGameView';
import { MostLikelyToGameView } from '@/components/games/MostLikelyToGameView';
import { SipOrSpillGameView } from '@/components/games/SipOrSpillGameView';
import { SillyRouletteGameView } from '@/components/games/SillyRouletteGameView';
import { HotPotatoGameView } from '@/components/games/HotPotatoGameView';
import {
  clearReconnectSession,
  getReconnectToken,
  getSocket,
  socketJoinRoom,
  socketKickPlayer,
  socketLeaveRoom,
  socketReconnectRoom,
  socketSelectGames,
  socketSelectTeam,
  socketSetReady,
  socketStartGame,
  socketUpdateSettings
} from '@/lib/socket';
import { sound } from '@/lib/sound';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = ((params?.code as string) || '').toUpperCase().trim();

  // Room & Player State
  const [room, setRoom] = useState<PublicRoomState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerSummary | null>(null);
  const [secretRole, setSecretRole] = useState<SecretRolePayload | null>(null);
  const [privateRole, setPrivateRole] = useState<PrivateRolePayload | null>(null);
  const [gameStateSync, setGameStateSync] = useState<{ gameMode: GameMode; state: any } | null>(null);

  // In-Game State
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentPhase, setCurrentPhase] = useState<GamePhaseChangePayload | null>(null);
  const [timerState, setTimerState] = useState<TimerTickPayload | null>(null);

  // Modals & Forms
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinUsername, setJoinUsername] = useState('');
  const [joinAvatar, setJoinAvatar] = useState<NeonAvatarId>('cyber_cat');
  const [joinPin, setJoinPin] = useState('');
  const [difficultySetting, setDifficultySetting] = useState<'casual' | 'standard' | 'wild'>('standard');
  const [isSoloDevMode, setIsSoloDevMode] = useState(false);

  // Sync isSoloDevMode when room config updates
  useEffect(() => {
    if ((room?.config as any)?.isSoloDevMode !== undefined) {
      setIsSoloDevMode(Boolean((room?.config as any)?.isSoloDevMode));
    }
  }, [(room?.config as any)?.isSoloDevMode]);

  // Notifications & UI Status
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isStreamerMode, setIsStreamerMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Kick modal
  const [kickTarget, setKickTarget] = useState<PlayerSummary | null>(null);

  // Tactical Sabotage Power-Ups
  const [isBlindfolded, setIsBlindfolded] = useState(false);
  const [hasUsedSabotage, setHasUsedSabotage] = useState(false);
  const [sabotageAlertBanner, setSabotageAlertBanner] = useState<string | null>(null);

  // Grace period countdown state map for disconnected players
  const [graceCountdowns, setGraceCountdowns] = useState<Record<string, number>>({});

  // Match data auto-sync safety fallback
  const [syncSeconds, setSyncSeconds] = useState(0);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const syncMatchState = useCallback(async () => {
    if (!roomCode) return;
    setIsManualSyncing(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.room) {
          setRoom(json.room);
          const stateData = json.room.gameState || json.room.gameData;
          if (stateData) {
            setGameStateSync({
              gameMode: json.room.config?.gameMode || 'who_is_imposter',
              state: stateData
            });
            setCountdown(null);
          }
        }
      }
    } catch (err) {
      console.warn('Sync match state error:', err);
    } finally {
      setIsManualSyncing(false);
    }
  }, [roomCode]);

  useEffect(() => {
    const isPlaying = room?.status === 'playing' || room?.status === 'in_game';
    const isMissingData = !gameStateSync || gameStateSync.gameMode !== room?.config?.gameMode;

    if (isPlaying && isMissingData) {
      syncMatchState();
      const timer = setInterval(() => {
        setSyncSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setSyncSeconds(0);
    }
  }, [room?.status, room?.config?.gameMode, gameStateSync, syncMatchState]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Custom Deck Submission & Sip Edition Controls
  const [showCustomCardModal, setShowCustomCardModal] = useState(false);
  const [customCardPrompt, setCustomCardPrompt] = useState('');
  const [customCardType, setCustomCardType] = useState('general');
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);

  const handleGameAction = useCallback(
    async (actionType: string, payload: any = {}) => {
      if (!currentPlayer) return;
      try {
        const res = await fetch('/api/game/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode,
            playerId: currentPlayer.id,
            actionType,
            payload
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || data.error || 'Action failed.');
        }
        if (data.room) setRoom(data.room);
        if (data.gameState) {
          setGameStateSync({
            gameMode: room?.config.gameMode || 'who_is_imposter',
            state: data.gameState
          });
        }
      } catch (err: any) {
        console.error('Error executing game action:', err);
        showToast(err.message || 'Action error');
        throw err;
      }
    },
    [currentPlayer, roomCode, room?.config.gameMode, showToast]
  );

  const handleSubmitCustomCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCardPrompt.trim()) return;
    setIsSubmittingCard(true);
    try {
      await handleGameAction('SUBMIT_CUSTOM_CARD', {
        prompt: customCardPrompt.trim(),
        type: customCardType
      });
      sound.playClick();
      showToast('Custom card injected into party rotation!');
      setCustomCardPrompt('');
      setShowCustomCardModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit card.');
    } finally {
      setIsSubmittingCard(false);
    }
  };

  const handleQuickTakeSip = async () => {
    sound.playSipGlug();
    sound.triggerHaptic(50);
    try {
      await handleGameAction('TAKE_SIP', { amount: 1 });
      showToast('You took a sip! 🥤 Stay hydrated!');
    } catch {
      showToast('Could not record sip.');
    }
  };

  const handleUseSabotage = async (type: SabotageType, targetId: string) => {
    try {
      await handleGameAction('USE_SABOTAGE_POWERUP', { type, targetId });
      setHasUsedSabotage(true);
      showToast(`Tactical Sabotage unleashed! ⚡`);
    } catch (err: any) {
      showToast(err.message || 'Failed to use sabotage.');
      throw err;
    }
  };

  // Update live grace period countdown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newMap: Record<string, number> = {};

      if (room) {
        room.players.forEach((p) => {
          if (p.connectionStatus === 'disconnected_grace' && p.graceExpiresAt) {
            const diff = Math.max(0, Math.ceil((p.graceExpiresAt - now) / 1000));
            newMap[p.id] = diff;
          }
        });
      }
      setGraceCountdowns(newMap);
    }, 1000);

    return () => clearInterval(interval);
  }, [room]);

  // Synchronized countdown timer with server phaseEndsAt and automatic phase resolution
  const isResolvingPhaseRef = useRef(false);
  const lastResolvedKeyRef = useRef<string>('');

  useEffect(() => {
    const phaseEndsAt = gameStateSync?.state?.phaseEndsAt;
    if (!phaseEndsAt || (room?.status !== 'in_game' && room?.status !== 'playing')) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((phaseEndsAt - now) / 1000));
      setTimerState({
        remainingSeconds: diff,
        totalDurationSeconds: room.config.roundDurationSeconds || 30,
        phase: (gameStateSync?.state?.phase as any) || 'question',
        round: room.currentRound
      });

      // Tension heartbeat & haptic in final 5 seconds of active round
      if (diff > 0 && diff <= 5 && (room.status === 'in_game' || room.status === 'playing')) {
        sound.playHeartbeat(diff);
      }

      // Auto resolve phase if timer hit 0
      const phaseKey = `${roomCode}:${room.currentRound}:${gameStateSync?.state?.phase}`;
      if (diff === 0 && !isResolvingPhaseRef.current && lastResolvedKeyRef.current !== phaseKey) {
        lastResolvedKeyRef.current = phaseKey;
        isResolvingPhaseRef.current = true;

        const pid = typeof window !== 'undefined' ? sessionStorage.getItem(`feto_player_id_${roomCode}`) : null;
        fetch('/api/game/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode,
            playerId: pid,
            actionType: 'RESOLVE_PHASE'
          })
        }).finally(() => {
          setTimeout(() => {
            isResolvingPhaseRef.current = false;
          }, 1500);
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameStateSync?.state?.phaseEndsAt, gameStateSync?.state?.phase, room?.status, room?.currentRound, room?.config.roundDurationSeconds, roomCode]);

  // Handle Socket.IO events and initial connection
  useEffect(() => {
    if (!roomCode) return;
    const socket = getSocket();

    const handleRoomState = (newRoom: PublicRoomState) => {
      setRoom((prev) => {
        if (prev && prev.status === 'lobby') {
          const oldIds = new Set(prev.players.map((p) => p.id));
          const joined = newRoom.players.filter((p) => !oldIds.has(p.id));
          const savedPlayerId = typeof window !== 'undefined'
            ? sessionStorage.getItem(`feto_player_id_${roomCode}`)
            : null;
          joined.forEach((p) => {
            if (p.id !== savedPlayerId && p.id !== currentPlayer?.id) {
              sound.playPlayerJoined();
              showToast(`${p.username} joined the party!`);
            }
          });
        }
        return newRoom;
      });

      if (newRoom.status === 'lobby') {
        setPrivateRole(null);
        setGameStateSync(null);
        setCountdown(null);
      } else if (newRoom.status === 'playing' || newRoom.status === 'in_game') {
        if (newRoom.gameState) {
          setGameStateSync({
            gameMode: newRoom.config?.gameMode || 'who_is_imposter',
            state: newRoom.gameState
          });
        } else if (newRoom.gameData) {
          setGameStateSync({
            gameMode: newRoom.config?.gameMode || 'who_is_imposter',
            state: newRoom.gameData
          });
        }
        setCountdown(null);
      }

      // Refresh current player reference
      const savedPlayerId = typeof window !== 'undefined'
        ? sessionStorage.getItem(`feto_player_id_${roomCode}`)
        : null;

      if (savedPlayerId) {
        const found =
          newRoom.players.find((p) => p.id === savedPlayerId) ||
          newRoom.spectators.find((s) => s.id === savedPlayerId);
        if (found) setCurrentPlayer(found);
      }
    };

    const handlePlayerJoined = (player: PlayerSummary) => {
      sound.playPlayerJoined();
      showToast(`${player.username} joined the party!`);
    };

    const handlePlayerLeft = (data: { playerId: string; username: string; newHostId?: string }) => {
      sound.playUnready();
      showToast(`${data.username} left the room.`);
    };

    const handleHostMigrated = (data: { newHostId: string; previousHostId: string; newHostUsername: string }) => {
      sound.playClick();
      showToast(`${data.newHostUsername} is now the Room Host!`);
    };

    const handleSettingsUpdated = (newConfig: PublicRoomConfig) => {
      sound.playClick();
      showToast('Room settings updated.');
    };

    const handleCountdown = (data: { countdownSeconds: number }) => {
      setCountdown(data.countdownSeconds);
      sound.playCountdown();
    };

    const handleGamePhaseChange = (phasePayload: GamePhaseChangePayload) => {
      setCurrentPhase(phasePayload);
    };

    const handleSecretRole = (rolePayload: SecretRolePayload) => {
      setSecretRole(rolePayload);
    };

    const handlePrivateRole = (rolePayload: PrivateRolePayload) => {
      setPrivateRole(rolePayload);
    };

    const handleTimerTick = (tickPayload: TimerTickPayload) => {
      setTimerState(tickPayload);
    };

    const handleGameStateSync = (data: { gameMode: GameMode; state: any }) => {
      setGameStateSync(data);
      setCountdown(null);
    };

    const handleGameStarted = (data: { room?: PublicRoomState; gameMode?: GameMode; gameState?: any }) => {
      if (data?.room) {
        setRoom(data.room);
      }
      if (data?.gameMode && data?.gameState) {
        setGameStateSync({
          gameMode: data.gameMode,
          state: data.gameState
        });
      }
      setCountdown(null);
    };

    const handleChaosSabotage = (data: {
      attackerId: string;
      attackerUsername: string;
      targetId: string;
      targetUsername: string;
      type: string;
      durationMs: number;
    }) => {
      sound.playSabotage();
      const typeLabel =
        data.type === 'blindfold'
          ? 'Blindfold 🕶️'
          : data.type === 'double_trouble'
          ? 'Double Trouble 🔥'
          : 'Steal Turn ⚡';

      setSabotageAlertBanner(`⚡ ${data.attackerUsername} used ${typeLabel} on ${data.targetUsername}!`);
      setTimeout(() => setSabotageAlertBanner(null), 4500);

      const savedPid = typeof window !== 'undefined' ? sessionStorage.getItem(`feto_player_id_${roomCode}`) : null;
      if (data.type === 'blindfold' && (data.targetId === currentPlayer?.id || data.targetId === savedPid)) {
        setIsBlindfolded(true);
        sound.triggerHaptic([120, 80, 120]);
        setTimeout(() => {
          setIsBlindfolded(false);
        }, 5000);
      }
    };

    const handlePlayerKicked = (data: { targetPlayerId?: string; reason?: string }) => {
      const targetId = data.targetPlayerId;
      const myPid = currentPlayer?.id || (typeof window !== 'undefined'
        ? sessionStorage.getItem(`feto_player_id_${roomCode}`) || sessionStorage.getItem('feto_persistent_player_id')
        : null);

      if (!targetId || targetId === myPid) {
        // Current user was kicked
        sound.playUnready();
        clearReconnectSession(roomCode);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('feto_kick_toast', 'You were removed from the room by the host');
        }
        router.push('/');
        return;
      }

      // For all other players (including host):
      sound.playUnready();
      showToast('A player was removed by the room host.');
      setRoom((prev) => {
        if (!prev) return prev;
        const updated = prev.players.filter((p) => p.id !== targetId);
        return {
          ...prev,
          players: updated,
          playerCount: updated.length
        };
      });
    };

    const handlePresenceLeave = (data: { playerId: string }) => {
      if (!data?.playerId) return;
      if (currentPlayer?.isHost || room?.hostId === currentPlayer?.id) {
        fetch('/api/rooms/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode, playerId: data.playerId })
        }).catch(() => {});
      }
    };

    socket.on('room:updated', handleRoomState);
    socket.on('room:state', handleRoomState);
    socket.on('room_state', handleRoomState);
    socket.on('game:started', handleGameStarted);
    socket.on('room:player-joined', handlePlayerJoined);
    socket.on('room:player-left', handlePlayerLeft);
    socket.on('room:host-migrated', handleHostMigrated);
    socket.on('lobby:settings-updated', handleSettingsUpdated);
    socket.on('game:starting', handleCountdown);
    socket.on('game:phase-change', handleGamePhaseChange);
    socket.on('game:secret-role', handleSecretRole);
    socket.on('game:private_role', handlePrivateRole);
    socket.on('game:timer-tick', handleTimerTick);
    socket.on('game:state_sync', handleGameStateSync);
    socket.on('chaos:sabotage', handleChaosSabotage);
    socket.on('room:kicked', handlePlayerKicked);
    socket.on('player_kicked', handlePlayerKicked);
    socket.on('presence:leave', handlePresenceLeave);
    socket.on('presence.leave', handlePresenceLeave);

    // Initial Join / Reconnect Flow
    const initConnection = async () => {
      // 1. Immediately fetch fresh room snapshot so UI displays instantly
      try {
        const initialRes = await fetch(`/api/rooms/${roomCode}`);
        if (initialRes.ok) {
          const initialJson = await initialRes.json();
          if (initialJson.success && initialJson.room) {
            setRoom((prev) => (!prev || (initialJson.room.updatedAt || 0) >= (prev.updatedAt || 0) ? initialJson.room : prev));
          }
        }
      } catch {
        // fallback to socket
      }

      const reconnectToken = getReconnectToken(roomCode);
      const savedPlayerId = typeof window !== 'undefined'
        ? sessionStorage.getItem(`feto_player_id_${roomCode}`) || sessionStorage.getItem('feto_persistent_player_id')
        : null;

      if (reconnectToken && savedPlayerId) {
        try {
          const res = await socketReconnectRoom({
            reconnectToken
          });
          setRoom(res.room);
          const me =
            res.room.players.find((p) => p.id === savedPlayerId) ||
            res.room.spectators.find((s) => s.id === savedPlayerId);
          if (me) setCurrentPlayer(me);
          setIsInitializing(false);
          return;
        } catch {
          clearReconnectSession(roomCode);
        }
      }

      // Try quick join if user info exists in localStorage
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('feto_username') : null;
      const savedAvatar = typeof window !== 'undefined'
        ? (localStorage.getItem('feto_avatar') as NeonAvatarId)
        : null;

      if (savedUser && savedAvatar) {
        try {
          const res = await socketJoinRoom({
            roomCode,
            username: savedUser,
            avatar: savedAvatar
          });
          setRoom(res.room);
          const me =
            (savedPlayerId && res.room.players.find((p) => p.id === savedPlayerId)) ||
            res.room.players.find((p) => p.username.toLowerCase() === savedUser.toLowerCase()) ||
            res.room.spectators.find((s) => s.username.toLowerCase() === savedUser.toLowerCase());
          if (me) setCurrentPlayer(me);
          setIsInitializing(false);
          return;
        } catch {
          setShowJoinModal(true);
        }
      } else {
        setShowJoinModal(true);
      }

      setIsInitializing(false);
    };

    initConnection();

    // 2-second background state sync fallback active in Lobby phase or loading
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomCode}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.room) {
            setRoom((prev) => {
              if (!prev || (json.room.updatedAt || 0) > (prev.updatedAt || 0)) {
                if (prev && prev.status === 'lobby') {
                  const oldIds = new Set(prev.players.map((p) => p.id));
                  const joined = json.room.players.filter((p: any) => !oldIds.has(p.id));
                  const savedPid = typeof window !== 'undefined'
                    ? sessionStorage.getItem(`feto_player_id_${roomCode}`)
                    : null;
                  joined.forEach((p: any) => {
                    if (p.id !== savedPid && p.id !== currentPlayer?.id) {
                      sound.playPlayerJoined();
                      showToast(`${p.username} joined the party!`);
                    }
                  });
                }
                return json.room;
              }
              return prev;
            });
            if (json.room.status === 'playing' || json.room.status === 'in_game') {
              const stateData = json.room.gameState || json.room.gameData;
              if (stateData) {
                setGameStateSync({
                  gameMode: json.room.config?.gameMode || 'who_is_imposter',
                  state: stateData
                });
                setCountdown(null);
              }
            }
          }
        }
      } catch {
        // quiet fallback
      }
    }, 2000);

    return () => {
      clearInterval(syncInterval);
      socket.off('room:updated', handleRoomState);
      socket.off('room:state', handleRoomState);
      socket.off('room_state', handleRoomState);
      socket.off('game:started', handleGameStarted);
      socket.off('room:player-joined', handlePlayerJoined);
      socket.off('room:player-left', handlePlayerLeft);
      socket.off('room:host-migrated', handleHostMigrated);
      socket.off('lobby:settings-updated', handleSettingsUpdated);
      socket.off('game:starting', handleCountdown);
      socket.off('game:phase-change', handleGamePhaseChange);
      socket.off('game:secret-role', handleSecretRole);
      socket.off('game:private_role', handlePrivateRole);
      socket.off('game:timer-tick', handleTimerTick);
      socket.off('game:state_sync', handleGameStateSync);
      socket.off('chaos:sabotage', handleChaosSabotage);
      socket.off('room:kicked', handlePlayerKicked);
      socket.off('player_kicked', handlePlayerKicked);
      socket.off('presence:leave', handlePresenceLeave);
      socket.off('presence.leave', handlePresenceLeave);
    };
  }, [roomCode, router, showToast]);

  // Modal Join Room
  const handleModalJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinUsername.trim()) return;

    try {
      const res = await socketJoinRoom({
        roomCode,
        username: joinUsername.trim(),
        avatar: joinAvatar,
        pin: joinPin.trim() || undefined
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('feto_username', joinUsername.trim());
        localStorage.setItem('feto_avatar', joinAvatar);
      }

      setRoom(res.room);
      const me =
        res.room.players.find((p) => p.username === joinUsername.trim()) ||
        res.room.spectators.find((s) => s.username === joinUsername.trim());
      if (me) setCurrentPlayer(me);
      setShowJoinModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to join room.');
    }
  };

  // Ready Status Toggle
  const handleToggleReady = async () => {
    if (!currentPlayer) return;
    const nextState = !currentPlayer.isReady;
    sound.playClick();

    try {
      await socketSetReady({ isReady: nextState });
      if (nextState) sound.playReady();
      else sound.playUnready();

      setCurrentPlayer((prev) => (prev ? { ...prev, isReady: nextState } : null));
    } catch (err: any) {
      showToast(err.message || 'Could not toggle ready status.');
    }
  };

  // Host Start Game (with support for normal or Force Start)
  const handleStartGame = async (force = false) => {
    sound.playClick();
    try {
      const res = await socketStartGame(isSoloDevMode, force);
      if (res?.room) {
        setRoom(res.room);
      }
      if (res?.gameState) {
        setGameStateSync({
          gameMode: res.room?.config?.gameMode || room?.config?.gameMode || 'who_is_imposter',
          state: res.gameState
        });
      }
      setCountdown(null);
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Could not start game.'}`);
    }
  };

  // Host Live In-Room Settings Save
  const handleSaveSettings = async (newSettings: any) => {
    try {
      await handleGameAction('UPDATE_SETTINGS', newSettings);
      showToast('Host updated room settings');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings.');
      throw err;
    }
  };

  // Host Live Playlist Queue Update
  const handleUpdatePlaylist = async (newGames: GameMode[]) => {
    try {
      await socketSelectGames(newGames);
      showToast(`Playlist updated with ${newGames.length} game${newGames.length > 1 ? 's' : ''}!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update playlist.');
    }
  };

  // Host Kick Confirm
  const handleConfirmKick = async () => {
    if (!kickTarget) return;
    sound.playClick();
    try {
      await socketKickPlayer({ targetPlayerId: kickTarget.id, reason: 'Removed by room host.' });
      showToast(`Kicked ${kickTarget.username}.`);
      setKickTarget(null);
    } catch (err: any) {
      showToast(err.message || 'Could not kick player.');
    }
  };

  // Leave Room
  const handleLeaveRoom = async () => {
    sound.playClick();
    await socketLeaveRoom();
    clearReconnectSession(roomCode);
    router.push('/');
  };

  // Copy Invite Link
  const handleCopyInviteLink = () => {
    sound.playClick();
    const url = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast('Direct invite link copied to clipboard!');
  };

  // Copy Room Code
  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast(`Room code ${roomCode} copied!`);
  };

  // Tab-close / navigate away beacon for instant stale ghost cleanup
  useEffect(() => {
    const handleUnload = () => {
      const pid = currentPlayer?.id || (typeof window !== 'undefined'
        ? sessionStorage.getItem(`feto_player_id_${roomCode}`) || sessionStorage.getItem('feto_persistent_player_id')
        : null);
      if (roomCode && pid) {
        const payload = JSON.stringify({ roomCode, playerId: pid });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/rooms/leave', blob);
      }
    };
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [roomCode, currentPlayer?.id]);

  const isHost = (currentPlayer?.isHost || room?.hostId === currentPlayer?.id) ?? false;

  // Deduplicate active players by playerId and username to guarantee no ghost duplicates
  const activePlayers = React.useMemo(() => {
    if (!room?.players) return [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const deduped: PlayerSummary[] = [];

    for (const p of room.players) {
      if (!p || !p.id) continue;
      const lowerName = (p.username || '').toLowerCase();
      if (!seenIds.has(p.id) && !seenNames.has(lowerName)) {
        seenIds.add(p.id);
        seenNames.add(lowerName);
        deduped.push(p);
      }
    }
    return deduped;
  }, [room?.players]);

  const maxPlayers = room?.config?.maxPlayers || 15;
  const minRequired = isSoloDevMode ? 1 : 2;
  const allReady = activePlayers.length >= minRequired && activePlayers.every((p) => p.isReady);

  if (isInitializing || !room) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F8F8F8]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#010101] border-t-[#0B89FD] rounded-full animate-spin mx-auto shadow-[4px_4px_0px_#010101]" />
          <p className="text-[#010101] font-black uppercase tracking-wider text-sm">
            Connecting to FETO Room {roomCode}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-[100dvh] bg-[#F8F8F8] text-[#010101] flex flex-col justify-between max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 relative safe-top safe-bottom transition-all ${
        timerState && timerState.remainingSeconds <= 5 && timerState.remainingSeconds > 0 && (room.status === 'in_game' || room.status === 'playing')
          ? 'tension-pulse'
          : ''
      }`}
    >
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-[#FFFFFF] border-2 border-[#010101] rounded-full text-[#010101] text-xs md:text-sm font-black shadow-[4px_4px_0px_#010101] flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#0B89FD]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sabotage Chaos Strike Alert Banner */}
      <AnimatePresence>
        {sabotageAlertBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.9 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-slate-950/95 border-2 border-pink-500 rounded-full text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_0_30px_rgba(255,0,122,0.65)] flex items-center gap-2.5 backdrop-blur-md"
          >
            <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>{sabotageAlertBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blindfold Full-Screen Sabotage Impact Overlay */}
      <AnimatePresence>
        {isBlindfolded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 backdrop-blur-2xl bg-black/75 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <span className="text-6xl mb-4 animate-bounce">🕶️</span>
            <h2 className="text-2xl sm:text-3xl font-black text-cyan-300 uppercase tracking-widest mb-2 shadow-neon-cyan">
              BLINDFOLD ACTIVE!
            </h2>
            <p className="text-sm text-slate-300 max-w-sm">
              An opponent fogged your vision with a tactical sabotage! Clearing up in 5 seconds...
            </p>
            <div className="w-56 h-2.5 bg-slate-800 rounded-full mt-6 overflow-hidden border border-cyan-500/40">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 4. 15-PLAYER WAITING LOBBY REDESIGN                      */}
      {/* ======================================================== */}
      {room.status === 'in_game' || room.status === 'playing' || room.status === 'countdown' ? (
        /* IN-GAME ACTIVE SCREEN */
        <div className="flex-1 flex flex-col items-center justify-start py-2 relative z-10 w-full min-h-[600px]">
          {/* IN-GAME HUD BAR */}
          <div className="w-full bg-[#FFFFFF] rounded-2xl px-3 sm:px-5 py-2 mb-3 flex items-center justify-between border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
            <div className="flex items-center gap-2 sm:gap-3">
              <BrandLogo size="nav" showSubtitle={false} />
              <span className="text-[#010101]/40 font-bold hidden sm:inline">|</span>
              <div className="px-2.5 py-0.5 rounded-lg bg-[#FEC90E] border-2 border-[#010101] text-[10px] sm:text-xs font-black text-[#010101] font-mono shadow-[1px_1px_0px_#010101]">
                ROOM: {roomCode}
              </div>
              <div className="px-2.5 py-0.5 rounded-lg bg-[#0B89FD] border-2 border-[#010101] text-[10px] sm:text-xs font-black text-white uppercase shadow-[1px_1px_0px_#010101]">
                Round {room.currentRound} / {room.config.totalRounds}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {room.config.vibeMode === 'sip_edition' && (
                <button
                  onClick={handleQuickTakeSip}
                  className="px-2.5 py-1 rounded-xl bg-[#FD3F01] hover:bg-[#e03800] border-2 border-[#010101] text-white text-[11px] font-black flex items-center gap-1 shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px] touch-target"
                  title="Take a drink & log on leaderboard"
                >
                  <Wine className="w-3.5 h-3.5 text-white" />
                  <span className="hidden sm:inline">Take Sip! 🥤</span>
                  <span className="font-mono text-[10px] text-white font-black">
                    ({room.sipsCount?.[currentPlayer?.id || ''] || 0})
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  sound.playClick();
                  setShowCustomCardModal(true);
                }}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-[#FFFFFF] hover:bg-[#F8F8F8] border-2 border-[#010101] text-[#010101] text-[11px] font-black flex items-center gap-1 shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px]"
                title="Submit Custom Card"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#0B89FD]" />
                <span className="hidden sm:inline">Custom Card</span>
              </button>

              <SoundToggle />

              <button
                onClick={handleLeaveRoom}
                className="p-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FD3F01]/20 border-2 border-[#010101] text-[#010101] shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px]"
                title="Leave Room"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {countdown !== null && countdown > 0 ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="my-auto text-center py-20 flex flex-col items-center justify-center"
            >
              <div className="text-sm uppercase tracking-widest text-[#010101] font-black mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin text-[#0B89FD]" />
                <span>Match Starting In</span>
              </div>
              <div className="text-9xl md:text-[12rem] font-black text-[#FD3F01] filter drop-shadow-[6px_6px_0px_#010101] font-display">
                {countdown}
              </div>
            </motion.div>
          ) : !currentPlayer ? (
            <div className="flex flex-col items-center justify-center my-auto py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-[#010101] border-t-[#0B89FD] rounded-full animate-spin" />
              <p className="text-[#525252] font-black">Connecting to game room...</p>
            </div>
          ) : !gameStateSync || gameStateSync.gameMode !== room.config.gameMode ? (
            <div className="flex flex-col items-center justify-center my-auto py-20 space-y-4 max-w-md mx-auto text-center px-4">
              <div className="w-12 h-12 border-4 border-[#010101] border-t-[#FD3F01] rounded-full animate-spin" />
              <p className="text-[#010101] font-black tracking-wide">
                Syncing match...
              </p>
              <p className="text-[#525252] text-xs font-semibold">
                Connecting to live game round data
              </p>
              {syncSeconds >= 4 && (
                <button
                  onClick={() => {
                    sound.playClick();
                    syncMatchState();
                  }}
                  disabled={isManualSyncing}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#0B89FD] hover:bg-[#0977db] text-white font-black text-xs uppercase tracking-wider border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all disabled:opacity-50"
                >
                  {isManualSyncing ? 'Syncing...' : '🔄 Retry Sync'}
                </button>
              )}
            </div>
          ) : room.config.gameMode === 'who_is_imposter' ? (
            <ImposterGameView
              gameState={gameStateSync.state}
              currentPlayer={currentPlayer}
              players={room.players}
              privateRole={privateRole}
              roomCode={roomCode}
            />
          ) : room.config.gameMode === 'draw_and_guess' ? (
            <DrawAndGuessGameView
              gameState={gameStateSync.state}
              currentPlayer={currentPlayer}
              players={room.players}
              roomCode={roomCode}
            />
          ) : room.config.gameMode === 'quiz_battle' ? (
            <QuizBattleGameView
              gameState={gameStateSync.state}
              currentPlayer={currentPlayer}
              players={room.players}
              roomCode={roomCode}
            />
          ) : room.config.gameMode === 'word_battle' ? (
            <WordBattleGameView
              gameState={gameStateSync.state}
              currentPlayer={currentPlayer}
              players={room.players}
              roomCode={roomCode}
            />
          ) : room.config.gameMode === 'truth_or_dare' ? (
            <TruthOrDareGameView
              gameState={gameStateSync.state}
              currentPlayer={currentPlayer}
              players={room.players}
              roomCode={roomCode}
            />
          ) : room.config.gameMode === 'never_have_i_ever' ? (
            <NeverHaveIEverGameView
              gameState={gameStateSync.state}
              currentPlayer={currentPlayer}
              players={room.players}
              roomCode={roomCode}
            />
          ) : room.config.gameMode === 'most_likely_to' ? (
            <MostLikelyToGameView
              state={gameStateSync.state}
              players={room.players}
              currentPlayerId={currentPlayer.id}
              isHost={isHost}
              vibeMode={room.config.vibeMode}
              onAction={handleGameAction}
            />
          ) : room.config.gameMode === 'sip_or_spill' ? (
            <SipOrSpillGameView
              state={gameStateSync.state}
              players={room.players}
              currentPlayerId={currentPlayer.id}
              isHost={isHost}
              vibeMode={room.config.vibeMode}
              onAction={handleGameAction}
            />
          ) : room.config.gameMode === 'silly_roulette' ? (
            <SillyRouletteGameView
              state={gameStateSync.state}
              players={room.players}
              currentPlayerId={currentPlayer.id}
              isHost={isHost}
              vibeMode={room.config.vibeMode}
              onAction={handleGameAction}
            />
          ) : room.config.gameMode === 'hot_potato' ? (
            <HotPotatoGameView
              state={gameStateSync.state}
              players={room.players}
              currentPlayerId={currentPlayer.id}
              isHost={isHost}
              vibeMode={room.config.vibeMode}
              onAction={handleGameAction}
            />
          ) : (
            <div className="w-full max-w-xl glass-panel p-8 rounded-3xl text-center space-y-4 my-auto">
              <h3 className="text-2xl font-bold text-white">Party Mode Active</h3>
              <p className="text-slate-400">Enjoy the game with your group!</p>
            </div>
          )}
        </div>
      ) : (room.status === 'game_over' || room.status === 'finished') ? (
        /* ANIMATED PODIUM & REMATCH SCREEN */
        <GamePodiumView room={room} currentPlayer={currentPlayer} />
      ) : (
        /* WAITING LOBBY (15-PLAYER ESPORTS LAYOUT) */
        <div className="flex-1 flex flex-col justify-between py-1 sm:py-2 relative z-10 w-full">
          <div>
            {/* 1. TOP HEADER: FETO GAMES | LOBBY (LEFT), WAITING FOR PLAYERS... (X/15) (RIGHT) */}
            <div className="bg-[#FFFFFF] rounded-2xl px-3.5 sm:px-6 py-2.5 sm:py-3.5 mb-4 flex items-center justify-between border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
              <div className="flex items-center gap-2 sm:gap-3">
                <BrandLogo size="nav" showSubtitle={false} />
                <span className="text-[#010101]/30 font-bold hidden sm:inline">|</span>
                <div className="px-2.5 py-1 rounded-xl bg-[#FEC90E] border-2 border-[#010101] text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#010101] shadow-[2px_2px_0px_#010101]">
                  LOBBY
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Streamer Mode (Hide Code) Toggle */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsStreamerMode(!isStreamerMode);
                    showToast(isStreamerMode ? 'Streamer Mode Disabled (Code Visible)' : 'Streamer Mode Active (Code Hidden for Streaming)');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border-2 border-[#010101] shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px] ${
                    isStreamerMode
                      ? 'bg-[#FEC90E] text-[#010101]'
                      : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                  }`}
                  title="Toggle Streamer Mode to hide room code & invite links for Twitch / YouTube / TikTok streaming"
                >
                  {isStreamerMode ? <EyeOff className="w-3.5 h-3.5 text-[#010101]" /> : <Eye className="w-3.5 h-3.5 text-[#010101]" />}
                  <span className="hidden sm:inline">Streamer Mode</span>
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-[#0B89FD] border-2 border-[#010101] text-white text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#010101]">
                  <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span className="hidden sm:inline">WAITING FOR PLAYERS...</span>
                  <span className="font-mono text-white font-black">({activePlayers.length}/15)</span>
                </div>
              </div>
            </div>

            {/* 2. LARGE BOLD ROOM CODE DISPLAY + COPY INVITE LINK + PLAYERS COUNTER */}
            <div className="bg-[#FFFFFF] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 w-full sm:w-auto">
                {/* Large Room Code Display */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-[#525252]">
                    ROOM:
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="group flex items-center gap-2 px-3.5 py-1.5 bg-[#F8F8F8] border-2 border-[#010101] hover:bg-[#FFFFFF] rounded-xl transition-all shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px]"
                    title="Click to copy Room Code"
                  >
                    <span className="text-xl sm:text-3xl font-black text-[#010101] tracking-widest font-mono">
                      {isStreamerMode ? 'FG-••••' : roomCode}
                    </span>
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-[#0B89FD]" />
                    ) : (
                      <Copy className="w-4 h-4 text-[#010101] group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>

                {/* Players Counter Pill */}
                <div className="px-3 py-1.5 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] text-[#010101] font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[2px_2px_0px_#010101]">
                  <Users className="w-4 h-4 text-[#0B89FD]" />
                  <span>Players: <strong className="text-[#010101] font-mono font-black">{activePlayers.length}</strong> / 15</span>
                </div>

                {/* PIN Protected indicator */}
                {room.config.hasPin && (
                  <div className="px-2.5 py-1 rounded-xl bg-[#FD3F01]/10 border-2 border-[#FD3F01] text-[#FD3F01] text-[10px] sm:text-xs font-black flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-[#FD3F01]" />
                    <span>PIN Protected</span>
                  </div>
                )}
              </div>

              {/* Action Controls: Room Settings, Custom Cards, Sip Button, Sound Toggle, Leave Room */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end">
                {/* LIVE IN-ROOM SETTINGS BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowSettingsModal(true);
                  }}
                  className="h-9 sm:h-10 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F8F8F8] border-2 border-[#010101] text-[#010101] text-xs font-black inline-flex items-center justify-center shrink-0 gap-1.5 transition-all shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px] touch-manipulation"
                  title="Live In-Room Settings Editor"
                  aria-label="Room Settings"
                >
                  <Settings className="w-4 h-4 text-[#010101] shrink-0" strokeWidth={2.5} />
                  <span>Settings</span>
                </button>

                {room.config.vibeMode === 'sip_edition' && (
                  <button
                    onClick={handleQuickTakeSip}
                    className="h-9 sm:h-10 px-3 rounded-xl bg-[#FD3F01] hover:bg-[#e03800] border-2 border-[#010101] text-white text-xs font-black inline-flex items-center justify-center shrink-0 gap-1.5 transition-all shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px] touch-target"
                    title="Take a drink & log it on the leaderboard!"
                  >
                    <Wine className="w-4 h-4 text-white shrink-0" strokeWidth={2.5} />
                    <span>Take Sip! 🥤</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 bg-white text-[#FD3F01] rounded-full border border-[#010101] font-black shrink-0">
                      {room.sipsCount?.[currentPlayer?.id || ''] || 0}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowCustomCardModal(true);
                  }}
                  className="h-9 sm:h-10 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F8F8F8] border-2 border-[#010101] text-[#010101] text-xs font-black inline-flex items-center justify-center shrink-0 gap-1.5 transition-all shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px] touch-target"
                  title="Submit your own question or dare"
                >
                  <PlusCircle className="w-4 h-4 text-[#0B89FD] shrink-0" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Custom Card</span>
                  {room.customCardsCount ? (
                    <span className="font-mono text-[10px] px-1 py-0.2 bg-[#FEC90E] border border-[#010101] rounded-full text-[#010101] font-black shrink-0">
                      +{room.customCardsCount}
                    </span>
                  ) : null}
                </button>

                <RoomLobbyQRCode roomCode={roomCode} isStreamerMode={isStreamerMode} />

                <SoundToggle />

                <button
                  onClick={handleCopyInviteLink}
                  className="h-9 sm:h-10 px-3.5 rounded-xl bg-[#0B89FD] hover:bg-[#0977db] text-white border-2 border-[#010101] text-xs font-black inline-flex items-center justify-center shrink-0 gap-1.5 shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px] transition-all touch-target"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-white shrink-0" strokeWidth={2.5} />
                  ) : (
                    <Share2 className="w-4 h-4 text-white shrink-0" strokeWidth={2.5} />
                  )}
                  <span>{copiedLink ? 'Copied!' : 'Invite'}</span>
                </button>

                <button
                  onClick={handleLeaveRoom}
                  className="w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center shrink-0 rounded-xl bg-[#FFFFFF] hover:bg-[#FD3F01] hover:text-white border-2 border-[#010101] text-[#010101] shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px] transition-all touch-target"
                  title="Leave Room"
                >
                  <LogOut className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* MULTI-GAME PLAYLIST SELECTION (QUEUE) */}
            <div className="mb-5">
              <GamePlaylistQueue
                selectedGames={room.selectedGames || (room.config.selectedGames || [room.config.gameMode || 'who_is_imposter'])}
                currentGameIndex={room.currentGameIndex || 0}
                isHost={Boolean(isHost)}
                onUpdatePlaylist={handleUpdatePlaylist}
              />
            </div>

            {/* TEAM SQUAD SELECTOR (IF TEAM MODE ENABLED) */}
            {room.config.isTeamMode && (
              <div className="mb-5 p-3.5 sm:p-5 rounded-2xl glass-panel-neon border border-cyan-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-300">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Teams Mode Active — Blue vs Red Squad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Your Team:{' '}
                      <strong className={currentPlayer?.team === 'red' ? 'text-pink-400 font-black' : 'text-cyan-400 font-black'}>
                        {currentPlayer?.team === 'red' ? 'Team B (Red)' : 'Team A (Blue)'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        const targetTeam = currentPlayer?.team === 'blue' ? 'red' : 'blue';
                        socketSelectTeam(targetTeam as PlayerTeam);
                      }}
                      className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/40 hover:to-purple-500/40 border border-cyan-400/50 rounded-xl text-xs font-black text-cyan-300 transition-all shadow-neon-cyan flex items-center gap-1.5 touch-target"
                    >
                      <span>Switch Team ⇄</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Team A (Cyan Blue) */}
                  <div className="p-3.5 rounded-xl border border-cyan-500/50 bg-cyan-950/30 shadow-neon-cyan flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                          <span className="font-black text-xs uppercase tracking-wider text-cyan-300">
                            Team A (Neon Cyan)
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          {activePlayers.filter((p) => p.team !== 'red').length} Players
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center py-1">
                        {activePlayers
                          .filter((p) => p.team !== 'red')
                          .map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-bold text-cyan-200 flex items-center gap-1"
                            >
                              <span>{NEON_AVATARS[p.avatar]?.emoji || '👾'}</span>
                              <span>{p.username}</span>
                              {p.id === currentPlayer?.id && (
                                <span className="text-[9px] text-cyan-400 font-extrabold">(You)</span>
                              )}
                            </span>
                          ))}
                      </div>
                    </div>
                    {currentPlayer?.team !== 'blue' && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          socketSelectTeam('blue');
                        }}
                        className="mt-3 w-full py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-[11px] font-black uppercase tracking-wider transition-all"
                      >
                        Join Team A (Blue)
                      </button>
                    )}
                  </div>

                  {/* Team B (Pink / Purple Red) */}
                  <div className="p-3.5 rounded-xl border border-pink-500/50 bg-pink-950/30 shadow-neon-magenta flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
                          <span className="font-black text-xs uppercase tracking-wider text-pink-300">
                            Team B (Neon Pink)
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-pink-300">
                          {activePlayers.filter((p) => p.team === 'red').length} Players
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center py-1">
                        {activePlayers
                          .filter((p) => p.team === 'red')
                          .map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 rounded-lg bg-pink-950/80 border border-pink-500/40 text-[10px] font-bold text-pink-200 flex items-center gap-1"
                            >
                              <span>{NEON_AVATARS[p.avatar]?.emoji || '👾'}</span>
                              <span>{p.username}</span>
                              {p.id === currentPlayer?.id && (
                                <span className="text-[9px] text-pink-400 font-extrabold">(You)</span>
                              )}
                            </span>
                          ))}
                      </div>
                    </div>
                    {currentPlayer?.team === 'blue' && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          socketSelectTeam('red');
                        }}
                        className="mt-3 w-full py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/50 text-pink-300 text-[11px] font-black uppercase tracking-wider transition-all"
                      >
                        Join Team B (Pink)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. MAIN AREA: LEFT/CENTER = 5x3 STRUCTURED 15-SLOT GRID | RIGHT = GAME SETTINGS SIDEBAR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-start">
              {/* LEFT/CENTER AREA: 5x3 STRUCTURED GRID OF 15 GLOWING PLAYER SLOTS */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-[#010101] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0B89FD]" />
                    <span>Lobby Slots (5 × 3 Grid)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#0B89FD] border-2 border-[#010101] text-white shadow-[2px_2px_0px_#010101]">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      {activePlayers.filter((p) => p.isReady).length} / {activePlayers.length} READY
                    </span>
                  </div>
                </div>

                {/* 5x3 STRUCTURED 15-SLOT GRID */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3">
                  {Array.from({ length: 15 }).map((_, index) => {
                    const player = activePlayers[index];
                    const slotNum = index + 1;

                    if (player) {
                      const isDisconnected = player.connectionStatus === 'disconnected_grace';
                      const remainingGrace = graceCountdowns[player.id] ?? 45;

                      return (
                        <motion.div
                          key={player.id}
                          layout
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`relative bg-[#FFFFFF] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between text-center transition-all min-h-[145px] sm:min-h-[165px] border-2 border-[#010101] ${
                            player.isReady
                              ? 'shadow-[4px_4px_0px_#010101]'
                              : isDisconnected
                              ? 'border-[#FD3F01] bg-[#FD3F01]/10 shadow-[2px_2px_0px_#010101]'
                              : 'shadow-[2px_2px_0px_#010101]'
                          }`}
                        >
                          {/* TOP PILL BADGE: BLUE READY OR MUTED NOT READY */}
                          <div className="w-full mb-1">
                            {isDisconnected ? (
                              <div className="w-full py-0.5 px-1 bg-[#FD3F01] border-2 border-[#010101] rounded-lg text-white text-[9px] font-black flex items-center justify-center gap-1 animate-pulse">
                                <Clock className="w-2.5 h-2.5 text-white" />
                                <span>{remainingGrace}s</span>
                              </div>
                            ) : player.isReady ? (
                              <div className="w-full py-0.5 px-1 bg-[#0B89FD] border-2 border-[#010101] rounded-lg text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center gap-1 shadow-[1px_1px_0px_#010101]">
                                <CheckCircle2 className="w-3 h-3 text-white flex-shrink-0" />
                                <span>READY ✓</span>
                              </div>
                            ) : (
                              <div className="w-full py-0.5 px-1 bg-[#F8F8F8] border border-[#010101] rounded-lg text-[#525252] text-[9px] sm:text-[10px] font-black truncate">
                                NOT READY
                              </div>
                            )}
                          </div>

                          {/* AVATAR FRAME */}
                          <div className="relative my-1">
                            {/* Golden Host Crown Badge */}
                            {player.isHost && (
                              <div
                                className="absolute -top-2.5 -right-2.5 z-10 p-1 bg-[#FEC90E] border-2 border-[#010101] rounded-full shadow-[2px_2px_0px_#010101] transform rotate-12"
                                title="Room Host"
                              >
                                <Crown className="w-3 h-3 text-[#010101] fill-[#010101]" />
                              </div>
                            )}

                            <NeonAvatarDisplay
                              avatarId={player.avatar}
                              size="sm"
                              showGlow={false}
                              isReady={player.isReady}
                            />
                          </div>

                          {/* BOLD USERNAME UNDERNEATH */}
                          <div className="w-full truncate mt-1">
                            <div className="font-black text-xs text-[#010101] truncate px-0.5">
                              {player.username}
                              {player.id === currentPlayer?.id && (
                                <span className="ml-1 text-[9px] text-[#0B89FD] font-black">(You)</span>
                              )}
                            </div>

                            {/* Squad Badge if Team Mode */}
                            {room.config.isTeamMode && player.team && (
                              <div
                                className={`mt-0.5 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase inline-block border border-[#010101] ${
                                  player.team === 'red'
                                    ? 'bg-[#FD3F01] text-white'
                                    : player.team === 'blue'
                                    ? 'bg-[#0B89FD] text-white'
                                    : 'bg-[#FEC90E] text-[#010101]'
                                }`}
                              >
                                {player.team}
                              </div>
                            )}
                          </div>

                          {/* Host Kick Option */}
                          {isHost && player.id !== currentPlayer?.id && player.id !== room.hostId && !player.isHost ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setKickTarget(player);
                              }}
                              className="mt-1 text-[10px] text-[#FD3F01] hover:bg-[#FD3F01] hover:text-white bg-[#FFFFFF] font-black inline-flex items-center justify-center shrink-0 gap-1 py-1 px-2.5 rounded-lg border-2 border-[#010101] shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px] transition-all relative z-20 pointer-events-auto touch-manipulation"
                              title={`Kick ${player.username}`}
                            >
                              <UserX className="w-3 h-3 text-current shrink-0" strokeWidth={2.5} />
                              <span>Kick</span>
                            </button>
                          ) : (
                            <div className="h-3" />
                          )}
                        </motion.div>
                      );
                    }

                    // EMPTY SLOT PLACEHOLDER
                    return (
                      <div
                        key={`slot-${index}`}
                        className="rounded-2xl border-2 border-dashed border-[#010101]/30 bg-[#FFFFFF]/60 flex flex-col items-center justify-center p-2.5 text-center text-[#737373] select-none min-h-[145px] sm:min-h-[165px]"
                      >
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#010101]/30 flex items-center justify-center mb-1 text-[#010101]/50 text-xs font-black">
                          ...
                        </div>
                        <span className="text-[10px] font-black text-[#525252] uppercase tracking-wider">
                          Slot #{slotNum}
                        </span>
                        <span className="text-[9px] text-[#737373] font-semibold">Open</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT SIDEBAR: BOLD BAUHAUS GAME SETTINGS PANEL */}
              <div className="lg:col-span-4 bg-[#FFFFFF] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] flex flex-col justify-between">
                <div>
                  {/* Panel Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#010101]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-[#FEC90E] text-[#010101] border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                        <Sliders className="w-4 h-4 text-[#010101]" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-[#010101] uppercase tracking-wider">
                          Game Settings
                        </h3>
                        <p className="text-[10px] text-[#525252] font-semibold">
                          {isHost ? 'Host controls & match configuration' : 'Match settings locked by host'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settings Controls */}
                  <div className="space-y-4">
                    {/* 1. 10-GAME SELECTOR */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#010101]">
                          Selected Game (10 Modes)
                        </label>
                        <span className="text-[10px] text-[#0B89FD] font-black uppercase">
                          {room.config.gameMode?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Visual Interactive Cards */}
                      <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1 mb-2">
                        {[
                          { id: 'who_is_imposter', title: 'Imposter', emoji: '🎭', players: '3-15p' },
                          { id: 'draw_and_guess', title: 'Draw & Guess', emoji: '🎨', players: '2-15p' },
                          { id: 'quiz_battle', title: 'Quiz Battle', emoji: '🧠', players: '2-15p' },
                          { id: 'word_battle', title: 'Word Battle', emoji: '🔤', players: '2-15p' },
                          { id: 'truth_or_dare', title: 'Truth / Dare', emoji: '🔥', players: '2-15p' },
                          { id: 'never_have_i_ever', title: 'Never Have I', emoji: '🤫', players: '2-15p' },
                          { id: 'most_likely_to', title: 'Most Likely', emoji: '👑', players: '2-15p' },
                          { id: 'sip_or_spill', title: 'Sip or Spill', emoji: '🥤', players: '2-15p' },
                          { id: 'silly_roulette', title: 'Silly Roulette', emoji: '🎯', players: '2-15p' },
                          { id: 'hot_potato', title: 'Hot Potato', emoji: '🥔', players: '2-15p' }
                        ].map((g) => {
                          const isSelected = room.config.gameMode === g.id;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              disabled={!isHost}
                              onClick={() => {
                                sound.playClick();
                                socketUpdateSettings({ gameMode: g.id as GameMode });
                              }}
                              className={`p-2 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                                isSelected
                                  ? 'border-[#010101] bg-[#FEC90E] text-[#010101] shadow-[2px_2px_0px_#010101]'
                                  : 'border-[#010101] bg-[#F8F8F8] text-[#010101] hover:bg-[#FFFFFF]'
                              } ${!isHost ? 'cursor-default' : 'cursor-pointer active:translate-x-[1px] active:translate-y-[1px]'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-base">{g.emoji}</span>
                                <span className="text-[9px] font-mono text-[#525252] font-black">{g.players}</span>
                              </div>
                              <span className="text-[11px] font-black truncate mt-1">{g.title}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Select dropdown fallback / quick-select */}
                      {isHost && (
                        <div className="relative">
                          <select
                            value={room.config.gameMode}
                            onChange={(e) => {
                              sound.playClick();
                              socketUpdateSettings({ gameMode: e.target.value as GameMode });
                            }}
                            className="w-full bg-[#F8F8F8] border-2 border-[#010101] rounded-xl px-3 py-1.5 text-xs font-black text-[#010101] outline-none cursor-pointer appearance-none hover:bg-[#FFFFFF] transition-all"
                          >
                            <option value="who_is_imposter">🎭 Who Is The Imposter? (3-15p)</option>
                            <option value="draw_and_guess">🎨 Draw & Guess (2-15p)</option>
                            <option value="quiz_battle">🧠 Quiz Battle (2-15p)</option>
                            <option value="word_battle">🔤 Word Battle (2-15p)</option>
                            <option value="truth_or_dare">🔥 Truth or Dare (2-15p)</option>
                            <option value="never_have_i_ever">🤫 Never Have I Ever (2-15p)</option>
                            <option value="most_likely_to">👑 Most Likely To... (2-15p)</option>
                            <option value="sip_or_spill">🥤 Sip or Spill (2-15p)</option>
                            <option value="silly_roulette">🎯 Silly Roulette (2-15p)</option>
                            <option value="hot_potato">🥔 Hot Potato (2-15p)</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-[#010101] absolute right-3 top-2 pointer-events-none" />
                        </div>
                      )}
                    </div>

                    {/* 2. MATCH MODE: SOLO VS TEAMS */}
                    <div className="p-3 rounded-2xl bg-[#F8F8F8] border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-[#010101]" />
                          <span className="text-xs font-black text-[#010101]">Match Mode</span>
                        </div>
                        {isHost ? (
                          <div className="flex items-center bg-[#FFFFFF] p-0.5 rounded-xl border-2 border-[#010101]">
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                socketUpdateSettings({ isTeamMode: false, mode: 'solo' });
                              }}
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                                !room.config.isTeamMode
                                  ? 'bg-[#0B89FD] text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101]'
                                  : 'text-[#010101] hover:bg-[#F8F8F8]'
                              }`}
                            >
                              Solo
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                socketUpdateSettings({ isTeamMode: true, mode: 'teams' });
                              }}
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                                room.config.isTeamMode
                                  ? 'bg-[#FEC90E] text-[#010101] border-2 border-[#010101] shadow-[2px_2px_0px_#010101]'
                                  : 'text-[#010101] hover:bg-[#F8F8F8]'
                              }`}
                            >
                              Teams
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-black uppercase text-[#0B89FD]">
                            {room.config.isTeamMode ? 'Teams Mode' : 'Solo FFA'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#010101]/70 font-medium">
                        {room.config.isTeamMode
                          ? 'Blue Squad vs Red Squad (Team victory)'
                          : 'Free-For-All (Individual points & leaderboard)'}
                      </p>
                    </div>

                    {/* 3. SOLO TEST / DEV MODE TOGGLE (HOST ONLY) */}
                    {isHost && (
                      <div className="p-3 rounded-2xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#FEC90E]" />
                          <div>
                            <div className="text-xs font-black text-[#010101]">Solo Test / Dev Mode</div>
                            <div className="text-[9px] text-[#010101]/70 font-medium">Allow 1 player to launch & test any mode</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSoloDevMode}
                          onChange={(e) => {
                            sound.playClick();
                            const next = e.target.checked;
                            setIsSoloDevMode(next);
                            socketUpdateSettings({ isSoloDevMode: next });
                          }}
                          className="w-4 h-4 accent-[#0B89FD] rounded cursor-pointer border-2 border-[#010101]"
                        />
                      </div>
                    )}

                    {/* 4. PARTY VIBE MODE */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#010101]">
                          Party Vibe Mode
                        </label>
                        <span className="text-[#0B89FD] font-black text-[10px] uppercase">
                          {room.config.vibeMode?.replace('_', ' ') || 'chill'}
                        </span>
                      </div>
                      {isHost ? (
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'chill', label: 'Chill' },
                            { id: 'chaotic', label: 'Chaos' },
                            { id: 'sip_edition', label: 'Sips 🥤' }
                          ].map((vibe) => (
                            <button
                              key={vibe.id}
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                socketUpdateSettings({ vibeMode: vibe.id as any });
                              }}
                              className={`py-1.5 rounded-xl border-2 border-[#010101] text-[11px] font-black transition-all ${
                                (room.config.vibeMode || 'chill') === vibe.id
                                  ? 'bg-[#0B89FD] text-white shadow-[2px_2px_0px_#010101]'
                                  : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                              }`}
                            >
                              {vibe.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] text-xs font-black text-[#010101] capitalize">
                          {room.config.vibeMode?.replace('_', ' ') || 'Chill & Funny'}
                        </div>
                      )}
                    </div>

                    {/* 5. ROUNDS SELECTOR */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#010101]">
                          Rounds
                        </label>
                        <span className="text-[#010101] font-black text-xs">{room.config.totalRounds || 5} Rounds</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <button
                          type="button"
                          disabled={!isHost || (room.config.totalRounds || 5) <= 1}
                          onClick={() => {
                            sound.playClick();
                            const next = Math.max(1, (room.config.totalRounds || 5) - 1);
                            socketUpdateSettings({ totalRounds: next });
                          }}
                          className="w-8 h-8 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#FEC90E] text-[#010101] font-black flex items-center justify-center disabled:opacity-40"
                        >
                          -
                        </button>
                        <div className="flex-1 py-1 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] text-center font-black text-[#010101] text-xs">
                          {room.config.totalRounds || 5} Rounds
                        </div>
                        <button
                          type="button"
                          disabled={!isHost || (room.config.totalRounds || 5) >= 15}
                          onClick={() => {
                            sound.playClick();
                            const next = Math.min(15, (room.config.totalRounds || 5) + 1);
                            socketUpdateSettings({ totalRounds: next });
                          }}
                          className="w-8 h-8 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#FEC90E] text-[#010101] font-black flex items-center justify-center disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[3, 5, 7, 10].map((rounds) => (
                          <button
                            key={rounds}
                            type="button"
                            disabled={!isHost}
                            onClick={() => {
                              sound.playClick();
                              socketUpdateSettings({ totalRounds: rounds });
                            }}
                            className={`py-1 rounded-xl border-2 border-[#010101] text-[11px] font-black transition-all ${
                              (room.config.totalRounds || 5) === rounds
                                ? 'bg-[#FEC90E] text-[#010101] shadow-[2px_2px_0px_#010101]'
                                : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                            }`}
                          >
                            {rounds}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 6. TIMER SELECTOR */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#010101]">
                          Timer (Sec / Turn)
                        </label>
                        <span className="text-[#0B89FD] font-black text-xs">{room.config.roundDurationSeconds || 30}s</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <button
                          type="button"
                          disabled={!isHost || (room.config.roundDurationSeconds || 30) <= 10}
                          onClick={() => {
                            sound.playClick();
                            const next = Math.max(10, (room.config.roundDurationSeconds || 30) - 5);
                            socketUpdateSettings({ roundDurationSeconds: next });
                          }}
                          className="w-8 h-8 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#0B89FD] hover:text-white text-[#010101] font-black flex items-center justify-center disabled:opacity-40"
                        >
                          -
                        </button>
                        <div className="flex-1 py-1 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] text-center font-black text-[#010101] text-xs">
                          {room.config.roundDurationSeconds || 30} Seconds
                        </div>
                        <button
                          type="button"
                          disabled={!isHost || (room.config.roundDurationSeconds || 30) >= 180}
                          onClick={() => {
                            sound.playClick();
                            const next = Math.min(180, (room.config.roundDurationSeconds || 30) + 5);
                            socketUpdateSettings({ roundDurationSeconds: next });
                          }}
                          className="w-8 h-8 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#0B89FD] hover:text-white text-[#010101] font-black flex items-center justify-center disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[20, 30, 45, 60].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            disabled={!isHost}
                            onClick={() => {
                              sound.playClick();
                              socketUpdateSettings({ roundDurationSeconds: sec });
                            }}
                            className={`py-1 rounded-xl border-2 border-[#010101] text-[11px] font-black transition-all ${
                              (room.config.roundDurationSeconds || 30) === sec
                                ? 'bg-[#0B89FD] text-white shadow-[2px_2px_0px_#010101]'
                                : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 7. MAX PLAYERS SELECTOR */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-[#010101]">
                          Max Players
                        </label>
                        <span className="text-[#010101] font-black text-xs">{room.config.maxPlayers || 15} Players</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <button
                          type="button"
                          disabled={!isHost || (room.config.maxPlayers || 15) <= 2}
                          onClick={() => {
                            sound.playClick();
                            const next = Math.max(2, (room.config.maxPlayers || 15) - 1);
                            socketUpdateSettings({ maxPlayers: next });
                          }}
                          className="w-8 h-8 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#FEC90E] text-[#010101] font-black flex items-center justify-center disabled:opacity-40"
                        >
                          -
                        </button>
                        <div className="flex-1 py-1 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] text-center font-black text-[#010101] text-xs">
                          {room.config.maxPlayers || 15} Capacity
                        </div>
                        <button
                          type="button"
                          disabled={!isHost || (room.config.maxPlayers || 15) >= 15}
                          onClick={() => {
                            sound.playClick();
                            const next = Math.min(15, (room.config.maxPlayers || 15) + 1);
                            socketUpdateSettings({ maxPlayers: next });
                          }}
                          className="w-8 h-8 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#FEC90E] text-[#010101] font-black flex items-center justify-center disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[4, 8, 12, 15].map((count) => (
                          <button
                            key={count}
                            type="button"
                            disabled={!isHost}
                            onClick={() => {
                              sound.playClick();
                              socketUpdateSettings({ maxPlayers: count });
                            }}
                            className={`py-1 rounded-xl border-2 border-[#010101] text-[11px] font-black transition-all ${
                              (room.config.maxPlayers || 15) === count
                                ? 'bg-[#FEC90E] text-[#010101] shadow-[2px_2px_0px_#010101]'
                                : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                            }`}
                          >
                            {count}p
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 8. DIFFICULTY SELECTOR */}
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-[#010101] mb-1">
                        Match Intensity
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'casual', label: 'Casual' },
                          { id: 'standard', label: 'Standard' },
                          { id: 'wild', label: 'Wild' }
                        ].map((diff) => (
                          <button
                            key={diff.id}
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setDifficultySetting(diff.id as any);
                            }}
                            className={`py-1.5 rounded-xl border-2 border-[#010101] text-[11px] font-black transition-all ${
                              difficultySetting === diff.id
                                ? 'bg-[#FD3F01] text-white shadow-[2px_2px_0px_#010101]'
                                : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                            }`}
                          >
                            {diff.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Live Player Management List */}
                <div className="mt-5 pt-3 border-t-2 border-[#010101]/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#010101]">
                      Connected ({activePlayers.length}/15)
                    </span>
                    <span className="text-[10px] text-[#0B89FD] font-black">
                      {activePlayers.filter((p) => p.isReady).length} Ready
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {activePlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">{NEON_AVATARS[player.avatar]?.emoji || '👾'}</span>
                          <span className="font-bold text-[#010101] truncate">{player.username}</span>
                          {player.isHost && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#FEC90E] text-[#010101] border border-[#010101] font-black">
                              HOST
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-black uppercase ${
                              player.isReady ? 'text-[#0B89FD]' : 'text-[#FD3F01]'
                            }`}
                          >
                            {player.isReady ? '✓ READY' : 'WAITING'}
                          </span>
                          {isHost && player.id !== currentPlayer?.id && player.id !== room.hostId && !player.isHost && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setKickTarget(player);
                              }}
                              className="text-[#FD3F01] hover:bg-[#FD3F01] hover:text-white w-7 h-7 inline-flex items-center justify-center shrink-0 rounded-lg border-2 border-[#010101] shadow-[2px_2px_0px_#010101] transition-all relative z-20 pointer-events-auto active:translate-x-[1px] active:translate-y-[1px]"
                              title={`Kick ${player.username}`}
                            >
                              <UserX className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. BOTTOM CENTER: WIDE BRIGHT GRADIENT CYAN-TO-PURPLE GLOWING START GAME ▶ PLAY BUTTON */}
          <div className="bg-[#FFFFFF] rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-2 border-[#010101] sticky bottom-2 z-20 shadow-[6px_6px_0px_#010101] safe-bottom">
            {/* Player Info Preview */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {currentPlayer && (
                <NeonAvatarDisplay avatarId={currentPlayer.avatar} size="sm" showGlow={false} />
              )}
              <div>
                <div className="text-[11px] text-[#010101]/70 font-bold uppercase tracking-wider">Playing as</div>
                <div className="text-sm sm:text-base font-black text-[#010101] flex items-center gap-2">
                  <span>{currentPlayer?.username}</span>
                  {isHost && (
                    <span className="px-2 py-0.5 bg-[#FEC90E] text-[#010101] border-2 border-[#010101] text-[9px] sm:text-[10px] font-black rounded-full shadow-[1px_1px_0px_#010101]">
                      HOST
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Ready Toggle + Host Start / Force Start Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
              {/* Ready Status Toggle */}
              <button
                onClick={handleToggleReady}
                className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 touch-target border-2 border-[#010101] active:translate-x-[2px] active:translate-y-[2px] ${
                  currentPlayer?.isReady
                    ? 'bg-[#0B89FD] hover:bg-[#0977db] text-white shadow-[4px_4px_0px_#010101] active:shadow-[2px_2px_0px_#010101]'
                    : 'bg-[#FFFFFF] hover:bg-[#F8F8F8] text-[#010101] shadow-[4px_4px_0px_#010101] active:shadow-[2px_2px_0px_#010101]'
                }`}
              >
                {currentPlayer?.isReady ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>READY ✓ (CLICK TO UNREADY)</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-[#FEC90E]" />
                    <span>I'M READY!</span>
                  </>
                )}
              </button>

              {/* Host Controls */}
              {isHost && (
                <>
                  {/* Force Start Button: Active whenever 2+ players are present, even if some aren't ready */}
                  {activePlayers.length >= 2 && !allReady && (
                    <button
                      type="button"
                      onClick={() => handleStartGame(true)}
                      className="w-full sm:w-auto px-5 sm:px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 touch-target bg-[#FEC90E] hover:bg-[#fed338] text-[#010101] border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101]"
                      title="Force start match with currently connected players"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>⚡ FORCE START</span>
                    </button>
                  )}

                  {/* Primary Start Game Button */}
                  <button
                    onClick={() => handleStartGame(false)}
                    disabled={!allReady}
                    title={
                      !allReady
                        ? activePlayers.length < minRequired
                          ? isSoloDevMode
                            ? 'At least 1 player required'
                            : 'At least 2 players required'
                          : 'All players must click READY (or use Force Start)'
                        : 'Launch Match'
                    }
                    className={`w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm md:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 touch-target border-2 border-[#010101] active:translate-x-[2px] active:translate-y-[2px] ${
                      allReady
                        ? 'bg-[#0B89FD] hover:bg-[#0977db] text-white shadow-[4px_4px_0px_#010101] active:shadow-[2px_2px_0px_#010101] cursor-pointer'
                        : 'bg-[#E5E5E5] text-[#010101]/40 border-[#010101]/40 cursor-not-allowed opacity-60'
                    }`}
                    id="btn-start-game"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>START GAME ▶ PLAY</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3-SECOND COUNTDOWN OVERLAY                               */}
      {/* ======================================================== */}
      <AnimatePresence>
        {countdown !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010101]/90 backdrop-blur-sm">
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="text-8xl md:text-9xl font-black text-[#FD3F01] drop-shadow-[4px_4px_0px_#010101]">
                {countdown}
              </div>
              <p className="text-[#FFFFFF] font-black uppercase tracking-widest text-lg mt-4">
                Starting Game...
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* JOIN ROOM MODAL (For invite links or new sessions)        */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010101]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border-3 border-[#010101] shadow-[8px_8px_0px_#010101]"
            >
              <h3 className="text-2xl font-black text-[#010101] mb-1">Join Room {roomCode}</h3>
              <p className="text-xs text-[#010101]/70 mb-6 font-medium">Choose your avatar and nickname to enter.</p>

              {errorMessage && (
                <div className="mb-4 p-3 bg-[#FD3F01]/10 border-2 border-[#FD3F01] rounded-xl text-[#FD3F01] text-xs flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#FD3F01]" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleModalJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#010101] mb-1.5">
                    Your Nickname
                  </label>
                  <input
                    type="text"
                    value={joinUsername}
                    onChange={(e) => setJoinUsername(e.target.value.slice(0, 18))}
                    placeholder="Enter nickname..."
                    required
                    className="w-full bg-[#F8F8F8] border-2 border-[#010101] focus:border-[#0B89FD] rounded-xl px-4 py-3 text-[#010101] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#010101] mb-1.5">
                    Pick Avatar
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(NEON_AVATARS) as NeonAvatarId[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setJoinAvatar(key);
                        }}
                        aria-label={`Select avatar ${NEON_AVATARS[key].label || key}`}
                        className={`min-w-[44px] min-h-[44px] p-2 rounded-xl border-2 border-[#010101] flex items-center justify-center text-2xl transition-all select-none touch-manipulation font-emoji ${
                          joinAvatar === key
                            ? 'bg-[#0B89FD] text-white scale-105 shadow-[2px_2px_0px_#010101]'
                            : 'bg-[#FFFFFF] hover:bg-[#F8F8F8]'
                        }`}
                      >
                        <span role="img" aria-label={NEON_AVATARS[key].label || key} className="font-emoji">
                          {NEON_AVATARS[key].emoji}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#010101] mb-1.5">
                    Room PIN (If private)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-[#F8F8F8] border-2 border-[#010101] focus:border-[#FEC90E] rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-[#010101] font-black outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0B89FD] hover:bg-[#0977db] text-white border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] py-3.5 rounded-2xl font-black text-base mt-2"
                >
                  Enter Waiting Lobby
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* CONFIRM KICK MODAL                                       */}
      {/* ======================================================== */}
      <AnimatePresence>
        {kickTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010101]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-[#FFFFFF] p-6 rounded-3xl text-center space-y-4 border-3 border-[#010101] shadow-[8px_8px_0px_#010101]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FD3F01]/10 border-2 border-[#FD3F01] flex items-center justify-center mx-auto text-[#FD3F01]">
                <UserX className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-black text-[#010101]">Kick {kickTarget.username}?</h4>
              <p className="text-xs text-[#010101]/70 font-medium">
                Are you sure you want to remove this player from the room?
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setKickTarget(null)}
                  className="flex-1 py-2.5 bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] rounded-xl text-[#010101] font-bold text-xs hover:bg-[#F8F8F8]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmKick}
                  className="flex-1 py-2.5 bg-[#FD3F01] hover:bg-[#e03700] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] rounded-xl text-white font-black text-xs"
                >
                  Yes, Kick
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* CUSTOM CARDS SUBMISSION MODAL                            */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showCustomCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010101]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 border-3 border-[#010101] shadow-[8px_8px_0px_#010101]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#0B89FD] text-white border-2 border-[#010101]">
                    <PlusCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#010101] uppercase tracking-wider">
                      Submit Custom Card
                    </h3>
                    <p className="text-[11px] text-[#010101]/70 font-medium">
                      Inject your question or dare live into this room
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomCardModal(false)}
                  className="text-[#010101] hover:text-[#FD3F01] text-2xl font-black leading-none p-1"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmitCustomCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#010101] mb-1.5">
                    Card Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'general', label: 'Prompt' },
                      { id: 'dare', label: 'Dare' },
                      { id: 'confession', label: 'Spicy' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setCustomCardType(cat.id);
                        }}
                        className={`py-2 rounded-xl border-2 border-[#010101] text-xs font-black transition-all ${
                          customCardType === cat.id
                            ? 'bg-[#FEC90E] text-[#010101] shadow-[2px_2px_0px_#010101]'
                            : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#010101] mb-1.5">
                    Your Party Prompt / Challenge (English)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={160}
                    value={customCardPrompt}
                    onChange={(e) => setCustomCardPrompt(e.target.value)}
                    placeholder="e.g., Who is most likely to win a reality TV show? or Do an impression of your favorite movie villain..."
                    required
                    className="w-full bg-[#F8F8F8] border-2 border-[#010101] focus:border-[#0B89FD] rounded-xl p-3 text-[#010101] text-xs font-bold outline-none resize-none leading-relaxed"
                  />
                  <div className="text-right text-[10px] text-[#010101]/50 mt-1 font-bold">
                    {customCardPrompt.length}/160
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCard || !customCardPrompt.trim()}
                  className="w-full py-3.5 rounded-2xl bg-[#0B89FD] hover:bg-[#0977db] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmittingCard ? 'Injecting Card...' : 'Add to Match Rotation'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIVE IN-ROOM SETTINGS MODAL */}
      <RoomSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        room={room}
        isHost={Boolean(isHost)}
        onSave={handleSaveSettings}
      />

      {/* TACTICAL SABOTAGE POWER-UP DRAWER (DURING ACTIVE MATCHES) */}
      {(room.status === 'in_game' || room.status === 'playing') && currentPlayer && (
        <SabotageDrawer
          room={room}
          currentPlayer={currentPlayer}
          hasUsedPowerUp={hasUsedSabotage}
          onUsePowerUp={handleUseSabotage}
        />
      )}

      {/* FLOATING EMOJI REACTIONS OVERLAY */}
      <FloatingReactions />
    </div>
  );
}
