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
import { GameIcon } from '../GameIcon';
import {
  Eraser,
  RotateCcw,
  Trash2,
  Send,
  CheckCircle2,
  Palette
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { getSocket } from '@/lib/socket';
import { useVisualViewport } from '@/hooks/useVisualViewport';

interface DrawAndGuessGameViewProps {
  gameState: DrawAndGuessPublicState;
  currentPlayer: PlayerSummary;
  players: PlayerSummary[];
  roomCode: string;
}

const PALETTE_COLORS = [
  '#111827', // Black / Charcoal
  '#2563EB', // Electric Blue
  '#EF4444', // Red
  '#10B981', // Emerald Green
  '#F59E0B', // Amber Gold
  '#8B5CF6'  // Royal Purple
];

const BRUSH_SIZES = [3, 8, 16, 24];

export const DrawAndGuessGameView: React.FC<DrawAndGuessGameViewProps> = ({
  gameState,
  currentPlayer,
  players,
  roomCode: _roomCode
}) => {
  const socket = getSocket();
  const { isKeyboardOpen, scaleFactor } = useVisualViewport();

  // Canvas Refs & State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const prevPosRef = useRef<{ x: number; y: number } | null>(null);

  // Sync ref with current drawer status and phase for native touch listeners
  const isDrawer = gameState.currentDrawerId === currentPlayer.id;
  const isDrawerRef = useRef(isDrawer);
  isDrawerRef.current = isDrawer;

  const phaseRef = useRef(gameState.phase);
  phaseRef.current = gameState.phase;

  // Tool state (for drawer)
  const [selectedColor, setSelectedColor] = useState('#111827');
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);

  // Tool refs for native touch events
  const selectedColorRef = useRef(selectedColor);
  selectedColorRef.current = selectedColor;
  const brushSizeRef = useRef(brushSize);
  brushSizeRef.current = brushSize;
  const isEraserRef = useRef(isEraser);
  isEraserRef.current = isEraser;

  // Chat / Guess input state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const hasGuessed = gameState.correctGuessers.includes(currentPlayer.id);

  // Clear canvas helper (Pure White background)
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Draw stroke helper
  const drawStrokeOnCanvas = useCallback((stroke: DrawStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = stroke.isEraser ? '#FFFFFF' : stroke.color;
    ctx.lineWidth = stroke.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(stroke.prevX * canvas.width, stroke.prevY * canvas.height);
    ctx.lineTo(stroke.currX * canvas.width, stroke.currY * canvas.height);
    ctx.stroke();
  }, []);

  // Native coordinate calculator
  const getCoordsFromPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    };
  };

  // Emit stroke to server & render locally
  const emitStroke = useCallback(
    (prev: { x: number; y: number }, curr: { x: number; y: number }) => {
      const stroke: DrawStroke = {
        prevX: prev.x,
        prevY: prev.y,
        currX: curr.x,
        currY: curr.y,
        color: isEraserRef.current ? '#FFFFFF' : selectedColorRef.current,
        brushSize: brushSizeRef.current,
        isEraser: isEraserRef.current
      };

      drawStrokeOnCanvas(stroke);
      socket.emit('draw:stroke', stroke);
    },
    [drawStrokeOnCanvas, socket]
  );

  // Pointer events (Mouse / Desktop)
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer || gameState.phase !== 'drawing') return;
    isDrawingRef.current = true;
    const coords = getCoordsFromPoint(e.clientX, e.clientY);
    prevPosRef.current = coords;
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawingRef.current || !prevPosRef.current || gameState.phase !== 'drawing') {
      return;
    }
    const currCoords = getCoordsFromPoint(e.clientX, e.clientY);
    if (!currCoords) return;

    emitStroke(prevPosRef.current, currCoords);
    prevPosRef.current = currCoords;
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    prevPosRef.current = null;
  };

  // Set up native non-passive touch events to prevent screen scroll while drawing on mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;
    clearCanvas();

    const onTouchStart = (e: TouchEvent) => {
      if (!isDrawerRef.current || phaseRef.current !== 'drawing') return;
      if (e.cancelable) e.preventDefault();
      if (e.touches.length === 0) return;

      const coords = getCoordsFromPoint(e.touches[0].clientX, e.touches[0].clientY);
      if (!coords) return;

      isDrawingRef.current = true;
      prevPosRef.current = coords;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDrawerRef.current || !isDrawingRef.current || !prevPosRef.current || phaseRef.current !== 'drawing') {
        return;
      }
      if (e.cancelable) e.preventDefault();
      if (e.touches.length === 0) return;

      const currCoords = getCoordsFromPoint(e.touches[0].clientX, e.touches[0].clientY);
      if (!currCoords) return;

      emitStroke(prevPosRef.current, currCoords);
      prevPosRef.current = currCoords;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isDrawerRef.current && phaseRef.current === 'drawing' && e.cancelable) {
        e.preventDefault();
      }
      isDrawingRef.current = false;
      prevPosRef.current = null;
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

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
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);

      socket.off('draw:stroke', handleIncomingStroke);
      socket.off('draw:clear', handleIncomingClear);
      socket.off('chat:message', handleIncomingChat);
    };
  }, [clearCanvas, drawStrokeOnCanvas, emitStroke, socket]);

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
    <div
      className="w-full max-w-md mx-auto space-y-3 sm:space-y-4 px-2 sm:px-4 overflow-x-hidden transition-transform duration-200 text-gray-900"
      style={
        isKeyboardOpen
          ? {
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'top center'
            }
          : undefined
      }
    >
      {/* 1. HEADER: WORD MASK / SECRET WORD */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <NeonAvatarDisplay avatarId={gameState.currentDrawerAvatar} size="sm" showGlow={false} />
          <div>
            <div className="text-xs uppercase text-gray-500 font-semibold">
              {isDrawer ? 'You Are Drawing!' : `${gameState.currentDrawerUsername} is Drawing`}
            </div>
            <div className="text-xs text-blue-600 font-medium">
              Category: {gameState.category || 'General'}
            </div>
          </div>
        </div>

        {/* Secret Word Display */}
        <div className="text-center">
          {isDrawer || hasGuessed || gameState.phase === 'round_result' ? (
            <div>
              <span className="text-[11px] uppercase text-gray-500 font-semibold block">
                {isDrawer ? 'Your Secret Word' : 'Secret Word'}
              </span>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 tracking-wide">
                {gameState.secretWord || '???'}
              </div>
            </div>
          ) : (
            <div>
              <span className="text-[11px] uppercase text-gray-500 font-semibold block">
                Secret Word ({gameState.wordLength} Letters)
              </span>
              <div className="text-xl sm:text-2xl font-bold text-gray-800 tracking-[0.25em]">
                {gameState.wordMask || '_ _ _'}
              </div>
            </div>
          )}
        </div>

        {/* Round Solved Badge */}
        <div className="flex items-center gap-2">
          {hasGuessed && (
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Guessed!</span>
            </span>
          )}
          <div className="px-2.5 py-1 bg-gray-50 rounded-xl border border-gray-200 text-xs font-medium text-gray-700">
            {gameState.correctGuessers.length} / {Math.max(1, players.length - 1)} Solved
          </div>
        </div>
      </div>

      {/* 2. MAIN PLAY AREA: CANVAS & LIVE CHAT FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* CANVAS CONTAINER */}
        <div className="lg:col-span-8 flex flex-col space-y-2 sm:space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm aspect-[4/3] touch-none">
            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              className={`w-full h-full block touch-none ${
                isDrawer ? 'cursor-crosshair' : 'cursor-default'
              }`}
              style={{ touchAction: 'none' }}
            />

            {/* Non-drawer Spectating Tag */}
            {!isDrawer && (
              <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full text-xs text-gray-700 font-medium shadow-xs pointer-events-none">
                Watching Live
              </div>
            )}
          </div>

          {/* DRAWER CONTROLS TOOLBAR (Drawer Only) */}
          {isDrawer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 border border-gray-200 shadow-sm"
            >
              {/* 6 Curated Colors */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Palette className="w-4 h-4 text-gray-500 mr-1 hidden sm:inline shrink-0" />
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
                    aria-label={`Color ${c}`}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border transition-all shrink-0 ${
                      selectedColor === c && !isEraser
                        ? 'scale-110 border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                        : 'border-gray-300 hover:scale-105'
                    }`}
                  />
                ))}
              </div>

              {/* Brush Sizes & Eraser / Clear */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {/* Brush size buttons */}
                <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200">
                  {BRUSH_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setBrushSize(size);
                        setIsEraser(false);
                      }}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                        brushSize === size && !isEraser
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-gray-700 hover:bg-white'
                      }`}
                      aria-label={`Brush size ${size}`}
                    >
                      <div
                        className="rounded-full bg-current"
                        style={{ width: `${Math.min(16, size)}px`, height: `${Math.min(16, size)}px` }}
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
                  className={`w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center shrink-0 rounded-xl border transition-all ${
                    isEraser
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  title="Eraser"
                  aria-label="Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>

                {/* Undo */}
                <button
                  type="button"
                  onClick={handleUndoButton}
                  className="w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center shrink-0 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all shadow-xs"
                  title="Undo Stroke"
                  aria-label="Undo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Clear */}
                <button
                  type="button"
                  onClick={handleClearButton}
                  className="w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center shrink-0 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-all shadow-xs"
                  title="Clear Canvas"
                  aria-label="Clear Canvas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* CHAT & GUESS FEED */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between border border-gray-200 shadow-sm h-[320px] sm:h-[400px] lg:h-[450px]">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              Live Guesses
            </span>
            <span className="text-xs text-blue-600 font-semibold">Auto-checked</span>
          </div>

          {/* Scrollable messages container */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs"
          >
            {chatMessages.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <span>Start guessing the drawing!</span>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-xl break-words transition-all ${
                    msg.isCorrectGuess
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold'
                      : msg.isSystem
                      ? 'bg-blue-50 text-blue-800'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  {!msg.isSystem && (
                    <span className="font-semibold text-gray-800 mr-1">
                      {msg.username}:
                    </span>
                  )}
                  <span>{msg.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Guess Submission Input */}
          <form onSubmit={handleSendChat} className="pt-2.5 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                isDrawer
                  ? 'Chat with players...'
                  : hasGuessed
                  ? 'You already guessed correctly!'
                  : 'Type your guess...'
              }
              disabled={isDrawer || hasGuessed}
              className="flex-1 h-11 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 text-gray-900 text-xs sm:text-sm outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isDrawer || hasGuessed || !chatInput.trim()}
              className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center transition-colors disabled:opacity-50"
              aria-label="Send guess"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. DRAWER WORD SELECTION MODAL */}
      <AnimatePresence>
        {gameState.phase === 'word_selection' && isDrawer && gameState.wordChoices && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm safe-top safe-bottom">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white border border-gray-200 shadow-xl p-6 rounded-2xl text-center space-y-4 text-gray-900"
            >
              <div className="flex items-center justify-center mx-auto">
                <GameIcon gameMode="draw_and_guess" size="lg" showContainer />
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Your Turn to Draw
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5">Choose a Word</h3>
                <p className="text-xs text-gray-500">
                  Pick one of the 3 words below to draw for the room:
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 pt-2">
                {gameState.wordChoices.map((w, idx) => (
                  <button
                    key={w}
                    onClick={() => handleSelectWord(w)}
                    className="h-12 px-4 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border border-gray-200 rounded-xl text-gray-900 font-semibold text-base transition-all flex items-center justify-between group shadow-xs"
                  >
                    <span>{w}</span>
                    <span className="text-xs text-gray-500 group-hover:text-blue-600 font-medium uppercase">
                      {idx === 0 ? 'Easy' : idx === 1 ? 'Medium' : 'Hard'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. ROUND RESULT REVEAL */}
      {gameState.phase === 'round_result' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm text-center space-y-2"
        >
          <span className="text-xs uppercase font-semibold text-gray-500">Round Over! The Word Was:</span>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {gameState.secretWord}
          </div>
          <p className="text-xs text-gray-500">
            {gameState.correctGuessers.length} players guessed correctly!
          </p>
        </motion.div>
      )}
    </div>
  );
};
