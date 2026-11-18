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
  Zap,
  Sparkles,
  Users
} from 'lucide-react';
import {
  GameMode,
  GamePhaseChangePayload,
  NeonAvatarId,
  NEON_AVATARS,
  PlayerSummary,
  PrivateRolePayload,
  PublicRoomConfig,
  PublicRoomState,
  SecretRolePayload,
  TimerTickPayload
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { ImposterGameView } from '@/components/games/ImposterGameView';
import { DrawAndGuessGameView } from '@/components/games/DrawAndGuessGameView';
import { QuizBattleGameView } from '@/components/games/QuizBattleGameView';
import {
  clearReconnectSession,
  getReconnectToken,
  getSocket,
  socketJoinRoom,
  socketKickPlayer,
  socketLeaveRoom,
  socketReconnectRoom,
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

  // Notifications & UI Status
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Kick modal
  const [kickTarget, setKickTarget] = useState<PlayerSummary | null>(null);

  // Grace period countdown state map for disconnected players
  const [graceCountdowns, setGraceCountdowns] = useState<Record<string, number>>({});

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

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

    const handlePlayerDisconnected = (data: {
      playerId: string;
      username: string;
      gracePeriodSeconds: number;
      graceExpiresAt: number;
    }) => {
      showToast(`⚠️ ${data.username} disconnected! 45s grace period to reconnect.`);
    };

    const handlePlayerReconnected = (player: PlayerSummary) => {
      sound.playReady();
      showToast(`⚡ ${player.username} reconnected!`);
    };

    const handleHostMigrated = (data: {
      newHostId: string;
      previousHostId: string;
      newHostUsername: string;
    }) => {
      sound.playFanfare();
      showToast(`👑 ${data.newHostUsername} is now the Room Host!`);
    };

    const handleKicked = (data: { reason: string }) => {
      alert(`You have been kicked: ${data.reason}`);
      clearReconnectSession(roomCode);
      router.push('/');
    };

    const handleGameStarting = (data: { countdownSeconds: number }) => {
      sound.playCountdown();
      setCountdown(data.countdownSeconds);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev && prev > 1) {
            sound.playCountdown();
            return prev - 1;
          }
          clearInterval(timer);
          return null;
        });
      }, 1000);
    };

    const handlePhaseChange = (phase: GamePhaseChangePayload) => {
      setCurrentPhase(phase);
    };

    const handleSecretRole = (role: SecretRolePayload) => {
      setSecretRole(role);
      sound.playFanfare();
    };

    const handlePrivateRole = (role: PrivateRolePayload) => {
      setPrivateRole(role);
      sound.playFanfare();
    };

    const handleStateSync = (data: { gameMode: GameMode; state: any }) => {
      setGameStateSync(data);
    };

    const handleTimerTick = (tick: TimerTickPayload) => {
      setTimerState(tick);
    };

    // Attach listeners
    socket.on('room:state', handleRoomState);
    socket.on('room:player-joined', handlePlayerJoined);
    socket.on('room:player-left', handlePlayerLeft);
    socket.on('room:player-disconnected', handlePlayerDisconnected);
    socket.on('room:player-reconnected', handlePlayerReconnected);
    socket.on('room:host-migrated', handleHostMigrated);
    socket.on('room:kicked', handleKicked);
    socket.on('game:starting', handleGameStarting);
    socket.on('game:phase-change', handlePhaseChange);
    socket.on('game:secret-role', handleSecretRole);
    socket.on('game:private_role', handlePrivateRole);
    socket.on('game:state_sync', handleStateSync);
    socket.on('game:timer-tick', handleTimerTick);

    // Initial Join or Reconnect attempt
    const initRoomSession = async () => {
      setIsInitializing(true);
      const existingToken = getReconnectToken(roomCode);

      if (existingToken) {
        try {
          console.log('🔄 Attempting reconnection with session token...');
          const res = await socketReconnectRoom({ reconnectToken: existingToken });
          setRoom(res.room);
          setCurrentPlayer(res.player);
          if (res.secretRole) setSecretRole(res.secretRole);
          setIsInitializing(false);
          return;
        } catch (err) {
          console.warn('Reconnection token rejected, clearing:', err);
          clearReconnectSession(roomCode);
        }
      }

      // Check if user has saved profile in localStorage to auto-join
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('feto_username') : null;
      const savedAvatar = (typeof window !== 'undefined'
        ? localStorage.getItem('feto_avatar')
        : 'cyber_cat') as NeonAvatarId;

      if (savedUser) {
        setJoinUsername(savedUser);
        setJoinAvatar(savedAvatar);
      }

      // Open Join Modal to complete entry
      setShowJoinModal(true);
      setIsInitializing(false);
    };

    initRoomSession();

    return () => {
      socket.off('room:state', handleRoomState);
      socket.off('room:player-joined', handlePlayerJoined);
      socket.off('room:player-left', handlePlayerLeft);
      socket.off('room:player-disconnected', handlePlayerDisconnected);
      socket.off('room:player-reconnected', handlePlayerReconnected);
      socket.off('room:host-migrated', handleHostMigrated);
      socket.off('room:kicked', handleKicked);
      socket.off('game:starting', handleGameStarting);
      socket.off('game:phase-change', handlePhaseChange);
      socket.off('game:secret-role', handleSecretRole);
      socket.off('game:private_role', handlePrivateRole);
      socket.off('game:state_sync', handleStateSync);
      socket.off('game:timer-tick', handleTimerTick);
    };
  }, [roomCode, router, showToast]);

  // Submit Join Modal
  const handleModalJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinUsername.trim()) {
      setErrorMessage('Please enter a nickname.');
      return;
    }

    try {
      const res = await socketJoinRoom({
        roomCode,
        username: joinUsername.trim(),
        avatar: joinAvatar,
        pin: joinPin.trim() || undefined
      });

      setRoom(res.room);
      setCurrentPlayer(res.player);
      setShowJoinModal(false);
      setErrorMessage(null);
      sound.playReady();
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

  const isHost = currentPlayer?.isHost ?? false;
  const activePlayers = room?.players ?? [];
  const maxPlayers = room?.config.maxPlayers ?? 15;
  const allReady = activePlayers.length >= 2 && activePlayers.every((p) => p.isReady);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080f]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto shadow-neon-cyan" />
          <p className="text-cyan-300 font-bold uppercase tracking-wider text-sm">
            Connecting to FETO Room {roomCode}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-7xl mx-auto px-4 py-6 md:py-8 relative">
      {/* Background Neon Lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-feto-magenta/10 rounded-full blur-3xl pointer-events-none" />

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

      {/* TOP HEADER / BAR */}
      <header className="glass-panel rounded-2xl p-4 md:p-5 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 border border-cyan-500/20">
        {/* Room Code & Info */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleCopyCode}
            className="group flex items-center gap-2 px-4 py-2 bg-feto-dark border border-cyan-500/50 hover:border-cyan-400 rounded-xl transition-all shadow-neon-cyan"
            title="Click to copy Room Code"
          >
            <span className="text-xs uppercase text-slate-400 font-bold">Room</span>
            <span className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white tracking-widest">
              {roomCode}
            </span>
            {copiedCode ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            )}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white capitalize">
                {room?.config.gameMode.replace('_', ' ') || 'Party Game'}
              </span>
              {room?.config.hasPin && (
                <span className="px-2 py-0.5 bg-yellow-950/60 border border-yellow-500/40 text-[10px] font-bold text-yellow-300 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PIN
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {activePlayers.length} / {maxPlayers} Players
              </span>
              {room?.spectatorCount ? (
                <span className="text-purple-400">• {room.spectatorCount} Spectators</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleCopyInviteLink}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            <span>Invite Link</span>
          </button>

          {isHost && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2.5 bg-feto-dark hover:bg-feto-card border border-feto-border hover:border-slate-400 text-slate-300 rounded-xl transition-all"
              title="Room Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleLeaveRoom}
            className="p-2.5 bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 hover:border-red-400 text-red-400 rounded-xl transition-all"
            title="Leave Room"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN GAME / LOBBY AREA                                    */}
      {/* ======================================================== */}
      {room?.status === 'in_game' || room?.status === 'countdown' ? (
        /* IN-GAME ACTIVE SCREEN */
        <div className="flex-1 flex flex-col items-center justify-start py-2 relative z-10 w-full min-h-[600px]">
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
          ) : (
            <div className="w-full max-w-xl glass-panel p-8 rounded-3xl text-center space-y-4 my-auto">
              <h3 className="text-2xl font-bold text-white">Party Mode Active</h3>
              <p className="text-slate-400">Enjoy the game with your group!</p>
            </div>
          )}
        </div>
      ) : (
        /* WAITING LOBBY (2 TO 15 PLAYERS) */
        <div className="flex-1 flex flex-col justify-between py-2 relative z-10">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Waiting Lobby</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {activePlayers.length} / {maxPlayers} Players
                </span>
              </h2>
              <span className="text-xs text-slate-400">
                {activePlayers.length < 2
                  ? 'Waiting for at least 2 players to start...'
                  : allReady
                  ? 'All players ready! Host can start.'
                  : 'Waiting for everyone to ready up...'}
              </span>
            </div>

            {/* 15-PLAYER RESPONSIVE GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
              {/* Connected / In-Lobby Players */}
              {activePlayers.map((player) => {
                const isDisconnected = player.connectionStatus === 'disconnected_grace';
                const remainingGrace = graceCountdowns[player.id] ?? 45;

                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`relative glass-panel rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all ${
                      player.isReady
                        ? 'border-green-500/50 shadow-neon-green'
                        : isDisconnected
                        ? 'border-orange-500/50 bg-orange-950/20'
                        : 'border-feto-border'
                    }`}
                  >
                    {/* Host Crown */}
                    {player.isHost && (
                      <div
                        className="absolute -top-3 -right-2 p-1.5 bg-yellow-400 rounded-full shadow-neon-gold transform rotate-12"
                        title="Room Host"
                      >
                        <Crown className="w-4 h-4 text-black fill-black" />
                      </div>
                    )}

                    {/* Avatar Display */}
                    <div className="my-2">
                      <NeonAvatarDisplay
                        avatarId={player.avatar}
                        size="md"
                        showGlow={player.isReady}
                        isReady={player.isReady}
                      />
                    </div>

                    {/* Username & Me tag */}
                    <div className="w-full truncate mb-2">
                      <div className="font-bold text-sm text-white truncate">
                        {player.username}
                        {player.id === currentPlayer?.id && (
                          <span className="ml-1 text-[10px] text-cyan-400 font-normal">(You)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">Score: {player.score}</div>
                    </div>

                    {/* Status Badge */}
                    <div className="w-full">
                      {isDisconnected ? (
                        <div className="w-full py-1 px-2 bg-orange-950/80 border border-orange-500/50 rounded-lg text-orange-300 text-[10px] font-bold flex items-center justify-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>Reconnecting ({remainingGrace}s)</span>
                        </div>
                      ) : player.isReady ? (
                        <div className="w-full py-1 px-2 bg-green-950/60 border border-green-500/40 rounded-lg text-green-300 text-[11px] font-extrabold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          <span>READY</span>
                        </div>
                      ) : (
                        <div className="w-full py-1 px-2 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-400 text-[11px] font-semibold">
                          NOT READY
                        </div>
                      )}
                    </div>

                    {/* Host Kick Option */}
                    {isHost && player.id !== currentPlayer?.id && (
                      <button
                        onClick={() => setKickTarget(player)}
                        className="mt-2 text-[10px] text-slate-500 hover:text-red-400 font-semibold flex items-center gap-1"
                      >
                        <UserX className="w-3 h-3" /> Kick
                      </button>
                    )}
                  </motion.div>
                );
              })}

              {/* Dotted empty slot placeholders up to room's max capacity */}
              {Array.from({ length: Math.max(0, maxPlayers - activePlayers.length) }).map(
                (_, idx) => (
                  <div
                    key={`slot-${idx}`}
                    className="h-44 rounded-2xl border-2 border-dashed border-slate-800/80 flex flex-col items-center justify-center p-4 text-center text-slate-600 select-none"
                  >
                    <div className="w-12 h-12 rounded-xl border border-dashed border-slate-800 flex items-center justify-center mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        {activePlayers.length + idx + 1}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-600">Waiting for Player</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* BOTTOM CONTROLS DOCK */}
          <div className="glass-panel-neon rounded-3xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-cyan-500/30">
            {/* Player Info Preview */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {currentPlayer && (
                <NeonAvatarDisplay avatarId={currentPlayer.avatar} size="sm" showGlow={false} />
              )}
              <div>
                <div className="text-xs text-slate-400">Playing as</div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentPlayer?.username}</span>
                  {isHost && (
                    <span className="px-2 py-0.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-[10px] font-extrabold rounded-full">
                      HOST
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* Ready Toggle */}
              <button
                onClick={handleToggleReady}
                className={`flex-1 sm:flex-initial px-6 py-4 rounded-2xl font-extrabold text-sm md:text-base tracking-wide transition-all flex items-center justify-center gap-2 ${
                  currentPlayer?.isReady
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black shadow-neon-green font-black'
                }`}
              >
                {currentPlayer?.isReady ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span>I'M READY (WAITING)</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-black" />
                    <span>READY UP!</span>
                  </>
                )}
              </button>

              {/* Host Start Game Button */}
              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={!allReady}
                  title={
                    !allReady
                      ? 'All players must be ready and at least 2 players are needed'
                      : 'Start Game'
                  }
                  className={`flex-1 sm:flex-initial px-8 py-4 rounded-2xl font-black text-sm md:text-base tracking-wider transition-all flex items-center justify-center gap-2 ${
                    allReady
                      ? 'btn-neon-cyan text-white shadow-neon-cyan cursor-pointer'
                      : 'bg-slate-800/60 border border-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>START GAME</span>
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
              className="w-full max-w-md glass-panel-neon rounded-3xl p-6 md:p-8"
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
                    className="w-full bg-feto-dark border border-feto-border focus:border-cyan-400 rounded-xl px-4 py-3 text-white outline-none"
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
                    className="w-full bg-feto-dark border border-feto-border focus:border-yellow-400 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-white outline-none"
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
      {/* ROOM SETTINGS MODAL (Host only)                          */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showSettingsModal && room && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md glass-panel-neon rounded-3xl p-6 md:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  <span>Host Room Settings</span>
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-slate-400 hover:text-white text-2xl font-bold leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs font-semibold text-slate-300 uppercase">
                    <span>Max Players</span>
                    <span className="text-cyan-400 font-bold">{room.config.maxPlayers}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={room.config.maxPlayers}
                    onChange={(e) =>
                      socketUpdateSettings({ maxPlayers: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-2">
                    Round Duration
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((s) => (
                      <button
                        key={s}
                        onClick={() => socketUpdateSettings({ roundDurationSeconds: s })}
                        className={`py-2 rounded-xl border text-xs font-bold ${
                          room.config.roundDurationSeconds === s
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-neon-cyan'
                            : 'border-feto-border bg-feto-card text-slate-400'
                        }`}
                      >
                        {s}s
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-3 bg-feto-card hover:bg-feto-cardHover border border-feto-border rounded-xl text-white font-bold text-sm mt-4"
                >
                  Close Settings
                </button>
              </div>
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
    </div>
  );
}
