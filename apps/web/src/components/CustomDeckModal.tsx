'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Save, Layers, CheckCircle, Sparkles } from 'lucide-react';
import { GameMode } from '@feto-games/shared-types';
import { sound } from '@/lib/sound';
import { BACKEND_URL } from '@/lib/socket';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [deckName, setDeckName] = useState('');
  const [targetMode, setTargetMode] = useState<GameMode>(gameMode || 'who_is_imposter');
  const [cards, setCards] = useState<string[]>(() =>
    isAr
      ? ['كشري التحرير', 'برج القاهرة', 'سوبر جيت', 'فانوس رمضان', 'عربية فول']
      : ['Cyberpunk 2077', 'Virtual Reality Headset', 'Quantum Computer', 'Neon Rollerblade', 'Anti-Gravity Skateboard']
  );
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
      setErrorMessage(
        isAr ? 'يرجى إدخال اسم لحزمة البطاقات المخصصة.' : 'Please provide a name for your custom deck.'
      );
      return;
    }
    if (cards.length < 3) {
      setErrorMessage(
        isAr
          ? 'يرجى إضافة ٣ بطاقات أو أسئلة على الأقل إلى الحزمة.'
          : 'Please add at least 3 cards or prompts to your deck.'
      );
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
        setStatusMessage(
          isAr ? 'تم حفظ الحزمة بنجاح في السحابة!' : 'Deck saved successfully to cloud!'
        );
        sound.playReady();
        fetchSavedDecks();
        onDeckCreated?.(data.data.id);
        setTimeout(() => {
          setStatusMessage(null);
        }, 3000);
      } else {
        setErrorMessage(data.error?.message || (isAr ? 'فشل حفظ الحزمة.' : 'Failed to save deck.'));
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isAr ? 'خطأ في الاتصال أثناء حفظ الحزمة.' : 'Network error saving deck.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010101]/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-[#FFFFFF] rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative border-3 border-[#010101] shadow-[8px_8px_0px_#010101] text-[#010101]"
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 rtl:right-auto rtl:left-5 w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center shrink-0 rounded-xl text-[#010101] bg-[#FFFFFF] hover:bg-[#FD3F01] hover:text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101] transition-all font-black"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5 shrink-0" strokeWidth={2.5} />
          </button>

          {/* TITLE */}
          <div className="flex items-center gap-2 mb-4 text-[#0B89FD] text-xs font-black uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#0B89FD]" />
            <span>{isAr ? 'منشئ حزم البطاقات المخصصة' : 'Custom Game Deck Creator'}</span>
          </div>

          <h2 className="text-2xl font-black text-[#010101] mb-2">
            {isAr ? 'أنشئ حزمتك المخصصة' : 'Build Your Custom Deck'}
          </h2>
          <p className="text-xs text-[#010101]/70 mb-6 font-medium">
            {isAr
              ? 'اصنع حزم أسئلة مخصصة، كلمات سرية، أو تحديات تناسب شلتك وأصحابك حتى ١٥ لاعباً.'
              : 'Create custom question packs, secret words, or crazy dares tailored for your group of 15 friends.'}
          </p>

          {statusMessage && (
            <div className="mb-4 p-3 bg-[#0B89FD]/10 border-2 border-[#0B89FD] rounded-xl text-[#0B89FD] text-xs flex items-center gap-2 font-black">
              <CheckCircle className="w-4 h-4 text-[#0B89FD]" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-[#FD3F01]/10 border-2 border-[#FD3F01] rounded-xl text-[#FD3F01] text-xs font-black">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-black uppercase text-[#010101] mb-1.5">
                {isAr ? 'اسم الحزمة' : 'Deck Name'}
              </label>
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder={isAr ? 'مثال: إيفيهات الصحاب، أسئلة الشلة، فضايح الجامعة' : 'e.g., College Friends Inside Jokes, Tech Trivia'}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] text-[#010101] font-bold text-sm focus:border-[#0B89FD] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-[#010101] mb-1.5">
                {isAr ? 'نوع اللعبة المستهدفة' : 'Target Game Mode'}
              </label>
              <select
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value as GameMode)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] text-[#010101] font-bold text-sm focus:border-[#0B89FD] focus:outline-none"
              >
                <option value="who_is_imposter">
                  {isAr ? 'مين الجاسوس؟ (كلمات سرية)' : 'Who Is The Imposter? (Secret Words)'}
                </option>
                <option value="draw_and_guess">
                  {isAr ? 'ارسم وخمن (كلمات للرسم)' : 'Draw & Guess (Drawing Prompts)'}
                </option>
                <option value="quiz_battle">
                  {isAr ? 'معركة الأسئلة (أسئلة عامة)' : 'Quiz Battle (Trivia Prompts)'}
                </option>
                <option value="word_battle">
                  {isAr ? 'معركة الكلمات (فئات الكلمات)' : 'Word Battle (Word Categories)'}
                </option>
                <option value="truth_or_dare">
                  {isAr ? 'صراحة أم جرأة (تحديات وصراحة مخصصة)' : 'Truth or Dare (Custom Dares & Truths)'}
                </option>
                <option value="never_have_i_ever">
                  {isAr ? 'عمرك عملتها؟ (اعترافات)' : 'Never Have I Ever (Confession Prompts)'}
                </option>
              </select>
            </div>

            {/* ADD CARD INPUT */}
            <div>
              <label className="block text-xs font-black uppercase text-[#010101] mb-1.5">
                {isAr ? `إضافة عناصر / أسئلة (${cards.length} بطاقة)` : `Add Items / Prompts (${cards.length} cards)`}
              </label>
              <form onSubmit={handleAddCard} className="flex gap-2">
                <input
                  type="text"
                  value={newCardInput}
                  onChange={(e) => setNewCardInput(e.target.value)}
                  placeholder={isAr ? 'اكتب كلمة أو سؤالاً أو تحدياً واضغط إضافة...' : 'Type a word, question, or prompt and hit Add...'}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] text-[#010101] font-bold text-sm focus:border-[#0B89FD] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#FEC90E] hover:bg-[#fed338] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-[#010101] font-black text-xs uppercase flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'إضافة' : 'Add'}</span>
                </button>
              </form>
            </div>

            {/* LIST OF CARDS */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[#F8F8F8] border-2 border-[#010101] rounded-2xl p-2.5">
              {cards.map((card, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-[#FFFFFF] border border-[#010101] rounded-xl shadow-[1px_1px_0px_#010101]">
                  <span className="text-xs text-[#010101] font-bold truncate flex-1 mr-2 rtl:mr-0 rtl:ml-2">{card}</span>
                  <button
                    onClick={() => handleRemoveCard(idx)}
                    className="text-[#010101]/60 hover:text-[#FD3F01] p-1 font-black"
                    title={isAr ? 'حذف العنصر' : 'Remove item'}
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
            className="w-full py-3.5 rounded-2xl bg-[#0B89FD] hover:bg-[#0977db] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all disabled:opacity-50 mb-6"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? (isAr ? 'جاري الحفظ في السحابة...' : 'Saving Deck to Cloud...')
                : (isAr ? 'حفظ الحزمة في فيتو' : 'Save Deck to Cloud')}
            </span>
          </button>

          {/* SAVED DECKS ACCORDION */}
          {savedDecks.length > 0 && (
            <div className="border-t-2 border-[#010101]/10 pt-4">
              <h3 className="text-xs font-black uppercase text-[#010101] mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#FEC90E]" />
                <span>
                  {isAr
                    ? `حزم المجتمع المتوفرة (${savedDecks.length})`
                    : `Existing Community Decks (${savedDecks.length})`}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedDecks.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-xs">
                    <div className="font-black text-[#010101] truncate">{d.name}</div>
                    <div className="text-[10px] text-[#010101]/70 flex items-center justify-between mt-1 font-bold">
                      <span className="capitalize">{d.gameMode.replace(/_/g, ' ')}</span>
                      <span>{d.itemCount} {isAr ? 'عنصر' : 'items'}</span>
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
