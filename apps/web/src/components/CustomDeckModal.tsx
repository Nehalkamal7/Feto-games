'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Save, Layers, CheckCircle, Sparkles } from 'lucide-react';
import { GameMode } from '@feto-games/shared-types';
import { sound } from '@/lib/sound';
import { BACKEND_URL } from '@/lib/socket';

interface CustomDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode?: GameMode;
  onDeckCreated?: (deckId: string) => void;
}

interface SavedDeck {
  id: string;
  name: string;
  gameMode: string;
  itemCount: number;
  createdAt: string;
}

export function CustomDeckModal({ isOpen, onClose, gameMode, onDeckCreated }: CustomDeckModalProps) {
  const [deckName, setDeckName] = useState('');
  const [targetMode, setTargetMode] = useState<GameMode>(gameMode || 'who_is_imposter');
  const [cards, setCards] = useState<string[]>([
    'Cyberpunk 2077',
    'Virtual Reality Headset',
    'Quantum Computer',
    'Neon Rollerblade',
    'Anti-Gravity Skateboard'
  ]);
  const [newCardInput, setNewCardInput] = useState('');
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSavedDecks();
    }
  }, [isOpen]);

  const fetchSavedDecks = async () => {
    setIsLoadingDecks(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/decks`);
      const data = await res.json();
      if (data.success) {
        setSavedDecks(data.data);
      }
    } catch {
      // API may be launching
    } finally {
      setIsLoadingDecks(false);
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardInput.trim()) return;
    sound.playClick();
    setCards([...cards, newCardInput.trim()]);
    setNewCardInput('');
  };

  const handleRemoveCard = (index: number) => {
    sound.playClick();
    setCards(cards.filter((_, idx) => idx !== index));
  };

  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      setErrorMessage('Please provide a name for your custom deck.');
      return;
    }
    if (cards.length < 3) {
      setErrorMessage('Please add at least 3 cards or prompts to your deck.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const res = await fetch(`${BACKEND_URL}/api/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deckName.trim(),
          gameMode: targetMode,
          items: cards
        })
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage('Deck saved successfully to PostgreSQL!');
        sound.playReady();
        fetchSavedDecks();
        onDeckCreated?.(data.data.id);
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      } else {
        setErrorMessage(data.error?.message || 'Failed to save deck.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error saving deck.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl glass-panel-neon rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative"
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* TITLE */}
          <div className="flex items-center gap-2 mb-6 text-feto-magenta text-xs font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Custom Game Deck Creator</span>
          </div>

          <h2 className="text-2xl font-black text-white mb-2">Build Your Custom Deck</h2>
          <p className="text-xs text-slate-300 mb-6">
            Create custom question packs, secret words, or crazy dares tailored for your group of 15 friends.
          </p>

          {statusMessage && (
            <div className="mb-4 p-3 bg-green-950/80 border border-green-500/40 rounded-xl text-green-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-300 text-xs">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Deck Name
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="e.g., College Friends Inside Jokes, Tech Trivia"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-feto-magenta focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Target Game Mode
              </label>
              <select
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value as GameMode)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-feto-magenta focus:outline-none"
              >
                <option value="who_is_imposter">Who Is The Imposter? (Secret Words)</option>
                <option value="draw_and_guess">Draw & Guess (Drawing Prompts)</option>
                <option value="quiz_battle">Quiz Battle (Trivia Prompts)</option>
                <option value="word_battle">Word Battle (Word Categories)</option>
                <option value="truth_or_dare">Truth or Dare (Custom Dares & Truths)</option>
                <option value="never_have_i_ever">Never Have I Ever (Confession Prompts)</option>
              </select>
            </div>

            {/* ADD CARD INPUT */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Add Items / Prompts ({cards.length} cards)
              </label>
              <form onSubmit={handleAddCard} className="flex gap-2">
                <input
                  type="text"
                  value={newCardInput}
                  onChange={(e) => setNewCardInput(e.target.value)}
                  placeholder="Type a word, question, or prompt and hit Add..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-feto-magenta focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-feto-magenta hover:brightness-110 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition-all shadow-neon-magenta"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* LIST OF CARDS */}
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 glass-panel rounded-2xl p-2">
              {cards.map((card, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-800/40 rounded-lg">
                  <span className="text-xs text-white font-medium truncate flex-1 mr-2">{card}</span>
                  <button
                    onClick={() => handleRemoveCard(idx)}
                    className="text-slate-500 hover:text-red-400 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button
            onClick={handleSaveDeck}
            disabled={isSaving}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-feto-magenta to-cyan-400 hover:brightness-110 text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-magenta transition-all disabled:opacity-50 mb-6"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Deck to Cloud...' : 'Save Deck to PostgreSQL'}</span>
          </button>

          {/* SAVED DECKS ACCORDION */}
          {savedDecks.length > 0 && (
            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Existing Community Decks ({savedDecks.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedDecks.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="font-bold text-white truncate">{d.name}</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between mt-1">
                      <span className="capitalize">{d.gameMode.replace(/_/g, ' ')}</span>
                      <span>{d.itemCount} items</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
