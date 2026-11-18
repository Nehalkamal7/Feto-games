'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatMessage,
  DrawAndGuessPublicState,
  DrawStroke,
  PlayerSummary
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import {
  Brush,
  Eraser,
  RotateCcw,
  Trash2,
  Send,
  Sparkles,
  CheckCircle2,
  Palette
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { getSocket } from '@/lib/socket';

interface DrawAndGuessGameViewProps {
  gameState: DrawAndGuessPublicState;
  currentPlayer: PlayerSummary;
  players: PlayerSummary[];
  roomCode: string;
}

const PALETTE_COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#00F0FF', // Neon Cyan
  '#FF007A', // Neon Magenta
  '#FFE600', // Neon Yellow
  '#39FF14', // Neon Green
  '#FF5E00', // Neon Orange
  '#8B00FF', // Neon Violet
  '#0072FF', // Electric Blue
  '#FF2A2A'  // Crimson Red
];

const BRUSH_SIZES = [3, 8, 16, 26];

export const DrawAndGuessGameView: React.FC<DrawAndGuessGameViewProps> = ({
  gameState,
  currentPlayer,
  players,
  roomCode: _roomCode
}) => {
  const socket = getSocket();

  // Canvas Refs & State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const prevPosRef = useRef<{ x: number; y: number } | null>(null);

  // Tool state (for drawer)
  const [selectedColor, setSelectedColor] = useState('#00F0FF');
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);

  // Chat / Guess input state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const isDrawer = gameState.currentDrawerId === currentPlayer.id;
  const hasGuessed = gameState.correctGuessers.includes(currentPlayer.id);

  // Clear canvas helper
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0a0b14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Draw stroke helper
  const drawStrokeOnCanvas = useCallback((stroke: DrawStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = stroke.isEraser ? '#0a0b14' : stroke.color;
    ctx.lineWidth = stroke.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.prevX * canvas.width, stroke.prevY * canvas.height);
    ctx.lineTo(stroke.currX * canvas.width, stroke.currY * canvas.height);
    ctx.stroke();
  }, []);

  // Setup Canvas Resolution & Listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set internal canvas resolution
    canvas.width = 1000;
    canvas.height = 700;
    clearCanvas();

    const handleIncomingStroke = (stroke: DrawStroke) => {
      drawStrokeOnCanvas(stroke);
    };

    const handleIncomingClear = () => {
      clearCanvas();
    };

    const handleIncomingChat = (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
      if (msg.isCorrectGuess) {
        sound.playReady();
      }
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    };

    socket.on('draw:stroke', handleIncomingStroke);
    socket.on('draw:clear', handleIncomingClear);
    socket.on('chat:message', handleIncomingChat);

    return () => {
      socket.off('draw:stroke', handleIncomingStroke);
      socket.off('draw:clear', handleIncomingClear);
      socket.off('chat:message', handleIncomingChat);
    };
  }, [clearCanvas, drawStrokeOnCanvas, socket]);

  // Pointer position normalizer
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  };

  // Drawing event handlers (Drawer only)
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || gameState.phase !== 'drawing') return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    isDrawingRef.current = true;
    prevPosRef.current = coords;
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawingRef.current || !prevPosRef.current || gameState.phase !== 'drawing') {
      return;
    }
    const currCoords = getCanvasCoords(e);
    if (!currCoords) return;

    const stroke: DrawStroke = {
      prevX: prevPosRef.current.x,
      prevY: prevPosRef.current.y,
      currX: currCoords.x,
      currY: currCoords.y,
      color: selectedColor,
      brushSize: brushSize,
      isEraser: isEraser
    };

    drawStrokeOnCanvas(stroke);
    socket.emit('draw:stroke', stroke);

    prevPosRef.current = currCoords;
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    prevPosRef.current = null;
  };

  // Clear button (Drawer)
  const handleClearButton = () => {
    if (!isDrawer) return;
    sound.playClick();
    clearCanvas();
    socket.emit('draw:clear');
  };

  // Undo button (Drawer)
  const handleUndoButton = () => {
    if (!isDrawer) return;
    sound.playClick();
    socket.emit('draw:undo');
  };

  // Submit word choice (Drawer)
  const handleSelectWord = (word: string) => {
    sound.playClick();
    socket.emit('draw:select_word', { word }, (res: any) => {
      if (res && res.success) {
        sound.playReady();
      }
    });
  };

  // Submit Chat / Guess
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput('');

    socket.emit('chat:send', { message: text });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* ======================================================== */}
      {/* HEADER: WORD MASK / SECRET WORD                         */}
      {/* ======================================================== */}
      <div className="glass-panel-neon rounded-3xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <NeonAvatarDisplay avatarId={gameState.currentDrawerAvatar} size="sm" showGlow={false} />
          <div>
            <div className="text-xs uppercase text-slate-400 font-bold">
              {isDrawer ? 'You Are Drawing!' : `${gameState.currentDrawerUsername} is Drawing`}
            </div>
            <div className="text-xs text-cyan-300 font-semibold">
              Category: {gameState.category || 'General'}
            </div>
          </div>
        </div>

        {/* Secret Word Display (or Masked for Guessers) */}
        <div className="text-center">
          {isDrawer || hasGuessed || gameState.phase === 'round_result' ? (
            <div className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400 tracking-wider">
              {gameState.secretWord || 'Choosing...'}
            </div>
          ) : (
            <div className="text-2xl md:text-3xl font-black text-cyan-300 tracking-[0.3em]">
              {gameState.wordMask || '_ _ _ _'}
            </div>
          )}
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block mt-0.5">
            {gameState.wordLength > 0 ? `${gameState.wordLength} Letters` : 'Round in Progress'}
          </span>
        </div>

        {/* Correct Guessers Pill */}
        <div className="flex items-center gap-2">
          {hasGuessed && (
            <span className="px-3 py-1 bg-green-950/80 border border-green-500/60 rounded-full text-green-300 text-xs font-black flex items-center gap-1 shadow-neon-green">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              <span>GUESSED!</span>
            </span>
          )}
          <span className="text-xs text-slate-400 font-semibold">
            {gameState.correctGuessers.length} / {players.length - 1} Guessed
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN GAMEPLAY AREA: CANVAS & CHAT GUESS FEED             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* CANVAS CONTAINER (3 Columns) */}
        <div className="lg:col-span-3 flex flex-col space-y-3">
          <div className="relative rounded-3xl overflow-hidden border-2 border-feto-border bg-[#0a0b14] shadow-2xl aspect-[4/3] touch-none">
            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              className={`w-full h-full block ${
                isDrawer ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />

            {/* Non-drawer Spectating Tag */}
            {!isDrawer && (
              <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] text-slate-300 border border-slate-700 pointer-events-none">
                Watching Live Stream
              </div>
            )}
          </div>

          {/* DRAWER CONTROLS TOOLBAR (Drawer Only) */}
          {isDrawer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 border border-feto-border"
            >
              {/* Color Palette */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Palette className="w-4 h-4 text-slate-400 mr-1" />
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedColor(c);
                      setIsEraser(false);
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-xl border-2 transition-transform ${
                      selectedColor === c && !isEraser
                        ? 'scale-125 border-white shadow-md'
                        : 'border-slate-800 hover:scale-110'
                    }`}
                  />
                ))}
              </div>

              {/* Brush Sizes & Eraser / Clear */}
              <div className="flex items-center gap-2">
                {/* Brush size buttons */}
                <div className="flex items-center gap-1 bg-feto-dark p-1 rounded-xl border border-feto-border">
                  {BRUSH_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setBrushSize(size);
                        setIsEraser(false);
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        brushSize === size && !isEraser
                          ? 'bg-cyan-500 text-black font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <div
                        className="rounded-full bg-current"
                        style={{ width: `${Math.min(18, size)}px`, height: `${Math.min(18, size)}px` }}
                      />
                    </button>
                  ))}
                </div>

                {/* Eraser */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsEraser(!isEraser);
                  }}
                  className={`p-2 rounded-xl border transition-all ${
                    isEraser
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-neon-yellow'
                      : 'bg-feto-dark border-feto-border text-slate-300 hover:border-slate-500'
                  }`}
                  title="Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                {/* Undo */}
                <button
                  type="button"
                  onClick={handleUndoButton}
                  className="p-2 bg-feto-dark hover:bg-feto-card border border-feto-border rounded-xl text-slate-300 hover:text-white transition-all"
                  title="Undo Stroke"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Clear */}
                <button
                  type="button"
                  onClick={handleClearButton}
                  className="p-2 bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 rounded-xl text-red-400 transition-all"
                  title="Clear Canvas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* CHAT & GUESS FEED (1 Column) */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-4 flex flex-col justify-between border border-feto-border h-[480px]">
          <div className="flex items-center justify-between pb-3 border-b border-feto-border mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Guesses & Chat
            </span>
            <span className="text-[10px] text-cyan-400 font-semibold">Auto-checked</span>
          </div>

          {/* Scrollable messages container */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs"
          >
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <span>Start guessing the drawing!</span>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-xl break-words transition-all ${
                    msg.isCorrectGuess
                      ? 'bg-green-950/70 border border-green-500/60 text-green-300 font-bold shadow-neon-green'
                      : msg.isSystem
                      ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-200'
                      : 'bg-feto-dark/60 text-slate-300'
                  }`}
                >
                  {!msg.isSystem && (
                    <span className="font-bold text-slate-400 mr-1">
                      {msg.username}:
                    </span>
                  )}
                  <span>{msg.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Guess Submission Input */}
          <form onSubmit={handleSendChat} className="pt-3 border-t border-feto-border flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                isDrawer
                  ? 'Chat with players...'
                  : hasGuessed
                  ? 'You already guessed!'
                  : 'Type your guess...'
              }
              disabled={isDrawer || hasGuessed}
              className="flex-1 bg-feto-dark border border-feto-border focus:border-cyan-400 rounded-xl px-3 py-2.5 text-white text-xs outline-none"
            />
            <button
              type="submit"
              disabled={isDrawer || hasGuessed || !chatInput.trim()}
              className="btn-neon-cyan px-3.5 py-2.5 rounded-xl text-white font-bold text-xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DRAWER WORD SELECTION MODAL                              */}
      {/* ======================================================== */}
      <AnimatePresence>
        {gameState.phase === 'word_selection' && isDrawer && gameState.wordChoices && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass-panel-neon p-6 md:p-8 rounded-3xl text-center space-y-4 border border-cyan-400"
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-400/60 flex items-center justify-center mx-auto text-cyan-300">
                <Brush className="w-7 h-7" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
                  YOUR TURN TO DRAW!
                </span>
                <h3 className="text-2xl font-black text-white mt-1">Choose a Word</h3>
                <p className="text-xs text-slate-400">
                  Pick one of the 3 words below to draw for everyone:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {gameState.wordChoices.map((w, idx) => (
                  <button
                    key={w}
                    onClick={() => handleSelectWord(w)}
                    className="p-4 bg-feto-card hover:bg-cyan-950/50 border border-feto-border hover:border-cyan-400 rounded-2xl text-white font-black text-lg transition-all text-left flex items-center justify-between group"
                  >
                    <span>{w}</span>
                    <span className="text-xs text-slate-500 group-hover:text-cyan-300 uppercase font-bold">
                      {idx === 0 ? 'Easy' : idx === 1 ? 'Medium' : 'Hard'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* ROUND RESULT REVEAL                                      */}
      {/* ======================================================== */}
      {gameState.phase === 'round_result' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 rounded-3xl border border-cyan-400/40 text-center space-y-2"
        >
          <span className="text-xs uppercase font-bold text-slate-400">Round Over! The Word Was:</span>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
            {gameState.secretWord}
          </div>
          <p className="text-xs text-slate-400">
            {gameState.correctGuessers.length} players guessed correctly!
          </p>
        </motion.div>
      )}
    </div>
  );
};
