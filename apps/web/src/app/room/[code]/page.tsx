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
import { NeonLogo } from '@/components/NeonLogo';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { FloatingReactions } from '@/components/FloatingReactions';
import { GamePodiumView } from '@/components/GamePodiumView';
import { SoundToggle } from '@/components/SoundToggle';
import { RoomLobbyQRCode } from '@/components/RoomLobbyQRCode';
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
    if (!phaseEndsAt || room?.status !== 'in_game') return;

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
      if (diff > 0 && diff <= 5 && room.status === 'in_game') {
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
      setRoom(newRoom);
      if (newRoom.status === 'lobby') {
        setPrivateRole(null);
        setGameStateSync(null);
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
      showToast(`${player.username} joined the room!`);
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

    socket.on('room:state', handleRoomState);
    socket.on('room_state', handleRoomState);
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
        } catch (err) {
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
        } catch (err: any) {
          setShowJoinModal(true);
        }
      } else {
        setShowJoinModal(true);
      }

      setIsInitializing(false);
    };

    initConnection();

    return () => {
      socket.off('room:state', handleRoomState);
      socket.off('room_state', handleRoomState);
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

  // Host Start Game
  const handleStartGame = async () => {
    sound.playClick();
    try {
      await socketStartGame();
    } catch (err: any) {
      showToast(`⚠️ ${err.message || 'Could not start game.'}`);
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

  const maxPlayers = 15;
  const allReady = activePlayers.length >= 2 && activePlayers.every((p) => p.isReady);

  if (isInitializing || !room) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-feto-dark">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto shadow-neon-cyan" />
          <p className="text-cyan-300 font-black uppercase tracking-wider text-sm">
            Connecting to FETO Room {roomCode}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-[100dvh] bg-feto-dark text-slate-100 flex flex-col justify-between max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 relative safe-top safe-bottom transition-all ${
        timerState && timerState.remainingSeconds <= 5 && timerState.remainingSeconds > 0 && room.status === 'in_game'
          ? 'tension-pulse'
          : ''
      }`}
    >
      {/* Background Neon Glows */}
      <div className="fixed top-0 left-1/4 w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-feto-card border border-cyan-400 rounded-full text-white text-xs md:text-sm font-semibold shadow-neon-cyan flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
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
      {room.status === 'in_game' || room.status === 'countdown' ? (
        /* IN-GAME ACTIVE SCREEN */
        <div className="flex-1 flex flex-col items-center justify-start py-2 relative z-10 w-full min-h-[600px]">
          {/* IN-GAME HUD BAR */}
          <div className="w-full glass-panel rounded-2xl px-3 sm:px-5 py-2 mb-3 flex items-center justify-between border border-cyan-500/25 shadow-neon-cyan">
            <div className="flex items-center gap-2 sm:gap-3">
              <NeonLogo size="nav" showSubtitle={false} />
              <span className="text-slate-600 font-bold hidden sm:inline">|</span>
              <div className="px-2.5 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-[10px] sm:text-xs font-black text-cyan-300 font-mono">
                ROOM: {roomCode}
              </div>
              <div className="px-2.5 py-0.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-[10px] sm:text-xs font-black text-purple-300 uppercase">
                Round {room.currentRound} / {room.config.totalRounds}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {room.config.vibeMode === 'sip_edition' && (
                <button
                  onClick={handleQuickTakeSip}
                  className="px-2.5 py-1 rounded-xl bg-pink-950/80 hover:bg-pink-900 border border-pink-500/50 text-pink-300 text-[11px] font-black flex items-center gap-1 shadow-neon-magenta animate-pulse touch-target"
                  title="Take a drink & log on leaderboard"
                >
                  <Wine className="w-3 h-3 text-pink-400" />
                  <span className="hidden sm:inline">Take Sip! 🥤</span>
                  <span className="font-mono text-[10px] text-white">
                    ({room.sipsCount?.[currentPlayer?.id || ''] || 0})
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  sound.playClick();
                  setShowCustomCardModal(true);
                }}
                className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[11px] font-bold flex items-center gap-1"
                title="Submit Custom Card"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Custom Card</span>
              </button>

              <SoundToggle />

              <button
                onClick={handleLeaveRoom}
                className="p-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-400"
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
              <div className="text-sm uppercase tracking-widest text-cyan-400 font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin text-cyan-400" />
                <span>Match Starting In</span>
              </div>
              <div className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400 animate-pulse font-display drop-shadow-[0_0_50px_rgba(0,240,255,0.6)]">
                {countdown}
              </div>
            </motion.div>
          ) : !currentPlayer ? (
            <div className="flex flex-col items-center justify-center my-auto py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-medium">Connecting to game room...</p>
            </div>
          ) : !gameStateSync || gameStateSync.gameMode !== room.config.gameMode ? (
            <div className="flex flex-col items-center justify-center my-auto py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-feto-magenta border-t-transparent rounded-full animate-spin" />
              <p className="text-cyan-300 font-bold tracking-wide animate-pulse">
                Synchronizing live match state...
              </p>
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
      ) : room.status === 'game_over' ? (
        /* ANIMATED PODIUM & REMATCH SCREEN */
        <GamePodiumView room={room} currentPlayer={currentPlayer} />
      ) : (
        /* WAITING LOBBY (15-PLAYER ESPORTS LAYOUT) */
        <div className="flex-1 flex flex-col justify-between py-1 sm:py-2 relative z-10 w-full">
          <div>
            {/* 1. TOP HEADER: FETO GAMES | LOBBY (LEFT), WAITING FOR PLAYERS... (X/15) (RIGHT) */}
            <div className="glass-panel rounded-2xl px-3.5 sm:px-6 py-2.5 sm:py-3.5 mb-4 flex items-center justify-between border border-cyan-500/25 shadow-neon-cyan">
              <div className="flex items-center gap-2 sm:gap-3">
                <NeonLogo size="nav" showSubtitle={false} />
                <span className="text-slate-600 font-bold hidden sm:inline">|</span>
                <div className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/40 text-[10px] sm:text-xs font-black uppercase tracking-widest text-purple-300 shadow-neon-purple">
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
                  className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                    isStreamerMode
                      ? 'bg-amber-950/80 border border-amber-500/50 text-amber-300 shadow-neon-amber'
                      : 'bg-slate-900/90 border border-slate-700/80 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle Streamer Mode to hide room code & invite links for Twitch / YouTube / TikTok streaming"
                >
                  {isStreamerMode ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Streamer Mode</span>
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] sm:text-xs font-black uppercase tracking-wider">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="hidden sm:inline">WAITING FOR PLAYERS...</span>
                  <span className="font-mono text-cyan-300">({activePlayers.length}/15)</span>
                </div>
              </div>
            </div>

            {/* 2. LARGE BOLD ROOM CODE DISPLAY + COPY INVITE LINK + PLAYERS COUNTER */}
            <div className="glass-panel-neon rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border border-cyan-500/30 shadow-neon-cyan">
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 w-full sm:w-auto">
                {/* Large Room Code Display */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-slate-400">
                    ROOM:
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="group flex items-center gap-2 px-3.5 py-1.5 bg-feto-dark border border-cyan-500/50 hover:border-cyan-400 rounded-xl transition-all shadow-neon-cyan"
                    title="Click to copy Room Code"
                  >
                    <span className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-purple-400 tracking-widest font-mono">
                      {isStreamerMode ? 'FG-••••' : roomCode}
                    </span>
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    )}
                  </button>
                </div>

                {/* Players Counter Pill */}
                <div className="px-3 py-1.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-300 font-black text-xs sm:text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Players: <strong className="text-white font-mono">{activePlayers.length}</strong> / 15</span>
                </div>

                {/* PIN Protected indicator */}
                {room.config.hasPin && (
                  <div className="px-2.5 py-1 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>PIN Protected</span>
                  </div>
                )}
              </div>

              {/* Action Controls: Copy Invite Link, Custom Cards, Sip Button, Sound Toggle, Leave Room */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end">
                {room.config.vibeMode === 'sip_edition' && (
                  <button
                    onClick={handleQuickTakeSip}
                    className="px-3 py-2 rounded-xl bg-pink-950/70 hover:bg-pink-900/80 border border-pink-500/50 text-pink-300 text-xs font-black flex items-center gap-1.5 transition-all shadow-neon-magenta touch-target animate-pulse"
                    title="Take a drink & log it on the leaderboard!"
                  >
                    <Wine className="w-3.5 h-3.5 text-pink-400" />
                    <span>Take Sip! 🥤</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 bg-pink-900/90 rounded-full border border-pink-500/40 text-white font-bold">
                      {room.sipsCount?.[currentPlayer?.id || ''] || 0}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowCustomCardModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-neon-purple touch-target"
                  title="Submit your own question or dare"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Custom Card</span>
                  {room.customCardsCount ? (
                    <span className="font-mono text-[10px] px-1 py-0.2 bg-purple-900 rounded-full text-purple-200">
                      +{room.customCardsCount}
                    </span>
                  ) : null}
                </button>

                <RoomLobbyQRCode roomCode={roomCode} isStreamerMode={isStreamerMode} />

                <SoundToggle />

                <button
                  onClick={handleCopyInviteLink}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-extrabold flex items-center gap-1.5 shadow-neon-cyan transition-all touch-target"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Invite'}</span>
                </button>

                <button
                  onClick={handleLeaveRoom}
                  className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-400 transition-all touch-target"
                  title="Leave Room"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* TEAM SQUAD SELECTOR (IF TEAM MODE ENABLED) */}
            {room.config.isTeamMode && (
              <div className="mb-5 p-3.5 sm:p-4 rounded-2xl glass-panel-neon border border-cyan-500/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-300">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Select Your Squad (Team Mode Active)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Squad points aggregate toward victory
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: 'red',
                      name: 'Red Squad',
                      color: 'border-red-500 bg-red-950/40 text-red-300',
                      activeRing: 'ring-2 ring-red-400 shadow-neon-magenta',
                      count: room.players.filter((p) => p.team === 'red').length
                    },
                    {
                      id: 'blue',
                      name: 'Blue Squad',
                      color: 'border-blue-500 bg-blue-950/40 text-blue-300',
                      activeRing: 'ring-2 ring-blue-400 shadow-neon-cyan',
                      count: room.players.filter((p) => p.team === 'blue').length
                    },
                    {
                      id: 'green',
                      name: 'Green Squad',
                      color: 'border-green-500 bg-green-950/40 text-green-300',
                      activeRing: 'ring-2 ring-green-400 shadow-neon-green',
                      count: room.players.filter((p) => p.team === 'green').length
                    }
                  ].map((squad) => (
                    <button
                      key={squad.id}
                      onClick={() => {
                        sound.playClick();
                        socketSelectTeam(squad.id as PlayerTeam);
                      }}
                      className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${squad.color} ${
                        currentPlayer?.team === squad.id ? `${squad.activeRing} scale-102` : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span className="font-black text-xs uppercase tracking-wide">{squad.name}</span>
                      <span className="text-[10px] text-slate-300 mt-0.5">{squad.count} Players</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. MAIN AREA: LEFT/CENTER = 5x3 STRUCTURED 15-SLOT GRID | RIGHT = GAME SETTINGS SIDEBAR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-start">
              {/* LEFT/CENTER AREA: 5x3 STRUCTURED GRID OF 15 GLOWING PLAYER SLOTS */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Lobby Slots (5 × 3 Grid)</span>
                  </span>
                  <span className="text-[11px] text-cyan-300/80 font-bold">
                    {activePlayers.length < 2
                      ? 'Waiting for at least 2 players...'
                      : allReady
                      ? 'All players ready to play!'
                      : 'Waiting for players to ready up...'}
                  </span>
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
                          className={`relative glass-panel rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-between text-center transition-all min-h-[145px] sm:min-h-[165px] border ${
                            player.isReady
                              ? 'border-emerald-500/60 shadow-neon-green bg-emerald-950/20'
                              : isDisconnected
                              ? 'border-amber-500/60 bg-amber-950/20 shadow-neon-amber'
                              : 'border-feto-border bg-slate-900/60'
                          }`}
                        >
                          {/* TOP PILL BADGE: GREEN READY OR AMBER NOT READY */}
                          <div className="w-full mb-1">
                            {isDisconnected ? (
                              <div className="w-full py-0.5 px-1 bg-amber-950/80 border border-amber-500/50 rounded-lg text-amber-300 text-[9px] font-black flex items-center justify-center gap-1 animate-pulse">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{remainingGrace}s</span>
                              </div>
                            ) : player.isReady ? (
                              <div className="w-full py-0.5 px-1 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-300 text-[9px] sm:text-[10px] font-black flex items-center justify-center gap-1 shadow-neon-green">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                <span>READY</span>
                              </div>
                            ) : (
                              <div className="w-full py-0.5 px-1 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-400 text-[9px] sm:text-[10px] font-extrabold truncate">
                                NOT READY
                              </div>
                            )}
                          </div>

                          {/* AVATAR FRAME WITH GLOW */}
                          <div className="relative my-1">
                            {/* Golden Host Crown Badge */}
                            {player.isHost && (
                              <div
                                className="absolute -top-2 -right-2 z-10 p-1 bg-yellow-400 rounded-full shadow-neon-gold transform rotate-12"
                                title="Room Host"
                              >
                                <Crown className="w-3 h-3 text-black fill-black" />
                              </div>
                            )}

                            <NeonAvatarDisplay
                              avatarId={player.avatar}
                              size="sm"
                              showGlow={player.isReady}
                              isReady={player.isReady}
                            />
                          </div>

                          {/* BOLD USERNAME UNDERNEATH */}
                          <div className="w-full truncate mt-1">
                            <div className="font-black text-xs text-white truncate px-0.5">
                              {player.username}
                              {player.id === currentPlayer?.id && (
                                <span className="ml-1 text-[9px] text-cyan-300 font-semibold">(You)</span>
                              )}
                            </div>

                            {/* Squad Badge if Team Mode */}
                            {room.config.isTeamMode && player.team && (
                              <div
                                className={`mt-0.5 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase inline-block ${
                                  player.team === 'red'
                                    ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                                    : player.team === 'blue'
                                    ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                                    : 'bg-green-950/80 text-green-300 border border-green-500/40'
                                }`}
                              >
                                {player.team}
                              </div>
                            )}
                          </div>

                          {/* Host Kick Option: never show on host's own card */}
                          {isHost && player.id !== currentPlayer?.id && player.id !== room.hostId && !player.isHost ? (
                            <button
                              onClick={() => setKickTarget(player)}
                              className="mt-1 text-[9px] text-slate-500 hover:text-red-400 font-bold flex items-center gap-0.5 py-0.5 px-1 touch-manipulation transition-colors"
                            >
                              <UserX className="w-2.5 h-2.5" /> Kick
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
                        className="rounded-2xl border-2 border-dashed border-slate-800/80 bg-slate-900/20 flex flex-col items-center justify-center p-2.5 text-center text-slate-600 select-none min-h-[145px] sm:min-h-[165px]"
                      >
                        <div className="w-10 h-10 rounded-full border border-dashed border-slate-800 flex items-center justify-center mb-1 text-slate-600 text-xs font-bold">
                          ...
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          Slot #{slotNum}
                        </span>
                        <span className="text-[9px] text-slate-700">Open</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT SIDEBAR: GLOWING AMBER/PURPLE GAME SETTINGS PANEL */}
              <div className="lg:col-span-4 glass-panel-neon rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-amber-500/30 shadow-neon-amber flex flex-col justify-between">
                <div>
                  {/* Panel Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Sliders className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                          Game Settings
                        </h3>
                        <p className="text-[10px] text-amber-300/80">
                          {isHost ? 'Host controls & match configuration' : 'Match settings locked by host'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settings Controls */}
                  <div className="space-y-4">
                    {/* 1. GAME MODE DROPDOWN */}
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                        Game Mode
                      </label>
                      {isHost ? (
                        <div className="relative">
                          <select
                            value={room.config.gameMode}
                            onChange={(e) => {
                              sound.playClick();
                              socketUpdateSettings({ gameMode: e.target.value as GameMode });
                            }}
                            className="w-full bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none cursor-pointer appearance-none hover:border-amber-400 transition-all"
                          >
                            <option value="who_is_imposter">Who Is The Imposter? (3-15p)</option>
                            <option value="draw_and_guess">Draw & Guess (2-15p)</option>
                            <option value="quiz_battle">Quiz Battle (2-15p)</option>
                            <option value="word_battle">Word Battle (2-15p)</option>
                            <option value="truth_or_dare">Truth or Dare (2-15p)</option>
                            <option value="never_have_i_ever">Never Have I Ever (2-15p)</option>
                            <option value="most_likely_to">Most Likely To... (2-15p)</option>
                            <option value="sip_or_spill">Sip or Spill 🥤 (2-15p)</option>
                            <option value="silly_roulette">Silly Roulette (2-15p)</option>
                            <option value="hot_potato">Hot Potato (2-15p)</option>
                          </select>
                          <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3 top-2.5 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-bold text-cyan-300 capitalize">
                          {room.config.gameMode.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>

                    {/* VIBE MODE SELECTOR */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                          Party Vibe Mode
                        </label>
                        <span className="text-cyan-300 font-extrabold text-[10px] uppercase">
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
                              className={`py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                                (room.config.vibeMode || 'chill') === vibe.id
                                  ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-neon-cyan'
                                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                              }`}
                            >
                              {vibe.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-bold text-cyan-300 capitalize">
                          {room.config.vibeMode?.replace('_', ' ') || 'Chill & Funny'}
                        </div>
                      )}
                    </div>

                    {/* 2. ROUNDS SELECTOR */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                          Rounds
                        </label>
                        <span className="text-amber-300 font-extrabold text-xs">{room.config.totalRounds || 5} Rounds</span>
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
                            className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              (room.config.totalRounds || 5) === rounds
                                ? 'border-amber-400 bg-amber-950/50 text-amber-300 shadow-neon-amber'
                                : 'border-slate-800 bg-slate-900 text-slate-400'
                            }`}
                          >
                            {rounds}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. TIMER SELECTOR */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                          Timer (Sec / Turn)
                        </label>
                        <span className="text-cyan-300 font-extrabold text-xs">{room.config.roundDurationSeconds}s</span>
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
                            className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              room.config.roundDurationSeconds === sec
                                ? 'border-cyan-400 bg-cyan-950/50 text-cyan-300 shadow-neon-cyan'
                                : 'border-slate-800 bg-slate-900 text-slate-400'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. DIFFICULTY SELECTOR */}
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
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
                            className={`py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                              difficultySetting === diff.id
                                ? 'border-purple-400 bg-purple-950/50 text-purple-300 shadow-neon-purple'
                                : 'border-slate-800 bg-slate-900 text-slate-400'
                            }`}
                          >
                            {diff.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 5. TEAM MODE TOGGLE */}
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="text-xs font-bold text-white">Team Mode</div>
                          <div className="text-[9px] text-slate-400">Red, Blue & Green Squads</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        disabled={!isHost}
                        checked={Boolean(room.config.isTeamMode)}
                        onChange={(e) => {
                          sound.playClick();
                          socketUpdateSettings({ isTeamMode: e.target.checked });
                        }}
                        className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Compact Live Player Management List */}
                <div className="mt-5 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                      Connected ({activePlayers.length}/15)
                    </span>
                    <span className="text-[10px] text-cyan-400 font-bold">
                      {activePlayers.filter((p) => p.isReady).length} Ready
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {activePlayers.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">{NEON_AVATARS[player.avatar]?.emoji || '👾'}</span>
                          <span className="font-bold text-slate-200 truncate">{player.username}</span>
                          {player.isHost && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-yellow-400/20 text-yellow-300 font-extrabold">
                              HOST
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-black uppercase ${
                              player.isReady ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {player.isReady ? '✓ READY' : 'WAITING'}
                          </span>
                          {isHost && player.id !== currentPlayer?.id && player.id !== room.hostId && !player.isHost && (
                            <button
                              onClick={() => setKickTarget(player)}
                              className="text-slate-500 hover:text-red-400 p-0.5"
                              title="Kick Player"
                            >
                              <UserX className="w-3 h-3" />
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
          <div className="glass-panel-neon rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border border-cyan-500/30 sticky bottom-2 z-20 shadow-2xl safe-bottom">
            {/* Player Info Preview */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {currentPlayer && (
                <NeonAvatarDisplay avatarId={currentPlayer.avatar} size="sm" showGlow={false} />
              )}
              <div>
                <div className="text-[11px] text-slate-400">Playing as</div>
                <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <span>{currentPlayer?.username}</span>
                  {isHost && (
                    <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[9px] sm:text-[10px] font-extrabold rounded-full">
                      HOST
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons: Ready Toggle + Wide Start Game Play Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
              {/* Ready Status Toggle */}
              <button
                onClick={handleToggleReady}
                className={`w-full sm:w-auto px-5 sm:px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 touch-target ${
                  currentPlayer?.isReady
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-neon-green'
                }`}
              >
                {currentPlayer?.isReady ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>✓ I'M READY</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-emerald-300" />
                    <span>READY UP!</span>
                  </>
                )}
              </button>

              {/* Host Start Game Button: WIDE BRIGHT GRADIENT CYAN-TO-PURPLE GLOWING BUTTON */}
              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={!allReady}
                  title={
                    !allReady
                      ? 'All players must be ready and at least 2 players are needed'
                      : 'Launch Match'
                  }
                  className={`w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-2xl font-black text-xs sm:text-sm md:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 touch-target ${
                    allReady
                      ? 'btn-glow-start cursor-pointer'
                      : 'bg-slate-800/80 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                  id="btn-start-game"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>START GAME ▶ PLAY</span>
                </button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400 drop-shadow-2xl">
                {countdown}
              </div>
              <p className="text-cyan-300 font-extrabold uppercase tracking-widest text-lg mt-4">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md glass-panel-neon rounded-3xl p-6 md:p-8 border border-cyan-500/30"
            >
              <h3 className="text-2xl font-black text-white mb-1">Join Room {roomCode}</h3>
              <p className="text-xs text-slate-400 mb-6">Choose your neon avatar and nickname to enter.</p>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleModalJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Your Nickname
                  </label>
                  <input
                    type="text"
                    value={joinUsername}
                    onChange={(e) => setJoinUsername(e.target.value.slice(0, 18))}
                    placeholder="Enter nickname..."
                    required
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
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
                        className={`p-2 rounded-xl border flex items-center justify-center text-2xl transition-all ${
                          joinAvatar === key
                            ? 'border-cyan-400 bg-cyan-950/40 scale-105 shadow-neon-cyan'
                            : 'border-feto-border bg-feto-card'
                        }`}
                      >
                        {NEON_AVATARS[key].emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Room PIN (If private)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-yellow-400 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full btn-neon-cyan py-3.5 rounded-2xl text-white font-black text-base mt-2"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm glass-panel p-6 rounded-3xl text-center space-y-4 border border-red-500/40"
            >
              <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center mx-auto text-red-400">
                <UserX className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-white">Kick {kickTarget.username}?</h4>
              <p className="text-xs text-slate-400">
                Are you sure you want to remove this player from the room?
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setKickTarget(null)}
                  className="flex-1 py-2.5 bg-feto-card border border-feto-border rounded-xl text-slate-300 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmKick}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold text-xs"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-md glass-panel-neon rounded-3xl p-6 border border-purple-500/40 shadow-neon-purple"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <PlusCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">
                      Submit Custom Card
                    </h3>
                    <p className="text-[11px] text-purple-300/80">
                      Inject your question or dare live into this room
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCustomCardModal(false)}
                  className="text-slate-400 hover:text-white text-2xl font-bold leading-none p-1"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmitCustomCard} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
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
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          customCardType === cat.id
                            ? 'border-purple-400 bg-purple-950/50 text-purple-300 shadow-neon-purple'
                            : 'border-slate-800 bg-slate-900 text-slate-400'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                    Your Party Prompt / Challenge (English)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={160}
                    value={customCardPrompt}
                    onChange={(e) => setCustomCardPrompt(e.target.value)}
                    placeholder="e.g., Who is most likely to win a reality TV show? or Do an impression of your favorite movie villain..."
                    required
                    className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-xl p-3 text-white text-xs outline-none resize-none leading-relaxed"
                  />
                  <div className="text-right text-[10px] text-slate-500 mt-1">
                    {customCardPrompt.length}/160
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCard || !customCardPrompt.trim()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-purple transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmittingCard ? 'Injecting Card...' : 'Add to Match Rotation'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TACTICAL SABOTAGE POWER-UP DRAWER (DURING ACTIVE MATCHES) */}
      {room.status === 'in_game' && currentPlayer && (
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
