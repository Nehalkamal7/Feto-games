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
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
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
      const playerIdParam = currentPlayer?.id ? `?playerId=${currentPlayer.id}` : '';
      const res = await fetch(`/api/rooms/${roomCode}${playerIdParam}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.room) {
          setRoom(json.room);
          if (json.privateRole) {
            setPrivateRole(json.privateRole);
          }
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
  }, [roomCode, currentPlayer?.id]);

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
        if (data.privateRole) {
          setPrivateRole(data.privateRole);
        }
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
      showToast('Custom card added to party rotation!');
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
    } catch (err: any) {
      showToast(err.message || 'Failed to register sip.');
    }
  };

  // Grace timer countdown engine for disconnected players
  useEffect(() => {
    if (!room?.players) return;
    const graceMap: Record<string, number> = {};
    room.players.forEach((p) => {
      const disconnectedAt = (p as any).disconnectedAt;
      if (p.connectionStatus === 'disconnected_grace' && disconnectedAt) {
        const elapsedSec = Math.floor((Date.now() - disconnectedAt) / 1000);
        const remaining = Math.max(0, 45 - elapsedSec);
        graceMap[p.id] = remaining;
      }
    });
    setGraceCountdowns(graceMap);

    const interval = setInterval(() => {
      setGraceCountdowns((prev) => {
        const next: Record<string, number> = {};
        let changed = false;
        Object.entries(prev).forEach(([id, val]) => {
          const newVal = Math.max(0, val - 1);
          if (newVal !== val) changed = true;
          next[id] = newVal;
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [room?.players]);

  // Join or Reconnect Handler
  useEffect(() => {
    if (!roomCode) {
      router.push('/');
      return;
    }

    const socket = getSocket();

    const attemptReconnectionOrModal = () => {
      const storedToken = getReconnectToken(roomCode);
      const storedPlayerId = typeof window !== 'undefined' ? localStorage.getItem(`feto_player_${roomCode}`) : null;

      if (storedToken && storedPlayerId) {
        socketReconnectRoom({ reconnectToken: storedToken });
      } else {
        const defaultName = typeof window !== 'undefined' ? localStorage.getItem('feto_default_name') : null;
        const defaultAvatar = typeof window !== 'undefined' ? (localStorage.getItem('feto_default_avatar') as NeonAvatarId) : null;

        if (defaultName) {
          socketJoinRoom({ roomCode, username: defaultName, avatar: defaultAvatar || 'cyber_cat' });
        } else {
          setShowJoinModal(true);
          setIsInitializing(false);
        }
      }
    };

    if (socket.connected) {
      attemptReconnectionOrModal();
    } else {
      socket.once('connect', attemptReconnectionOrModal);
    }

    const handleRoomState = (newRoom: PublicRoomState) => {
      setIsInitializing(false);
      setShowJoinModal(false);
      setRoom(newRoom);

      const socketId = socket.id;
      const foundPlayer = newRoom.players.find((p) => (p as any).socketId === socketId || p.id === currentPlayer?.id);
      if (foundPlayer) {
        setCurrentPlayer(foundPlayer);
        localStorage.setItem(`feto_player_${roomCode}`, foundPlayer.id);
      }
    };

    const handleJoined = (data: { room: PublicRoomState; player: PlayerSummary; reconnectToken: string }) => {
      setIsInitializing(false);
      setShowJoinModal(false);
      setRoom(data.room);
      setCurrentPlayer(data.player);
      localStorage.setItem(`feto_player_${roomCode}`, data.player.id);
    };

    const handleRoomUpdated = (updatedRoom: PublicRoomState) => {
      setRoom(updatedRoom);
      if (currentPlayer) {
        const me = updatedRoom.players.find((p) => p.id === currentPlayer.id);
        if (me) setCurrentPlayer(me);
      }
    };

    const handleCountdownTick = (data: { count: number }) => {
      setCountdown(data.count);
      sound.playCountdownTick();
      if (data.count === 0) {
        setCountdown(null);
        sound.playGameStart();
      }
    };

    const handleTimerTick = (data: TimerTickPayload) => {
      setTimerState(data);
      if (data.remainingSeconds <= 3 && data.remainingSeconds > 0) {
        sound.playHeartbeat(data.remainingSeconds);
        sound.triggerHaptic(25);
      }
    };

    const handlePhaseChange = (data: GamePhaseChangePayload) => {
      setCurrentPhase(data);
      sound.playReady();
    };

    const handleSecretRole = (data: SecretRolePayload) => {
      setSecretRole(data);
    };

    const handlePrivateRole = (data: PrivateRolePayload) => {
      setPrivateRole(data);
    };

    const handleGameStateSync = (data: { gameMode: GameMode; state: any }) => {
      setGameStateSync(data);
      setCountdown(null);
    };

    const handleSabotageEffect = (data: {
      type: SabotageType;
      sourceUsername: string;
      targetUsername: string;
      targetPlayerId?: string;
    }) => {
      const isTarget = currentPlayer && data.targetPlayerId === currentPlayer.id;
      const msg = isTarget
        ? `⚠️ You were sabotaged by ${data.sourceUsername}!`
        : `⚡ ${data.sourceUsername} launched a power-up against ${data.targetUsername}!`;

      setSabotageAlertBanner(msg);
      sound.playSabotage();
      sound.triggerScreenShake(700);

      if (isTarget && data.type === 'blindfold') {
        setIsBlindfolded(true);
        setTimeout(() => setIsBlindfolded(false), 5000);
      }

      setTimeout(() => setSabotageAlertBanner(null), 4500);
    };

    const handleError = (data: { code: string; message: string }) => {
      setIsInitializing(false);
      setErrorMessage(data.message);
      showToast(data.message);

      if (data.code === 'ROOM_NOT_FOUND') {
        clearReconnectSession(roomCode);
        setTimeout(() => router.push('/'), 2500);
      } else if (data.code === 'INVALID_RECONNECT_TOKEN' || data.code === 'ROOM_FULL') {
        clearReconnectSession(roomCode);
        setShowJoinModal(true);
      }
    };

    socket.on('room_state', handleRoomState);
    socket.on('joined_room', handleJoined);
    socket.on('room_updated', handleRoomUpdated);
    socket.on('countdown_tick', handleCountdownTick);
    socket.on('timer_tick', handleTimerTick);
    socket.on('phase_change', handlePhaseChange);
    socket.on('secret_role', handleSecretRole);
    socket.on('private_role', handlePrivateRole);
    socket.on('game_state_sync', handleGameStateSync);
    socket.on('sabotage_triggered', handleSabotageEffect);
    socket.on('error', handleError);

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('joined_room', handleJoined);
      socket.off('room_updated', handleRoomUpdated);
      socket.off('countdown_tick', handleCountdownTick);
      socket.off('timer_tick', handleTimerTick);
      socket.off('phase_change', handlePhaseChange);
      socket.off('secret_role', handleSecretRole);
      socket.off('private_role', handlePrivateRole);
      socket.off('game_state_sync', handleGameStateSync);
      socket.off('sabotage_triggered', handleSabotageEffect);
      socket.off('error', handleError);
    };
  }, [roomCode, router, currentPlayer?.id, showToast]);

  const isHost = currentPlayer?.isHost;

  const handleToggleReady = () => {
    if (!currentPlayer) return;
    const nextState = !currentPlayer.isReady;
    if (nextState) sound.playReady();
    else sound.playClick();
    socketSetReady({ isReady: nextState });
  };

  const handleStartGame = async (force = false) => {
    sound.playGameStart();
    try {
      const res = await socketStartGame(isSoloDevMode, force);
      if (res?.privateRole) {
        setPrivateRole(res.privateRole);
      }
      if (res?.gameState) {
        setGameStateSync({
          gameMode: room?.config.gameMode || 'who_is_imposter',
          state: res.gameState
        });
      }
      if (res?.room) {
        setRoom(res.room);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to start');
    }
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      sound.playClick();
      showToast('Room Code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyInviteLink = () => {
    if (navigator.clipboard) {
      const inviteUrl = `${window.location.origin}/room/${roomCode}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      sound.playClick();
      showToast('Invite Link copied! Share with friends.');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleLeaveRoom = () => {
    sound.playClick();
    socketLeaveRoom();
    clearReconnectSession(roomCode);
    router.push('/');
  };

  const handleConfirmKick = () => {
    if (!kickTarget) return;
    sound.playClick();
    socketKickPlayer({ targetPlayerId: kickTarget.id });
    setKickTarget(null);
    showToast(`Player ${kickTarget.username} removed.`);
  };

  const handleSaveSettings = async (newSettings: {
    roomName: string;
    maxPlayers: number;
    roundDurationSeconds: number;
    totalRounds: number;
    vibeMode: any;
    isPrivate: boolean;
    pin?: string;
  }): Promise<void> => {
    sound.playClick();
    await socketUpdateSettings(newSettings);
    setShowSettingsModal(false);
    showToast('Match settings updated!');
  };

  const handleUpdatePlaylist = (games: GameMode[]) => {
    sound.playClick();
    socketSelectGames(games);
    showToast(`Playlist updated with ${games.length} games.`);
  };

  const handleUseSabotage = async (type: SabotageType, targetId: string): Promise<void> => {
    if (hasUsedSabotage) return;
    setHasUsedSabotage(true);
    sound.playClick();

    const socket = getSocket();
    socket.emit('use_sabotage', {
      roomCode,
      sabotageType: type,
      targetPlayerId: targetId
    });

    showToast(`Deployed ${type.replace('_', ' ')}!`);
  };

  const handleModalJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinUsername.trim()) return;

    sound.playClick();
    localStorage.setItem('feto_default_name', joinUsername.trim());
    localStorage.setItem('feto_default_avatar', joinAvatar);

    socketJoinRoom({
      roomCode,
      username: joinUsername.trim(),
      avatar: joinAvatar,
      pin: joinPin.trim() || undefined
    });
  };

  const activePlayers = React.useMemo(() => {
    if (!room?.players) return [];
    const deduped: PlayerSummary[] = [];
    const seen = new Set<string>();
    for (const p of room.players) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
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
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-900 font-bold tracking-wide text-sm">
            Connecting to FETO Room {roomCode}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F9FAFB] text-gray-900 flex flex-col justify-between max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 relative safe-top safe-bottom overflow-x-hidden overflow-y-auto">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-gray-900 text-xs md:text-sm font-semibold shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sabotage Alert Banner */}
      <AnimatePresence>
        {sabotageAlertBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-gray-900 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg flex items-center gap-2.5"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{sabotageAlertBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blindfold Sabotage Overlay */}
      <AnimatePresence>
        {isBlindfolded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 backdrop-blur-xl bg-gray-900/80 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <span className="text-5xl mb-4 animate-bounce">🕶️</span>
            <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">
              Blindfold Active!
            </h2>
            <p className="text-sm text-gray-300 max-w-sm">
              An opponent fogged your vision with a tactical sabotage! Clearing up shortly...
            </p>
            <div className="w-48 h-2 bg-gray-700 rounded-full mt-6 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="h-full bg-blue-500"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IN-GAME OR LOBBY DISPLAY */}
      {room.status === 'in_game' || room.status === 'playing' || room.status === 'countdown' ? (
        /* IN-GAME ACTIVE SCREEN - COMPACT MOBILE OPTIMIZED (NEVER CLIPS) */
        <div className="flex-1 flex flex-col items-center justify-start py-2 relative z-10 w-full max-w-md mx-auto px-2 sm:px-4 overflow-x-hidden min-h-[600px]">
          {/* COMPACT TOP NAVBAR: BRAND LOGO LEFT, ROOM CODE + ROUND + SOUND + LEAVE RIGHT */}
          <div className="w-full bg-white rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 mb-4 flex items-center justify-between gap-2 border border-gray-200 shadow-sm shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <BrandLogo size="nav" showSubtitle={false} />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200 text-[11px] sm:text-xs font-bold text-gray-700 font-mono">
                {roomCode}
              </div>
              <div className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] sm:text-xs font-bold text-blue-700 whitespace-nowrap">
                {room.currentRound}/{room.config.totalRounds}
              </div>
              <SoundToggle />
              <button
                onClick={handleLeaveRoom}
                className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 transition-all"
                title="Leave Room"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
              <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Match Starting In</span>
              </div>
              <div className="text-9xl md:text-[11rem] font-extrabold text-blue-600 font-display">
                {countdown}
              </div>
            </motion.div>
          ) : !currentPlayer ? (
            <div className="flex flex-col items-center justify-center my-auto py-20 space-y-3">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-gray-500 font-medium text-sm">Connecting to game room...</p>
            </div>
          ) : !gameStateSync || gameStateSync.gameMode !== room.config.gameMode ? (
            <div className="flex flex-col items-center justify-center my-auto py-20 space-y-4 max-w-md mx-auto text-center px-4">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-gray-900 font-bold">
                Syncing match...
              </p>
              <p className="text-gray-500 text-xs font-medium">
                Connecting to live game round data
              </p>
              {syncSeconds >= 3 && (
                <button
                  onClick={() => {
                    sound.playClick();
                    syncMatchState();
                  }}
                  disabled={isManualSyncing}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
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
              onAction={handleGameAction}
              isHost={Boolean(isHost)}
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
              isHost={Boolean(isHost)}
              vibeMode={room.config.vibeMode}
              onAction={handleGameAction}
            />
          ) : room.config.gameMode === 'sip_or_spill' ? (
            <SipOrSpillGameView
              state={gameStateSync.state}
              players={room.players}
              currentPlayerId={currentPlayer.id}
              isHost={Boolean(isHost)}
              vibeMode={room.config.vibeMode}
              onAction={handleGameAction}
            />
          ) : room.config.gameMode === 'silly_roulette' ? (
            <SillyRouletteGameView
              state={gameStateSync.state}
              players={room.players}
              currentPlayerId={currentPlayer.id}
              isHost={Boolean(isHost)}
              vibeMode={room.config.vibeMode}
              onAction={handleGameAction}
            />
          ) : room.config.gameMode === 'hot_potato' ? (
            <HotPotatoGameView
              state={gameStateSync.state}
              players={room.players}
              currentPlayerId={currentPlayer.id}
              isHost={Boolean(isHost)}
              vibeMode={room.config.vibeMode}
              onAction={handleGameAction}
            />
          ) : (
            <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-3 my-auto shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">Party Mode Active</h3>
              <p className="text-gray-500 text-sm">Enjoy the game with your group!</p>
            </div>
          )}
        </div>
      ) : room.status === 'game_over' || room.status === 'finished' ? (
        /* ANIMATED PODIUM & REMATCH SCREEN */
        <GamePodiumView room={room} currentPlayer={currentPlayer} />
      ) : (
        /* WAITING LOBBY (15-PLAYER MODERN LAYOUT) */
        <div className="flex-1 flex flex-col justify-between py-1 sm:py-2 relative z-10 w-full">
          <div>
            {/* 1. TOP HEADER */}
            <div className="bg-white rounded-2xl px-4 sm:px-6 py-3 sm:py-3.5 mb-4 flex items-center justify-between border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <BrandLogo size="nav" showSubtitle={false} />
                <span className="text-gray-300 font-bold hidden sm:inline">|</span>
                <div className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider">
                  Lobby
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Streamer Mode Toggle */}
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsStreamerMode(!isStreamerMode);
                    showToast(
                      isStreamerMode
                        ? 'Streamer Mode Disabled (Code Visible)'
                        : 'Streamer Mode Active (Code Hidden for Streaming)'
                    );
                  }}
                  className={`h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all border ${
                    isStreamerMode
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Toggle Streamer Mode"
                >
                  {isStreamerMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Streamer Mode</span>
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">Waiting for Players...</span>
                  <span className="font-mono font-bold">({activePlayers.length}/15)</span>
                </div>
              </div>
            </div>

            {/* 2. ROOM CODE BAR & ACTION CONTROLS */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border border-gray-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {/* Room Code Display */}
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-semibold tracking-wider text-gray-500">
                    Room:
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-all"
                    title="Click to copy Room Code"
                  >
                    <span className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-wider font-mono">
                      {isStreamerMode ? '••••' : roomCode}
                    </span>
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Players Counter */}
                <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Players: <strong className="text-gray-900 font-bold">{activePlayers.length}</strong> / 15
                  </span>
                </div>

                {/* PIN Protected indicator */}
                {room.config.hasPin && (
                  <div className="px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-600" />
                    <span>PIN Protected</span>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowSettingsModal(true);
                  }}
                  className="h-10 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold inline-flex items-center justify-center shrink-0 gap-1.5 transition-all shadow-sm"
                  title="Room Settings"
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>Settings</span>
                </button>

                {room.config.vibeMode === 'sip_edition' && (
                  <button
                    onClick={handleQuickTakeSip}
                    className="h-10 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold inline-flex items-center justify-center shrink-0 gap-1.5 transition-all"
                    title="Take a drink & log it"
                  >
                    <Wine className="w-4 h-4 text-rose-600" />
                    <span>Take Sip! 🥤</span>
                    <span className="font-mono text-xs font-bold text-rose-700">
                      ({room.sipsCount?.[currentPlayer?.id || ''] || 0})
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowCustomCardModal(true);
                  }}
                  className="h-10 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold inline-flex items-center justify-center shrink-0 gap-1.5 transition-all shadow-sm"
                  title="Submit Custom Card"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Custom Card</span>
                </button>

                <RoomLobbyQRCode roomCode={roomCode} isStreamerMode={isStreamerMode} />

                <SoundToggle />

                <button
                  onClick={handleCopyInviteLink}
                  className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center shrink-0 gap-1.5 shadow-sm transition-all"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Share2 className="w-4 h-4 text-white" />
                  )}
                  <span>{copiedLink ? 'Copied!' : 'Invite'}</span>
                </button>

                <button
                  onClick={handleLeaveRoom}
                  className="w-10 h-10 inline-flex items-center justify-center shrink-0 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 shadow-sm transition-all"
                  title="Leave Room"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MULTI-GAME PLAYLIST SELECTION */}
            <div className="mb-5">
              <GamePlaylistQueue
                selectedGames={
                  room.selectedGames ||
                  room.config.selectedGames || [room.config.gameMode || 'who_is_imposter']
                }
                currentGameIndex={room.currentGameIndex || 0}
                isHost={Boolean(isHost)}
                onUpdatePlaylist={handleUpdatePlaylist}
              />
            </div>

            {/* TEAM SQUAD SELECTOR (IF TEAM MODE ENABLED) */}
            {room.config.isTeamMode && (
              <div className="mb-5 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Teams Mode Active — Blue vs Red Squad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">
                      Your Team:{' '}
                      <strong className={currentPlayer?.team === 'red' ? 'text-rose-600 font-bold' : 'text-blue-600 font-bold'}>
                        {currentPlayer?.team === 'red' ? 'Team Red' : 'Team Blue'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        const targetTeam = currentPlayer?.team === 'blue' ? 'red' : 'blue';
                        socketSelectTeam(targetTeam as PlayerTeam);
                      }}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-all"
                    >
                      Switch Team ⇄
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Team A (Blue) */}
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span className="font-bold text-xs uppercase tracking-wider text-blue-800">
                            Team Blue
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-blue-700">
                          {activePlayers.filter((p) => p.team !== 'red').length} Players
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center py-1">
                        {activePlayers
                          .filter((p) => p.team !== 'red')
                          .map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 rounded-lg bg-white border border-blue-200 text-xs font-medium text-blue-900 flex items-center gap-1"
                            >
                              <span>{NEON_AVATARS[p.avatar]?.emoji || '👾'}</span>
                              <span>{p.username}</span>
                              {p.id === currentPlayer?.id && (
                                <span className="text-[10px] text-blue-600 font-bold">(You)</span>
                              )}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Team B (Red) */}
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                          <span className="font-bold text-xs uppercase tracking-wider text-rose-800">
                            Team Red
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-rose-700">
                          {activePlayers.filter((p) => p.team === 'red').length} Players
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center py-1">
                        {activePlayers
                          .filter((p) => p.team === 'red')
                          .map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-0.5 rounded-lg bg-white border border-rose-200 text-xs font-medium text-rose-900 flex items-center gap-1"
                            >
                              <span>{NEON_AVATARS[p.avatar]?.emoji || '👾'}</span>
                              <span>{p.username}</span>
                              {p.id === currentPlayer?.id && (
                                <span className="text-[10px] text-rose-600 font-bold">(You)</span>
                              )}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. MAIN AREA: LEFT = 15-SLOT GRID | RIGHT = SETTINGS SIDEBAR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-start">
              {/* LEFT: 15-SLOT PLAYER GRID */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Lobby Slots</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {activePlayers.filter((p) => p.isReady).length} of {activePlayers.length} Ready
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
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
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={`relative bg-white rounded-2xl p-3 flex flex-col items-center justify-between text-center transition-all min-h-[145px] sm:min-h-[160px] border shadow-sm ${
                            player.isReady
                              ? 'border-emerald-200 ring-2 ring-emerald-500/20'
                              : isDisconnected
                              ? 'border-rose-300 bg-rose-50/50'
                              : 'border-gray-200'
                          }`}
                        >
                          {/* TOP PILL BADGE */}
                          <div className="w-full mb-1">
                            {isDisconnected ? (
                              <div className="w-full py-0.5 px-1 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[10px] font-bold flex items-center justify-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-rose-600" />
                                <span>{remainingGrace}s</span>
                              </div>
                            ) : player.isReady ? (
                              <div className="w-full py-0.5 px-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[10px] font-bold flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Ready</span>
                              </div>
                            ) : (
                              <div className="w-full py-0.5 px-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-[10px] font-medium">
                                Not Ready
                              </div>
                            )}
                          </div>

                          {/* AVATAR FRAME */}
                          <div className="relative my-1">
                            {player.isHost && (
                              <div
                                className="absolute -top-2 -right-2 z-10 p-1 bg-amber-400 rounded-full shadow-sm"
                                title="Room Host"
                              >
                                <Crown className="w-3 h-3 text-white fill-white" />
                              </div>
                            )}

                            <NeonAvatarDisplay
                              avatarId={player.avatar}
                              size="sm"
                              showGlow={false}
                              isReady={player.isReady}
                            />
                          </div>

                          {/* USERNAME */}
                          <div className="w-full truncate mt-1">
                            <div className="font-bold text-xs text-gray-900 truncate px-0.5">
                              {player.username}
                              {player.id === currentPlayer?.id && (
                                <span className="ml-1 text-[10px] text-blue-600 font-semibold">(You)</span>
                              )}
                            </div>

                            {room.config.isTeamMode && player.team && (
                              <div
                                className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase inline-block ${
                                  player.team === 'red'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {player.team}
                              </div>
                            )}
                          </div>

                          {/* Host Kick Option */}
                          {isHost &&
                          player.id !== currentPlayer?.id &&
                          player.id !== room.hostId &&
                          !player.isHost ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setKickTarget(player);
                              }}
                              className="mt-1 text-[10px] text-rose-600 hover:text-rose-700 font-semibold py-0.5 px-2 rounded-lg hover:bg-rose-50 transition-all"
                              title={`Kick ${player.username}`}
                            >
                              Kick
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
                        className="rounded-2xl border border-dashed border-gray-200 bg-white/60 flex flex-col items-center justify-center p-2.5 text-center text-gray-400 select-none min-h-[145px] sm:min-h-[160px]"
                      >
                        <div className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center mb-1 text-gray-400 text-xs">
                          {slotNum}
                        </div>
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                          Open Slot
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT SIDEBAR: GAME SETTINGS PANEL */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  {/* Panel Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider">
                          Game Settings
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {isHost
                            ? 'Host controls & match configuration'
                            : 'Match settings locked by host'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settings Controls */}
                  <div className="space-y-4">
                    {/* 1. 10-GAME SELECTOR */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                          Selected Game
                        </label>
                        <span className="text-[11px] text-blue-600 font-bold uppercase">
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
                              className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                              } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-base">{g.emoji}</span>
                                <span className="text-[10px] font-mono text-gray-400 font-medium">{g.players}</span>
                              </div>
                              <span className="text-xs font-semibold truncate mt-1">{g.title}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Dropdown for Host */}
                      {isHost && (
                        <div className="relative">
                          <select
                            value={room.config.gameMode}
                            onChange={(e) => {
                              sound.playClick();
                              socketUpdateSettings({ gameMode: e.target.value as GameMode });
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 outline-none cursor-pointer appearance-none hover:bg-white transition-all"
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
                          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-2.5 pointer-events-none" />
                        </div>
                      )}
                    </div>

                    {/* 2. MATCH MODE: SOLO VS TEAMS */}
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-gray-700" />
                          <span className="text-xs font-bold text-gray-900">Match Mode</span>
                        </div>
                        {isHost ? (
                          <div className="flex items-center bg-white p-0.5 rounded-lg border border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                socketUpdateSettings({ isTeamMode: false, mode: 'solo' });
                              }}
                              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                !room.config.isTeamMode
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-50'
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
                              className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                room.config.isTeamMode
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              Teams
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-blue-600 uppercase">
                            {room.config.isTeamMode ? 'Teams Mode' : 'Solo FFA'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {room.config.isTeamMode
                          ? 'Blue Squad vs Red Squad (Team victory)'
                          : 'Free-For-All (Individual points & leaderboard)'}
                      </p>
                    </div>

                    {/* 3. SOLO TEST / DEV MODE TOGGLE (HOST ONLY) */}
                    {isHost && (
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <div>
                            <div className="text-xs font-bold text-gray-900">Solo Test Mode</div>
                            <div className="text-[10px] text-gray-500 font-medium">Allow 1 player to launch & test any game</div>
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
                          className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        />
                      </div>
                    )}

                    {/* 4. PARTY VIBE MODE */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                          Party Vibe Mode
                        </label>
                        <span className="text-blue-600 font-bold text-[11px] uppercase">
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
                              className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                (room.config.vibeMode || 'chill') === vibe.id
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {vibe.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 capitalize">
                          {room.config.vibeMode?.replace('_', ' ') || 'Chill & Funny'}
                        </div>
                      )}
                    </div>

                    {/* 5. ROUNDS SELECTOR */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                          Rounds
                        </label>
                        <span className="text-gray-900 font-bold text-xs">
                          {room.config.totalRounds || 5} Rounds
                        </span>
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
                            className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                              (room.config.totalRounds || 5) === rounds
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
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
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                          Timer (Sec / Turn)
                        </label>
                        <span className="text-blue-600 font-bold text-xs">
                          {room.config.roundDurationSeconds || 30}s
                        </span>
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
                            className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                              (room.config.roundDurationSeconds || 30) === sec
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connected players counter */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">
                    Connected ({activePlayers.length}/15)
                  </span>
                  <span className="text-emerald-600 font-semibold">
                    {activePlayers.filter((p) => p.isReady).length} Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. BOTTOM ACTION BAR: READY TOGGLE + HOST START BUTTON */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border border-gray-200 sticky bottom-2 z-20 shadow-md safe-bottom">
            {/* Player Info Preview */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {currentPlayer && (
                <NeonAvatarDisplay avatarId={currentPlayer.avatar} size="sm" showGlow={false} />
              )}
              <div>
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  Playing as
                </div>
                <div className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>{currentPlayer?.username}</span>
                  {isHost && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                      Host
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Ready Toggle + Host Start / Force Start Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Ready Status Toggle */}
              <button
                onClick={handleToggleReady}
                className={`w-full sm:w-auto h-12 px-6 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${
                  currentPlayer?.isReady
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800'
                }`}
              >
                {currentPlayer?.isReady ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Ready ✓ (Tap to unready)</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Ready</span>
                  </>
                )}
              </button>

              {/* Host Controls */}
              {isHost && (
                <>
                  {/* Force Start Button */}
                  {activePlayers.length >= 2 && !allReady && (
                    <button
                      type="button"
                      onClick={() => handleStartGame(true)}
                      className="w-full sm:w-auto h-12 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                      title="Force start match with currently connected players"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Force Start</span>
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
                          : 'All players must click Ready (or use Force Start)'
                        : 'Launch Match'
                    }
                    className={`w-full sm:w-auto min-w-[200px] h-12 px-8 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${
                      allReady
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                    id="btn-start-game"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Game</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3-SECOND COUNTDOWN OVERLAY */}
      <AnimatePresence>
        {countdown !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              key={countdown}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="text-8xl md:text-9xl font-extrabold text-white">
                {countdown}
              </div>
              <p className="text-white font-bold uppercase tracking-wider text-base mt-3">
                Starting Game...
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JOIN ROOM MODAL */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-7 border border-gray-200 shadow-xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-1">Join Room {roomCode}</h3>
              <p className="text-xs text-gray-500 mb-5 font-medium">Choose your avatar and nickname to enter.</p>

              {errorMessage && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleModalJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Your Nickname
                  </label>
                  <input
                    type="text"
                    value={joinUsername}
                    onChange={(e) => setJoinUsername(e.target.value.slice(0, 18))}
                    placeholder="Enter nickname..."
                    required
                    className="w-full h-11 bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-xl px-4 text-gray-900 font-medium text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
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
                        className={`h-11 rounded-xl border flex items-center justify-center text-xl transition-all ${
                          joinAvatar === key
                            ? 'bg-blue-50 border-blue-600 shadow-sm'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <span>{NEON_AVATARS[key].emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Room PIN (If private)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full h-11 bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-xl px-4 text-center text-lg tracking-widest text-gray-900 font-bold outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm mt-2 transition-all"
                >
                  Enter Waiting Lobby
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM KICK MODAL */}
      <AnimatePresence>
        {kickTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white p-6 rounded-2xl text-center space-y-4 border border-gray-200 shadow-xl"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
                <UserX className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">Kick {kickTarget.username}?</h4>
              <p className="text-xs text-gray-500 font-medium">
                Are you sure you want to remove this player from the room?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setKickTarget(null)}
                  className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmKick}
                  className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 rounded-xl text-white font-bold text-xs shadow-sm"
                >
                  Yes, Kick
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CARDS SUBMISSION MODAL */}
      <AnimatePresence>
        {showCustomCardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 border border-gray-200 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">
                      Submit Custom Card
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Inject your question or dare live into this room
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomCardModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none p-1"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmitCustomCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
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
                        className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                          customCardType === cat.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Your Party Prompt / Challenge (English)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={160}
                    value={customCardPrompt}
                    onChange={(e) => setCustomCardPrompt(e.target.value)}
                    placeholder="e.g., Who is most likely to win a reality TV show? or Do an impression of your favorite movie villain..."
                    required
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-xl p-3 text-gray-900 text-xs font-medium outline-none resize-none leading-relaxed"
                  />
                  <div className="text-right text-[10px] text-gray-400 mt-1 font-medium">
                    {customCardPrompt.length}/160
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCard || !customCardPrompt.trim()}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmittingCard ? 'Adding Card...' : 'Add to Match Rotation'}</span>
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
    </div>
  );
}
