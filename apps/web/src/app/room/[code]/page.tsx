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
  AlertTriangle,
  Lock,
  Zap,
  Sparkles,
  Users,
  Shield,
  Wine,
  PlusCircle,
  RotateCcw,
  ArrowRight,
  Link2,
  X
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
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/hooks/useLanguage';
import { RoomLobbyQRCode } from '@/components/RoomLobbyQRCode';
import { RoomSettingsModal, RoomSettingsPayload } from '@/components/RoomSettingsModal';
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
import { useGameTimer } from '@/hooks/useGameTimer';
import {
  cleanRoomCode,
  clearReconnectSession,
  getReconnectToken,
  getSocket,
  socketBackToLobby,
  socketEndRound,
  socketJoinRoom,
  socketKickPlayer,
  socketLeaveRoom,
  socketNextRound,
  socketPhaseTimeout,
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
  const roomCode = cleanRoomCode((params?.code as string) || '');
  const { language, t } = useLanguage();
  const isArabic = language === 'ar';

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

  // Host In-Game & Match Controls
  const [isActionPending, setIsActionPending] = useState(false);
  const [showBackToLobbyModal, setShowBackToLobbyModal] = useState(false);
  const [resetScoresOnLobbyReturn, setResetScoresOnLobbyReturn] = useState(false);

  // Authoritative match countdown timer (calculated from phaseEndsAt - Date.now())
  const phaseEndsAt = gameStateSync?.state?.phaseEndsAt;
  const gameTimer = useGameTimer({
    phaseEndsAt,
    enabled: room?.status === 'playing' || room?.status === 'in_game',
    roomCode,
    autoTriggerTimeout: true
  });

  const isRoundResultsPhase =
    gameStateSync?.state?.phase === 'round_result' ||
    gameStateSync?.state?.phase === 'round_results' ||
    gameStateSync?.state?.phase === 'reveal' ||
    gameStateSync?.state?.phase === 'exploded';

  const isFinalRound = (room?.currentRound || 1) >= (room?.config?.totalRounds || 5);
  const isMultiPlaylistNext =
    Array.isArray(room?.selectedGames) &&
    room.selectedGames.length > 1 &&
    typeof room.currentGameIndex === 'number' &&
    room.currentGameIndex + 1 < room.selectedGames.length;

  const nextRoundLabel = isFinalRound
    ? isMultiPlaylistNext
      ? 'Next Game ➔'
      : 'Finish Match 🏆'
    : 'Next Round ➔';

  const handleEndRoundNow = async () => {
    if (!currentPlayer?.isHost || isActionPending) return;
    setIsActionPending(true);
    sound.playClick();
    try {
      await socketEndRound(roomCode);
    } catch (err: any) {
      showToast(err.message || 'Failed to end round');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleNextRound = async () => {
    if (!currentPlayer?.isHost || isActionPending) return;
    setIsActionPending(true);
    sound.playClick();
    try {
      await socketNextRound(roomCode);
    } catch (err: any) {
      showToast(err.message || 'Failed to advance round');
    } finally {
      setIsActionPending(false);
    }
  };

  const handleConfirmBackToLobby = async (resetScores: boolean) => {
    if (!currentPlayer?.isHost || isActionPending) return;
    setIsActionPending(true);
    setShowBackToLobbyModal(false);
    sound.playClick();
    try {
      await socketBackToLobby(resetScores, roomCode);
    } catch (err: any) {
      showToast(err.message || 'Failed to return to lobby');
    } finally {
      setIsActionPending(false);
    }
  };

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

    // 1. Immediate REST fetch to hydrate room state and current player
    const fetchInitialRoomState = async () => {
      try {
        const storedPid =
          (typeof window !== 'undefined' &&
            (sessionStorage.getItem(`feto_player_id_${roomCode}`) ||
              localStorage.getItem(`feto_player_${roomCode}`) ||
              sessionStorage.getItem('feto_persistent_player_id') ||
              localStorage.getItem('feto_persistent_player_id'))) ||
          '';

        const res = await fetch(`/api/rooms/${roomCode}${storedPid ? `?playerId=${storedPid}` : ''}`);
        if (!res.ok) {
          if (res.status === 404) {
            setIsInitializing(false);
            setErrorMessage('Room not found or expired.');
            setTimeout(() => router.push('/'), 2500);
          }
          return;
        }

        const json = await res.json();
        if (json.success && json.room) {
          setRoom(json.room);
          setIsInitializing(false);

          if (json.privateRole) {
            setPrivateRole(json.privateRole);
          }

          // Check if stored player is in this room
          const matchedPlayer = json.room.players?.find(
            (p: PlayerSummary) => p.id === storedPid
          ) || (json.room.spectators && (json.room.spectators as any)[storedPid]);

          if (matchedPlayer) {
            setCurrentPlayer(matchedPlayer);
            setShowJoinModal(false);
          } else {
            // Player is not currently in room, attempt auto-join if nickname exists
            const defaultName = typeof window !== 'undefined' ? (localStorage.getItem('feto_username') || localStorage.getItem('feto_default_name')) : null;
            const defaultAvatar = typeof window !== 'undefined' ? (localStorage.getItem('feto_avatar') || localStorage.getItem('feto_default_avatar') || 'cyber_cat') as NeonAvatarId : 'cyber_cat';

            if (defaultName) {
              socketJoinRoom({ roomCode, username: defaultName, avatar: defaultAvatar }).catch(() => {
                setShowJoinModal(true);
              });
            } else {
              setShowJoinModal(true);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch initial room state:', err);
      }
    };

    fetchInitialRoomState();

    const attemptReconnectionOrModal = () => {
      const storedToken = getReconnectToken(roomCode);
      const storedPlayerId =
        (typeof window !== 'undefined' &&
          (localStorage.getItem(`feto_player_${roomCode}`) ||
            sessionStorage.getItem(`feto_player_id_${roomCode}`) ||
            localStorage.getItem('feto_persistent_player_id') ||
            sessionStorage.getItem('feto_persistent_player_id'))) ||
        null;

      if (storedToken && storedPlayerId) {
        socketReconnectRoom({ reconnectToken: storedToken }).catch(() => {});
      } else {
        const defaultName = typeof window !== 'undefined' ? (localStorage.getItem('feto_username') || localStorage.getItem('feto_default_name')) : null;
        const defaultAvatar = typeof window !== 'undefined' ? (localStorage.getItem('feto_avatar') || localStorage.getItem('feto_default_avatar') || 'cyber_cat') as NeonAvatarId : 'cyber_cat';

        if (defaultName) {
          socketJoinRoom({ roomCode, username: defaultName, avatar: defaultAvatar }).catch(() => {
            setShowJoinModal(true);
            setIsInitializing(false);
          });
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

      const storedPid =
        (typeof window !== 'undefined' &&
          (localStorage.getItem(`feto_player_${roomCode}`) ||
            sessionStorage.getItem(`feto_player_id_${roomCode}`) ||
            sessionStorage.getItem('feto_persistent_player_id') ||
            localStorage.getItem('feto_persistent_player_id'))) ||
        '';

      const foundPlayer = newRoom.players.find(
        (p) => p.id === currentPlayer?.id || p.id === storedPid || (p as any).socketId === socket.id
      );
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
      if (updatedRoom.status === 'lobby') {
        setGameStateSync(null);
        setCurrentPhase(null);
        setTimerState(null);
        setCountdown(null);
      }
      if (currentPlayer) {
        const me = updatedRoom.players.find((p) => p.id === currentPlayer.id);
        if (me) setCurrentPlayer(me);
      }
    };

    const handleLobbyReturned = (data: { room?: PublicRoomState }) => {
      if (data?.room) {
        setRoom(data.room);
      }
      setGameStateSync(null);
      setCurrentPhase(null);
      setTimerState(null);
      setCountdown(null);
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
    socket.on('game:lobby_returned', handleLobbyReturned);
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
      socket.off('game:lobby_returned', handleLobbyReturned);
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

  const handleSaveSettings = async (newSettings: RoomSettingsPayload): Promise<void> => {
    sound.playClick();
    if (newSettings.isSoloDevMode !== undefined) {
      setIsSoloDevMode(Boolean(newSettings.isSoloDevMode));
    }
    await socketUpdateSettings(newSettings);
    setShowSettingsModal(false);
    showToast(isArabic ? 'تم تحديث إعدادات الغرفة!' : 'Room settings updated!');
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
    <div className="min-h-[100dvh] bg-[#F9FAFB] text-[#111827] flex flex-col w-full relative safe-top overflow-x-hidden">
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
          {/* COMPACT TOP NAVBAR: BRAND LOGO LEFT, ROOM CODE + ROUND + TIMER + SOUND + LEAVE RIGHT */}
          <div className="w-full bg-white rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 mb-2.5 flex items-center justify-between gap-2 border border-gray-200 shadow-sm shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <BrandLogo size="nav" showSubtitle={false} />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {phaseEndsAt && (
                <div
                  className={`px-2 py-0.5 rounded-lg border text-[11px] sm:text-xs font-bold font-mono transition-colors flex items-center gap-1 force-ltr ${
                    gameTimer.isUrgent
                      ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                      : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                  title={isArabic ? 'الوقت المتبقي للجولة' : 'Remaining Phase Time'}
                >
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span>{gameTimer.formatted}</span>
                </div>
              )}
              <div className="px-2 py-0.5 rounded-lg bg-gray-100 border border-gray-200 text-[11px] sm:text-xs font-bold text-gray-700 font-mono force-ltr" data-room-code="true">
                {roomCode}
              </div>
              <div className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] sm:text-xs font-bold text-blue-700 whitespace-nowrap force-ltr">
                {room.currentRound}/{room.config.totalRounds}
              </div>
              <LanguageToggle />
              <SoundToggle />
              <button
                onClick={handleLeaveRoom}
                className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 transition-all"
                title={isArabic ? 'مغادرة الغرفة' : 'Leave Room'}
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>

          {/* HOST IN-GAME CONTROL BAR */}
          {isHost && (
            <div className="w-full bg-white rounded-2xl px-3 py-2 mb-3 border border-gray-200 shadow-xs flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span className="hidden sm:inline">{isArabic ? 'تحكم المضيف' : 'Host Controls'}</span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {isRoundResultsPhase ? (
                  <button
                    onClick={handleNextRound}
                    disabled={isActionPending}
                    className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    <span>{isArabic ? 'الجولة التالية' : nextRoundLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                ) : (
                  <button
                    onClick={handleEndRoundNow}
                    disabled={isActionPending}
                    className="h-8 px-2.5 sm:px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title={isArabic ? 'إنهاء الجولة الآن وإظهار النتائج' : 'End Round Now & Reveal Results'}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isArabic ? 'إنهاء الجولة' : 'End Round Now'}</span>
                  </button>
                )}

                <button
                  onClick={() => setShowBackToLobbyModal(true)}
                  disabled={isActionPending}
                  className="h-8 px-2.5 sm:px-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title={isArabic ? 'إعادة كل اللاعبين للوبي' : 'Return all players to lobby'}
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isArabic ? 'العودة للوبي' : 'Back to Lobby'}</span>
                </button>
              </div>
            </div>
          )}

          {countdown !== null && countdown > 0 ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="my-auto text-center py-20 flex flex-col items-center justify-center"
            >
              <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                <span>{isArabic ? 'المباراة تبدأ خلال' : 'Match Starting In'}</span>
              </div>
              <div className="text-9xl md:text-[11rem] font-extrabold text-blue-600 font-display force-ltr">
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
              onAction={handleGameAction}
              isHost={Boolean(isHost)}
            />
          ) : room.config.gameMode === 'quiz_battle' ? (
            <QuizBattleGameView
              gameState={gameStateSync.state}
              currentPlayer={currentPlayer}
              players={room.players}
              roomCode={roomCode}
              onAction={handleGameAction}
            />
          ) : room.config.gameMode === 'word_battle' ? (
            <WordBattleGameView
              gameState={gameStateSync.state}
              currentPlayer={currentPlayer}
              players={room.players}
              roomCode={roomCode}
              onAction={handleGameAction}
              isHost={Boolean(isHost)}
            />
          ) : room.config.gameMode === 'truth_or_dare' ? (
            <TruthOrDareGameView
              gameState={gameStateSync.state}
              currentPlayer={currentPlayer}
              players={room.players}
              roomCode={roomCode}
              onAction={handleGameAction}
              isHost={Boolean(isHost)}
            />
          ) : room.config.gameMode === 'never_have_i_ever' ? (
            <NeverHaveIEverGameView
              gameState={gameStateSync.state}
              currentPlayer={currentPlayer}
              players={room.players}
              roomCode={roomCode}
              onAction={handleGameAction}
              isHost={Boolean(isHost)}
            />
          ) : room.config.gameMode === 'most_likely_to' ? (
            <MostLikelyToGameView
              state={gameStateSync.state}
              players={room.players}
              currentPlayerId={currentPlayer.id}
              isHost={Boolean(isHost)}
              vibeMode={room.config.vibeMode}
              roomCode={roomCode}
              onAction={handleGameAction}
            />
          ) : room.config.gameMode === 'sip_or_spill' ? (
            <SipOrSpillGameView
              state={gameStateSync.state}
              players={room.players}
              currentPlayerId={currentPlayer.id}
              isHost={Boolean(isHost)}
              vibeMode={room.config.vibeMode}
              roomCode={roomCode}
              onAction={handleGameAction}
            />
          ) : room.config.gameMode === 'silly_roulette' ? (
            <SillyRouletteGameView
              state={gameStateSync.state}
              players={room.players}
              currentPlayerId={currentPlayer.id}
              isHost={Boolean(isHost)}
              vibeMode={room.config.vibeMode}
              roomCode={roomCode}
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
        /* WAITING LOBBY — PLAYER-FIRST MINIMALIST LAYOUT */
        <>
          <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-28 flex-1 flex flex-col gap-5 relative z-10">
            {/* 1. COMPACT TOP HEADER (NO INLINE SETTINGS CLUTTER) */}
            <header className="bg-white rounded-2xl border border-gray-200 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-xs">
              {/* Left/Start: Room Code Badge + Copy Link Icon + QR Icon */}
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-[#F9FAFB] hover:bg-gray-100 border border-gray-200 inline-flex items-center gap-1.5 transition-colors shrink-0 active:scale-95"
                  title={isArabic ? 'اضغط لنسخ كود الغرفة' : 'Tap to copy room code'}
                >
                  {room.config.hasPin && (
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span
                    dir="ltr"
                    data-room-code="true"
                    className="font-mono font-extrabold text-sm sm:text-base tracking-wider text-[#111827] force-ltr"
                  >
                    {isStreamerMode ? '••••••' : roomCode}
                  </span>
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border inline-flex items-center justify-center shrink-0 transition-colors active:scale-95 ${
                    copiedLink
                      ? 'bg-emerald-50 border-emerald-200 text-[#10B981]'
                      : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                  title={isArabic ? 'نسخ رابط الدعوة' : 'Copy Invite Link'}
                  aria-label={isArabic ? 'نسخ رابط الدعوة' : 'Copy Invite Link'}
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <Link2 className="w-4 h-4 shrink-0" />
                  )}
                </button>

                <RoomLobbyQRCode roomCode={roomCode} isStreamerMode={isStreamerMode} compact />
              </div>

              {/* Right/End: Language Toggle + Settings Button + Leave Button */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <LanguageToggle
                  showIcon={false}
                  className="!h-9 sm:!h-10 !px-2.5 !rounded-xl !shadow-none"
                />

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setShowSettingsModal(true);
                  }}
                  className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-[#111827] text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors whitespace-nowrap active:scale-95"
                  title={isArabic ? 'إعدادات الغرفة' : 'Room Settings'}
                  aria-label={isArabic ? 'إعدادات الغرفة' : 'Room Settings'}
                >
                  <Settings className="w-4 h-4 text-gray-600 shrink-0" />
                  <span className="hidden min-[360px]:inline">
                    {isArabic ? 'الإعدادات' : 'Settings'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="w-9 h-9 sm:w-auto sm:h-10 sm:px-3 rounded-xl bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-600 hover:text-rose-600 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors whitespace-nowrap active:scale-95"
                  title={isArabic ? 'مغادرة الغرفة' : 'Leave Room'}
                  aria-label={isArabic ? 'مغادرة الغرفة' : 'Leave Room'}
                >
                  <LogOut className="w-4 h-4 rtl:rotate-180 shrink-0" />
                  <span className="hidden sm:inline">{isArabic ? 'مغادرة' : 'Leave'}</span>
                </button>
              </div>
            </header>

            {/* 2. PLAYERS ROSTER AT THE VERY TOP (HERO PRIORITY) */}
            <section className="space-y-3">
              {/* Players Header Bar */}
              <div className="flex items-center justify-between gap-3 px-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <h1 className="text-base sm:text-lg font-bold text-[#111827] tracking-tight truncate flex items-center gap-1.5">
                    <span>{isArabic ? 'اللاعبون' : 'Players'}</span>
                    <span className="font-mono text-sm sm:text-base font-bold text-gray-500 tabular-nums force-ltr">
                      ({activePlayers.length}/{maxPlayers})
                    </span>
                  </h1>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {room.config.vibeMode === 'sip_edition' && (
                    <button
                      type="button"
                      onClick={handleQuickTakeSip}
                      className="h-8 px-2.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                      title={isArabic ? 'تسجيل رشفة' : 'Log a sip'}
                    >
                      <Wine className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="tabular-nums force-ltr">
                        {room.sipsCount?.[currentPlayer?.id || ''] || 0}
                      </span>
                    </button>
                  )}

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 whitespace-nowrap tabular-nums">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    <span>
                      {isArabic
                        ? `${activePlayers.filter((p) => p.isReady).length} جاهز`
                        : `${activePlayers.filter((p) => p.isReady).length} Ready`}
                    </span>
                  </span>
                </div>
              </div>

              {/* Responsive 2-Col Mobile / 3-Col Desktop Player Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                {activePlayers.map((player) => {
                  const isDisconnected = player.connectionStatus === 'disconnected_grace';
                  const remainingGrace = graceCountdowns[player.id] ?? 45;
                  const isMe = player.id === currentPlayer?.id;
                  const canKick =
                    isHost &&
                    player.id !== currentPlayer?.id &&
                    player.id !== room.hostId &&
                    !player.isHost;

                  return (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.16 }}
                      className={`relative bg-white rounded-2xl p-3 border transition-colors flex items-center gap-2.5 sm:gap-3 min-w-0 ${
                        isDisconnected
                          ? 'border-rose-200 bg-rose-50/40'
                          : player.isReady
                          ? 'border-emerald-200'
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Avatar with Host Crown Badge */}
                      <div className="relative shrink-0">
                        {player.isHost && (
                          <div
                            className="absolute -top-1.5 -right-1.5 rtl:-right-auto rtl:-left-1.5 z-10 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-xs ring-2 ring-white"
                            title={isArabic ? 'مضيف الغرفة' : 'Room Host'}
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

                      {/* Name & Crisp Status Indicator */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-[#111827] truncate">
                            {player.username}
                          </span>
                          {isMe && (
                            <span className="text-[11px] font-semibold text-[#2563EB] shrink-0">
                              {isArabic ? '(أنت)' : '(You)'}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {isDisconnected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 tabular-nums">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span className="force-ltr">{remainingGrace}s</span>
                            </span>
                          ) : player.isReady ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#10B981]">
                              <span>{isArabic ? 'جاهز ✓' : 'Ready ✓'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-medium text-gray-400">
                              {isArabic ? 'بانتظار...' : 'Waiting...'}
                            </span>
                          )}

                          {room.config.isTeamMode && player.team && (
                            <>
                              <span className="text-gray-300 text-[10px]" aria-hidden="true">·</span>
                              <span
                                className={`text-[11px] font-semibold ${
                                  player.team === 'red' ? 'text-rose-600' : 'text-[#2563EB]'
                                }`}
                              >
                                {player.team === 'red'
                                  ? (isArabic ? 'أحمر' : 'Red')
                                  : (isArabic ? 'أزرق' : 'Blue')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Subtle Host-Only Kick (×) Button */}
                      {canKick && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setKickTarget(player);
                          }}
                          className="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center shrink-0 transition-colors self-start"
                          title={isArabic ? `طرد ${player.username}` : `Kick ${player.username}`}
                          aria-label={isArabic ? `طرد ${player.username}` : `Kick ${player.username}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Subtle Invite Prompt when Solo in Room */}
              {activePlayers.length < 2 && (
                <div className="bg-white rounded-xl border border-dashed border-gray-200 px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <p className="text-xs text-gray-500">
                    {isArabic
                      ? 'شارك كود الغرفة أو الرابط مع أصحابك للانضمام فوراً'
                      : 'Share the room code or invite link so friends can join instantly.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyInviteLink}
                    className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 whitespace-nowrap shrink-0"
                  >
                    {copiedLink
                      ? (isArabic ? 'تم النسخ ✓' : 'Copied ✓')
                      : (isArabic ? 'نسخ الرابط' : 'Copy Link')}
                  </button>
                </div>
              )}

              {/* Compact Team Squad Switcher (Only when Team Mode is enabled in Settings) */}
              {room.config.isTeamMode && (
                <div className="bg-white rounded-2xl border border-gray-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
                    <Shield className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>{isArabic ? 'وضع الفرق:' : 'Teams:'}</span>
                    <span className="text-[#2563EB] tabular-nums">
                      {isArabic ? 'أزرق' : 'Blue'} ({activePlayers.filter((p) => p.team !== 'red').length})
                    </span>
                    <span className="text-gray-300" aria-hidden="true">/</span>
                    <span className="text-rose-600 tabular-nums">
                      {isArabic ? 'أحمر' : 'Red'} ({activePlayers.filter((p) => p.team === 'red').length})
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      const targetTeam = currentPlayer?.team === 'blue' ? 'red' : 'blue';
                      socketSelectTeam(targetTeam as PlayerTeam);
                    }}
                    className="h-8 px-3 rounded-lg bg-[#F9FAFB] hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-[#111827] transition-colors whitespace-nowrap"
                  >
                    {isArabic ? 'تبديل الفريق ⇄' : 'Switch Team ⇄'}
                  </button>
                </div>
              )}
            </section>

            {/* 3. COMPACT GAME SELECTOR / PLAYLIST BELOW PLAYERS */}
            <GamePlaylistQueue
              selectedGames={
                room.selectedGames ||
                room.config.selectedGames || [room.config.gameMode || 'who_is_imposter']
              }
              currentGameIndex={room.currentGameIndex || 0}
              isHost={Boolean(isHost)}
              onUpdatePlaylist={handleUpdatePlaylist}
              onOpenCustomCard={() => setShowCustomCardModal(true)}
            />
          </div>

          {/* 4. STICKY / FIXED BOTTOM ACTION BAR ("READY" & "START GAME") */}
          <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 pb-safe">
            <div className="max-w-md mx-auto flex items-center gap-3">
              {isHost ? (
                <>
                  {/* Host Ready Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleReady}
                    className={`h-12 px-4 sm:px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-[0.98] whitespace-nowrap ${
                      currentPlayer?.isReady
                        ? 'bg-[#10B981] hover:bg-emerald-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-[#111827] border border-gray-200'
                    }`}
                  >
                    {currentPlayer?.isReady ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{isArabic ? 'جاهز ✓' : 'Ready ✓'}</span>
                      </>
                    ) : (
                      <span>{isArabic ? 'غير جاهز' : 'Not Ready'}</span>
                    )}
                  </button>

                  {/* Host Primary Start Game / Force Start Button */}
                  <button
                    type="button"
                    id="btn-start-game"
                    onClick={() => handleStartGame(!allReady && activePlayers.length >= 2)}
                    disabled={!allReady && activePlayers.length < 2}
                    title={
                      allReady
                        ? (isArabic ? 'ابدأ اللعبة' : 'Start Game')
                        : activePlayers.length >= 2
                        ? (isArabic ? 'بدء إجباري باللاعبين المتصلين' : 'Force start with connected players')
                        : (isArabic
                            ? 'مطلوب لاعبين على الأقل (أو فعّل وضع التجربة في الإعدادات)'
                            : 'At least 2 players required (or enable Solo Test Mode in Settings)')
                    }
                    className={`flex-1 h-12 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap ${
                      allReady || activePlayers.length >= 2
                        ? 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm cursor-pointer'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {allReady || activePlayers.length < 2 ? (
                      <>
                        <Play className="w-4 h-4 fill-current rtl:rotate-180 shrink-0" />
                        <span>{isArabic ? 'ابدأ اللعبة' : 'Start Game'}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current shrink-0" />
                        <span>{isArabic ? 'بدء إجباري' : 'Force Start'}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Non-Host Full-Width Thumb-Friendly Ready Toggle */
                <button
                  type="button"
                  onClick={handleToggleReady}
                  className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap ${
                    currentPlayer?.isReady
                      ? 'bg-[#10B981] hover:bg-emerald-600 text-white shadow-sm'
                      : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm'
                  }`}
                >
                  {currentPlayer?.isReady ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{isArabic ? 'جاهز ✓' : 'Ready ✓'}</span>
                    </>
                  ) : (
                    <span>{isArabic ? 'جاهز للعب' : 'Ready'}</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
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
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {isArabic ? `انضم للروم ` : 'Join Room '}
                <span className="force-ltr font-mono">{roomCode}</span>
              </h3>
              <p className="text-xs text-gray-500 mb-5 font-medium">
                {isArabic ? 'اختر شخصيتك واسمك المستعار للدخول.' : 'Choose your avatar and nickname to enter.'}
              </p>

              {errorMessage && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleModalJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    {isArabic ? 'اسمك المستعار' : 'Your Nickname'}
                  </label>
                  <input
                    type="text"
                    value={joinUsername}
                    onChange={(e) => setJoinUsername(e.target.value.slice(0, 18))}
                    placeholder={isArabic ? 'اكتب اسمك هنا...' : 'Enter nickname...'}
                    required
                    className="w-full h-11 bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-xl px-4 text-gray-900 font-medium text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    {isArabic ? 'اختر الشخصية' : 'Pick Avatar'}
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
                    {isArabic ? 'رمز PIN (لو الروم خاص)' : 'Room PIN (If private)'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full h-11 bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-xl px-4 text-center text-lg tracking-widest text-gray-900 font-bold outline-none force-ltr"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-sm mt-2 transition-all"
                >
                  {isArabic ? 'ادخل اللوبي' : 'Enter Waiting Lobby'}
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
              <h4 className="text-lg font-bold text-gray-900">
                {isArabic ? `طرد ${kickTarget.username}؟` : `Kick ${kickTarget.username}?`}
              </h4>
              <p className="text-xs text-gray-500 font-medium">
                {isArabic
                  ? 'هل أنت متأكد من رغبتك في إزالة هذا اللاعب من الغرفة؟'
                  : 'Are you sure you want to remove this player from the room?'}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setKickTarget(null)}
                  className="flex-1 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-bold text-xs"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleConfirmKick}
                  className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 rounded-xl text-white font-bold text-xs shadow-sm"
                >
                  {isArabic ? 'نعم، اطرده' : 'Yes, Kick'}
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

      {/* BACK TO LOBBY CONFIRMATION MODAL */}
      <AnimatePresence>
        {showBackToLobbyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-2xl p-6 border border-gray-200 shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isArabic ? 'العودة للوبي بنفس الروم؟' : 'Return Crew to Lobby?'}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {isArabic ? (
                  <>
                    كل اللاعبين هيفضلوا في روم <strong className="force-ltr font-mono">{roomCode}</strong> ونرجع سوا لاختيار لعبة تانية.
                  </>
                ) : (
                  <>
                    All connected players will stay in Room <strong>{roomCode}</strong> and return together to pick another game.
                  </>
                )}
              </p>

              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={resetScoresOnLobbyReturn}
                    onChange={(e) => setResetScoresOnLobbyReturn(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>{isArabic ? 'تصفير نقاط كل اللاعبين للبدء من جديد' : 'Reset All Player Scores to 0'}</span>
                </label>
                <p className="text-[11px] text-gray-500 mt-1 ml-6 rtl:mr-6 rtl:ml-0">
                  {resetScoresOnLobbyReturn
                    ? (isArabic ? 'سيتم مسح جميع النقاط لبدء ماتش جديد تماماً.' : 'Scores will be cleared for a brand-new match.')
                    : (isArabic ? 'سيحتفظ اللاعبون بنقاطهم السابقة في هذه الجلسة.' : 'Players keep their accumulated scores from this session.')}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBackToLobbyModal(false)}
                  disabled={isActionPending}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmBackToLobby(resetScoresOnLobbyReturn)}
                  disabled={isActionPending}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  <span>{isActionPending ? (isArabic ? 'جاري العودة...' : 'Returning...') : (isArabic ? 'العودة للوبي' : 'Back to Lobby')}</span>
                </button>
              </div>
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
        isStreamerMode={isStreamerMode}
        onToggleStreamerMode={() => {
          sound.playClick();
          const next = !isStreamerMode;
          setIsStreamerMode(next);
          showToast(
            next
              ? (isArabic ? 'تم تفعيل وضع البث (الكود مخفي)' : 'Streamer Mode Active (Code Hidden)')
              : (isArabic ? 'تم إظهار كود الغرفة' : 'Room Code Visible')
          );
        }}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
