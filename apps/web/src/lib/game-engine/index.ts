import {
  ClueSubmission,
  GameMode,
  ImposterPublicState,
  DrawAndGuessPublicState,
  QuizPublicState,
  WordBattlePublicState,
  TruthOrDarePublicState,
  NeverHaveIEverPublicState,
  MostLikelyToPublicState,
  SipOrSpillPublicState,
  SillyRoulettePublicState,
  HotPotatoPublicState,
  PartyAward,
  PlayerScoreUpdate,
  RoomState,
  CustomCardItem
} from '@feto-games/shared-types';

import imposterWords from './data/imposterWords.json';
import drawWords from './data/drawWords.json';
import quizQuestions from './data/quizQuestions.json';
import wordBattleCategories from './data/wordBattleCategories.json';
import truthOrDarePrompts from './data/truthOrDarePrompts.json';
import neverHaveIEverStatements from './data/neverHaveIEverStatements.json';
import mostLikelyToPrompts from './data/mostLikelyToPrompts.json';
import sipOrSpillPrompts from './data/sipOrSpillPrompts.json';
import sillyRouletteChallenges from './data/sillyRouletteChallenges.json';
import hotPotatoCategories from './data/hotPotatoCategories.json';

export interface GameEngineResult {
  updatedRoom: RoomState;
  publicState: any;
  privateRoles?: Record<string, any>;
  broadcastEvent?: { name: string; data: any };
  error?: string;
}

// ========================================================
// 1. GAME INITIALIZATION DISPATCHER
// ========================================================

export function initGameSession(room: RoomState): GameEngineResult {
  const activePlayers = Object.values(room.players).filter((p) => p.connectionStatus === 'connected');
  if (activePlayers.length < 2) {
    return { updatedRoom: room, publicState: null, error: 'At least 2 players are required to start.' };
  }

  const mode = room.config.gameMode;
  room.status = 'in_game';
  if (!room.currentRound) room.currentRound = 1;
  if (!room.sipsCount) room.sipsCount = {};

  switch (mode) {
    case 'who_is_imposter':
      return initImposterGame(room, activePlayers);
    case 'draw_and_guess':
      return initDrawAndGuessGame(room, activePlayers);
    case 'quiz_battle':
      return initQuizBattleGame(room, activePlayers);
    case 'word_battle':
      return initWordBattleGame(room, activePlayers);
    case 'truth_or_dare':
      return initTruthOrDareGame(room, activePlayers);
    case 'never_have_i_ever':
      return initNeverHaveIEverGame(room, activePlayers);
    case 'most_likely_to':
      return initMostLikelyToGame(room, activePlayers);
    case 'sip_or_spill':
      return initSipOrSpillGame(room, activePlayers);
    case 'silly_roulette':
      return initSillyRouletteGame(room, activePlayers);
    case 'hot_potato':
      return initHotPotatoGame(room, activePlayers);
    default:
      return initQuizBattleGame(room, activePlayers);
  }
}

// --- 1. Who Is The Imposter ---
function initImposterGame(room: RoomState, players: any[]): GameEngineResult {
  const wordItem = imposterWords[Math.floor(Math.random() * imposterWords.length)] || {
    category: 'Objects',
    word: 'Smartphone'
  };
  const category = wordItem.category;
  const secretWord = wordItem.word;

  const imposterCount = players.length >= 12 ? 3 : players.length >= 7 ? 2 : 1;
  const shuffled = [...players].sort(() => 0.5 - Math.random());
  const imposterIds = new Set(shuffled.slice(0, imposterCount).map((p) => p.id));
  const turnOrder = [...players].sort(() => 0.5 - Math.random()).map((p) => p.id);
  const phaseEndsAt = Date.now() + 35000;

  const privateRoles: Record<string, any> = {};
  for (const player of players) {
    const isImp = imposterIds.has(player.id);
    privateRoles[player.id] = {
      playerId: player.id,
      roleTitle: isImp ? 'IMPOSTER' : 'CIVILIAN',
      roleDescription: isImp
        ? 'Blend in with civilians, listen to clues, and do not get voted out!'
        : 'Give subtle clues about the secret word without making it obvious.',
      isImposter: isImp,
      secretWord: isImp ? undefined : secretWord,
      team: isImp ? 'imposters' : 'civilians'
    };
  }

  room.gameData = {
    category,
    secretWord,
    imposterIds: Array.from(imposterIds),
    turnOrder,
    currentTurnIndex: 0,
    clues: {},
    votes: {},
    voteTallies: {},
    caughtImposterIds: [],
    suddenDeathActive: false,
    phase: 'clue_giving',
    phaseEndsAt
  };

  const publicState: ImposterPublicState = {
    phase: 'clue_giving',
    round: room.currentRound,
    totalRounds: room.config.totalRounds,
    category,
    currentTurnPlayerId: turnOrder[0],
    currentTurnUsername: room.players[turnOrder[0]]?.username,
    turnOrder,
    clues: {},
    votes: {},
    voteTallies: {},
    caughtImposterIds: [],
    suddenDeathActive: false,
    phaseEndsAt
  };

  return { updatedRoom: room, publicState, privateRoles };
}

// --- 2. Draw & Guess ---
function initDrawAndGuessGame(room: RoomState, players: any[]): GameEngineResult {
  const drawer = players[Math.floor(Math.random() * players.length)];
  const wordItem = drawWords[Math.floor(Math.random() * drawWords.length)] || {
    category: 'Objects',
    word: 'Castle',
    difficulty: 'easy'
  };

  const secretWord = wordItem.word;
  const duration = room.config.roundDurationSeconds || 45;
  const phaseEndsAt = Date.now() + duration * 1000;

  const privateRoles: Record<string, any> = {
    [drawer.id]: {
      playerId: drawer.id,
      roleTitle: 'DRAWER',
      roleDescription: 'Draw the secret word on the canvas! Do not write letters or numbers.',
      secretWord,
      isDrawer: true
    }
  };

  room.gameData = {
    drawerId: drawer.id,
    secretWord,
    category: wordItem.category,
    correctGuessers: [],
    phase: 'drawing',
    phaseEndsAt
  };

  const publicState: DrawAndGuessPublicState = {
    phase: 'drawing',
    currentDrawerId: drawer.id,
    currentDrawerUsername: drawer.username,
    currentDrawerAvatar: drawer.avatar,
    wordLength: secretWord.length,
    wordMask: secretWord.replace(/[a-zA-Z]/g, '_ '),
    category: wordItem.category,
    correctGuessers: [],
    phaseEndsAt
  };

  return { updatedRoom: room, publicState, privateRoles };
}

// --- 3. Quiz Battle ---
function initQuizBattleGame(room: RoomState, players: any[]): GameEngineResult {
  const totalQuestions = room.config.totalRounds || 5;
  const shuffledQuestions = [...quizQuestions].sort(() => 0.5 - Math.random()).slice(0, totalQuestions);
  const currentQ = shuffledQuestions[0] || {
    id: 'q1',
    question: 'What is the speed of light in vacuum?',
    category: 'Science',
    difficulty: 'medium',
    options: ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '50,000 km/s'],
    correctIndex: 0
  };

  const duration = room.config.roundDurationSeconds || 20;
  const phaseEndsAt = Date.now() + duration * 1000;

  room.gameData = {
    questions: shuffledQuestions,
    questionIndex: 0,
    currentQuestion: currentQ,
    answers: {},
    answeredPlayerIds: [],
    phase: 'question',
    phaseEndsAt
  };

  const publicState: QuizPublicState = {
    phase: 'question',
    questionNumber: 1,
    totalQuestions,
    currentQuestion: {
      id: currentQ.id,
      question: currentQ.question,
      category: currentQ.category,
      difficulty: currentQ.difficulty as any,
      options: currentQ.options as [string, string, string, string],
      phaseEndsAt,
      durationSeconds: duration
    },
    answeredPlayerIds: [],
    totalActivePlayers: players.length
  };

  return { updatedRoom: room, publicState };
}

// --- 4. Word Battle ---
function initWordBattleGame(room: RoomState, players: any[]): GameEngineResult {
  const catItem = wordBattleCategories[Math.floor(Math.random() * wordBattleCategories.length)] || {
    category: 'Animals',
    validWords: ['tiger', 'turtle', 'toucan', 'tarantula']
  };

  const letters = 'ABCDEFGHIJKLMNOPRSTW'.split('');
  const startingLetter = letters[Math.floor(Math.random() * letters.length)];
  const duration = 25;
  const phaseEndsAt = Date.now() + duration * 1000;

  room.gameData = {
    category: catItem.category,
    startingLetter,
    validWords: catItem.validWords || [],
    claimedWords: [],
    submissions: [],
    playerWordCounts: {},
    phase: 'word_racing',
    phaseEndsAt
  };

  const scores: Record<string, number> = {};
  for (const p of players) scores[p.id] = p.score || 0;

  const publicState: WordBattlePublicState = {
    phase: 'word_racing',
    round: room.currentRound,
    totalRounds: room.config.totalRounds,
    category: catItem.category,
    startingLetter,
    claimedWords: [],
    recentSubmissions: [],
    scores,
    playerWordCounts: {},
    phaseEndsAt,
    remainingSeconds: duration
  };

  return { updatedRoom: room, publicState };
}

// --- 5. Truth or Dare ---
function initTruthOrDareGame(room: RoomState, players: any[]): GameEngineResult {
  const target = players[Math.floor(Math.random() * players.length)];
  const duration = 6;
  const phaseEndsAt = Date.now() + duration * 1000;

  room.gameData = {
    targetPlayerId: target.id,
    intensity: room.config.vibeMode === 'chaotic' ? 'wild' : 'party',
    chosenType: undefined,
    currentPrompt: undefined,
    votes: {},
    phase: 'roulette',
    phaseEndsAt
  };

  const scores: Record<string, number> = {};
  for (const p of players) scores[p.id] = p.score || 0;

  const publicState: TruthOrDarePublicState = {
    phase: 'roulette',
    round: room.currentRound,
    totalRounds: room.config.totalRounds,
    targetPlayerId: target.id,
    targetUsername: target.username,
    targetAvatar: target.avatar,
    intensity: (room.config.vibeMode === 'chaotic' ? 'wild' : 'party') as any,
    votes: {},
    voteTallies: { completed: 0, refused: 0 },
    scores,
    phaseEndsAt,
    remainingSeconds: duration
  };

  return { updatedRoom: room, publicState };
}

// --- 6. Never Have I Ever ---
function initNeverHaveIEverGame(room: RoomState, players: any[]): GameEngineResult {
  const item = neverHaveIEverStatements[Math.floor(Math.random() * neverHaveIEverStatements.length)] || {
    statement: 'Never have I ever ghosted someone after a first date',
    category: 'Dating & Romance'
  };

  const duration = 20;
  const phaseEndsAt = Date.now() + duration * 1000;

  const innocence: Record<string, number> = room.gameData?.innocencePoints || {};
  for (const p of players) {
    if (innocence[p.id] === undefined) innocence[p.id] = 5;
  }

  room.gameData = {
    statement: item.statement,
    category: item.category,
    roundChoices: {},
    innocencePoints: innocence,
    phase: 'statement',
    phaseEndsAt
  };

  const publicState: NeverHaveIEverPublicState = {
    phase: 'statement',
    round: room.currentRound,
    totalRounds: room.config.totalRounds,
    statement: item.statement,
    category: item.category,
    innocencePoints: innocence,
    roundChoices: {},
    phaseEndsAt,
    remainingSeconds: duration
  };

  return { updatedRoom: room, publicState };
}

// --- 7. Most Likely To... ---
function initMostLikelyToGame(room: RoomState, players: any[]): GameEngineResult {
  // Check custom cards if available
  const customCards = (room.customCards || []).filter((c) => c.type === 'most_likely_to');
  let chosenItem: any;
  if (customCards.length > 0 && Math.random() < 0.4) {
    const card = customCards[Math.floor(Math.random() * customCards.length)];
    chosenItem = {
      id: card.id,
      prompt: card.prompt,
      category: 'Community Custom Deck',
      penaltyDare: 'Take 2 sips and strike a glorious winner pose! 🥤'
    };
  } else {
    chosenItem = mostLikelyToPrompts[Math.floor(Math.random() * mostLikelyToPrompts.length)] || {
      id: 'mlt_default',
      category: 'Survival & Chaos',
      prompt: 'Who is most likely to survive a zombie apocalypse entirely on luck?',
      penaltyDare: 'Do your best aggressive zombie impression toward the camera for 10 seconds!'
    };
  }

  const duration = 24;
  const phaseEndsAt = Date.now() + duration * 1000;

  room.gameData = {
    prompt: chosenItem.prompt,
    category: chosenItem.category,
    penaltyDare: chosenItem.penaltyDare,
    votes: {},
    voteTallies: {},
    votedOutPlayerId: null,
    phase: 'voting',
    phaseEndsAt
  };

  const publicState: MostLikelyToPublicState = {
    phase: 'voting',
    round: room.currentRound,
    totalRounds: room.config.totalRounds,
    prompt: chosenItem.prompt,
    category: chosenItem.category,
    penaltyDare: chosenItem.penaltyDare,
    votes: {},
    voteTallies: {},
    phaseEndsAt,
    remainingSeconds: duration
  };

  return { updatedRoom: room, publicState };
}

// --- 8. Sip or Spill ---
function initSipOrSpillGame(room: RoomState, players: any[]): GameEngineResult {
  const target = players[Math.floor(Math.random() * players.length)];
  const item = sipOrSpillPrompts[Math.floor(Math.random() * sipOrSpillPrompts.length)] || {
    id: 'sos_default',
    dilemma: 'Confess your most embarrassing crush from your school days OR take 2 sips! 🥤',
    question: 'Who was your most cringe-worthy childhood or teen celebrity crush?',
    spicyLevel: 1
  };

  const duration = 25;
  const phaseEndsAt = Date.now() + duration * 1000;

  room.gameData = {
    targetPlayerId: target.id,
    dilemma: item.dilemma,
    question: item.question,
    spicyLevel: item.spicyLevel,
    chosenAction: null,
    confessionText: null,
    reactions: {},
    phase: 'dilemma',
    phaseEndsAt
  };

  const publicState: SipOrSpillPublicState = {
    phase: 'dilemma',
    round: room.currentRound,
    totalRounds: room.config.totalRounds,
    targetPlayerId: target.id,
    targetUsername: target.username,
    targetAvatar: target.avatar,
    dilemma: item.dilemma,
    question: item.question,
    spicyLevel: item.spicyLevel,
    reactions: {},
    phaseEndsAt,
    remainingSeconds: duration
  };

  return { updatedRoom: room, publicState };
}

// --- 9. Silly Roulette (Spin the Chaos) ---
function initSillyRouletteGame(room: RoomState, players: any[]): GameEngineResult {
  const target = players[Math.floor(Math.random() * players.length)];
  const challenge = sillyRouletteChallenges[Math.floor(Math.random() * sillyRouletteChallenges.length)] || {
    id: 'src_default',
    title: 'Nature Documentary Host',
    challenge: 'Narrate everything you and other players do like David Attenborough until the next round begins!',
    category: 'vocal',
    timeSeconds: 30
  };

  // Generate target spin rotation: 5 full spins (1800 deg) + player target slice
  const targetAngle = 1800 + Math.floor(Math.random() * 360);
  const spinDuration = 5;
  const phaseEndsAt = Date.now() + spinDuration * 1000;

  room.gameData = {
    targetPlayerId: target.id,
    challengeTitle: challenge.title,
    challengeText: challenge.challenge,
    challengeCategory: challenge.category,
    targetAngle,
    isSpinning: true,
    votes: {},
    voteTallies: { nailed_it: 0, shame_penalty: 0 },
    phase: 'spinning',
    phaseEndsAt
  };

  const publicState: SillyRoulettePublicState = {
    phase: 'spinning',
    round: room.currentRound,
    totalRounds: room.config.totalRounds,
    targetPlayerId: target.id,
    targetUsername: target.username,
    targetAvatar: target.avatar,
    challengeTitle: challenge.title,
    challengeText: challenge.challenge,
    challengeCategory: challenge.category,
    targetAngle,
    isSpinning: true,
    votes: {},
    voteTallies: { nailed_it: 0, shame_penalty: 0 },
    phaseEndsAt,
    remainingSeconds: spinDuration
  };

  return { updatedRoom: room, publicState };
}

// --- 10. Hot Potato (Bomb Pass) ---
function initHotPotatoGame(room: RoomState, players: any[]): GameEngineResult {
  const categoryItem = hotPotatoCategories[Math.floor(Math.random() * hotPotatoCategories.length)] || {
    id: 'hp_default',
    category: "Things you find in a messy gamer's bedroom",
    goofyConsequence: 'Recite an apology to your laundry pile with deep sincerity!'
  };

  const initialHolder = players[Math.floor(Math.random() * players.length)];
  const duration = 8; // 8 seconds urgent ticking bomb
  const phaseEndsAt = Date.now() + duration * 1000;

  room.gameData = {
    activeHolderId: initialHolder.id,
    category: categoryItem.category,
    goofyConsequence: categoryItem.goofyConsequence,
    passCount: 0,
    recentWords: [],
    bombTimerRemainingMs: duration * 1000,
    explodedPlayerId: null,
    phase: 'bomb_ticking',
    phaseEndsAt
  };

  const publicState: HotPotatoPublicState = {
    phase: 'bomb_ticking',
    round: room.currentRound,
    totalRounds: room.config.totalRounds,
    activeHolderId: initialHolder.id,
    activeHolderUsername: initialHolder.username,
    activeHolderAvatar: initialHolder.avatar,
    category: categoryItem.category,
    goofyConsequence: categoryItem.goofyConsequence,
    passCount: 0,
    recentWords: [],
    bombTimerRemainingMs: duration * 1000,
    phaseEndsAt,
    remainingSeconds: duration
  };

  return { updatedRoom: room, publicState };
}

// ========================================================
// 2. SERVER-AUTHORITATIVE ACTION DISPATCHER
// ========================================================

export function handleGameAction(
  room: RoomState,
  playerId: string,
  actionType: string,
  payload: any
): GameEngineResult {
  const player = room.players[playerId];
  if (!player && actionType !== 'DISCONNECT' && actionType !== 'RESOLVE_PHASE') {
    return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Player not in room.' };
  }

  const mode = room.config.gameMode;
  const g = room.gameData || {};
  if (!room.sipsCount) room.sipsCount = {};

  switch (actionType) {
    // --- UNIVERSAL PARTY ACTIONS ---
    case 'TAKE_SIP': {
      const sips = (payload?.amount as number) || 1;
      room.sipsCount[playerId] = (room.sipsCount[playerId] || 0) + sips;
      return {
        updatedRoom: room,
        publicState: getPublicGameState(room),
        broadcastEvent: {
          name: 'sip:taken',
          data: {
            playerId,
            username: player?.username || 'Player',
            amount: sips,
            totalSips: room.sipsCount[playerId]
          }
        }
      };
    }

    case 'SUBMIT_CUSTOM_CARD': {
      const promptText = (payload?.prompt || '').trim().slice(0, 160);
      const cardType = payload?.type || 'general';
      if (!promptText) return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Card prompt cannot be empty.' };

      if (!room.customCards) room.customCards = [];
      const newCard: CustomCardItem = {
        id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: cardType,
        prompt: promptText,
        authorUsername: player?.username || 'Anonymous',
        submittedAt: Date.now()
      };
      room.customCards.push(newCard);

      return {
        updatedRoom: room,
        publicState: getPublicGameState(room),
        broadcastEvent: {
          name: 'custom_card:added',
          data: {
            card: newCard,
            totalCustomCards: room.customCards.length
          }
        }
      };
    }

    // --- UNIVERSAL CHAOS & DRAWING ACTIONS ---
    case 'SAVE_DRAWING_SNAPSHOT': {
      if (!g.drawingSnapshots) g.drawingSnapshots = [];
      const snap = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        drawerId: payload?.drawerId || playerId,
        drawerUsername: payload?.drawerUsername || player?.username || 'Artist',
        drawerAvatar: payload?.drawerAvatar || player?.avatar || 'cyber_cat',
        word: payload?.word || g.secretWord || 'Masterpiece',
        snapshot: payload?.snapshot || '',
        correctCount: payload?.correctCount ?? 0,
        createdAt: Date.now()
      };
      g.drawingSnapshots.push(snap);
      room.gameData = g;
      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    case 'USE_SABOTAGE_POWERUP': {
      const pType = payload?.type; // 'blindfold' | 'double_trouble' | 'steal_turn'
      const targetId = payload?.targetId;
      if (!pType || !targetId) {
        return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Missing powerup details.' };
      }

      if (!g.usedPowerUps) g.usedPowerUps = {};
      if (g.usedPowerUps[playerId]) {
        return { updatedRoom: room, publicState: getPublicGameState(room), error: 'You have already used your sabotage power-up this match!' };
      }
      g.usedPowerUps[playerId] = pType;

      const targetPlayer = room.players[targetId];

      if (pType === 'double_trouble') {
        if (!g.doubleTroubleTargets) g.doubleTroubleTargets = {};
        g.doubleTroubleTargets[targetId] = true;
      } else if (pType === 'steal_turn') {
        if (room.config.gameMode === 'hot_potato' && targetPlayer) {
          g.activeHolderId = targetId;
        } else if (room.config.gameMode === 'sip_or_spill' && targetPlayer) {
          g.targetPlayerId = targetId;
        }
      }

      room.gameData = g;
      return {
        updatedRoom: room,
        publicState: getPublicGameState(room),
        broadcastEvent: {
          name: 'chaos:sabotage',
          data: {
            attackerId: playerId,
            attackerUsername: player?.username || 'Opponent',
            targetId,
            targetUsername: targetPlayer?.username || 'Opponent',
            type: pType,
            durationMs: pType === 'blindfold' ? 5000 : 0,
            timestamp: Date.now()
          }
        }
      };
    }

    // --- GAME 1: WHO IS THE IMPOSTER ACTIONS ---
    case 'SUBMIT_CLUE': {
      if (mode !== 'who_is_imposter') break;
      const clueText = (payload?.clue || '').trim().slice(0, 45);
      if (!clueText) return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Empty clue.' };

      if (!g.clues) g.clues = {};
      g.clues[playerId] = {
        playerId,
        username: player.username,
        avatar: player.avatar,
        clue: clueText,
        submittedAt: Date.now()
      };

      g.currentTurnIndex = (g.currentTurnIndex || 0) + 1;
      const turnOrder = g.turnOrder || [];

      if (g.currentTurnIndex >= turnOrder.length) {
        g.phase = 'voting';
        g.phaseEndsAt = Date.now() + 30000;
      } else {
        g.phaseEndsAt = Date.now() + 25000;
      }

      room.gameData = g;
      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    case 'SUBMIT_VOTE': {
      if (mode !== 'who_is_imposter') break;
      const targetId = payload?.targetPlayerId;
      if (!targetId || !room.players[targetId]) {
        return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Invalid vote target.' };
      }

      if (!g.votes) g.votes = {};
      g.votes[playerId] = targetId;

      if (!g.voteTallies) g.voteTallies = {};
      g.voteTallies[targetId] = (g.voteTallies[targetId] || 0) + 1;

      const activeCount = Object.values(room.players).filter((p) => p.connectionStatus === 'connected').length;
      if (Object.keys(g.votes).length >= activeCount) {
        resolveImposterVotes(room);
      }

      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    case 'GUESS_WORD': {
      if (mode !== 'who_is_imposter' || !g.suddenDeathActive) break;
      const guess = (payload?.guessedWord || '').toLowerCase().trim();
      const secret = (g.secretWord || '').toLowerCase().trim();
      const isCorrect = guess === secret;

      if (isCorrect) {
        player.score = (player.score || 0) + 150;
      }
      g.suddenDeathActive = false;
      g.phase = 'round_result';
      g.revealedWord = g.secretWord;
      g.impostersWon = isCorrect;

      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    // --- GAME 2: DRAW & GUESS ACTIONS ---
    case 'DRAW_GUESS': {
      if (mode !== 'draw_and_guess' || g.phase !== 'drawing') break;
      if (playerId === g.drawerId) return { updatedRoom: room, publicState: getPublicGameState(room) };

      const guess = (payload?.message || '').toLowerCase().trim();
      const secret = (g.secretWord || '').toLowerCase().trim();
      const isCorrect = guess === secret;

      if (isCorrect && !g.correctGuessers?.includes(playerId)) {
        if (!g.correctGuessers) g.correctGuessers = [];
        g.correctGuessers.push(playerId);

        const remainingTimeSec = Math.max(1, Math.floor(((g.phaseEndsAt || 0) - Date.now()) / 1000));
        const pts = Math.min(300, 100 + remainingTimeSec * 5);
        player.score = (player.score || 0) + pts;

        const drawer = room.players[g.drawerId];
        if (drawer) {
          drawer.score = (drawer.score || 0) + 60;
        }

        const guesserCount = Object.keys(room.players).length - 1;
        if (g.correctGuessers.length >= Math.max(1, guesserCount)) {
          g.phase = 'round_result';
          g.phaseEndsAt = Date.now() + 5000;
        }

        return {
          updatedRoom: room,
          publicState: getPublicGameState(room),
          broadcastEvent: {
            name: 'chat:message',
            data: {
              id: `msg_${Date.now()}`,
              playerId,
              username: player.username,
              text: 'guessed the secret word! 🎉',
              isCorrectGuess: true,
              timestamp: Date.now()
            }
          }
        };
      }

      return {
        updatedRoom: room,
        publicState: getPublicGameState(room),
        broadcastEvent: {
          name: 'chat:message',
          data: {
            id: `msg_${Date.now()}`,
            playerId,
            username: player.username,
            text: payload?.message || '',
            isCorrectGuess: false,
            timestamp: Date.now()
          }
        }
      };
    }

    // --- GAME 3: QUIZ BATTLE ACTIONS ---
    case 'SUBMIT_ANSWER': {
      if (mode !== 'quiz_battle' || g.phase !== 'question') break;
      const optionIndex = payload?.optionIndex;
      if (typeof optionIndex !== 'number') break;

      if (!g.answers) g.answers = {};
      if (g.answers[playerId] !== undefined) break;

      g.answers[playerId] = optionIndex;
      if (!g.answeredPlayerIds) g.answeredPlayerIds = [];
      g.answeredPlayerIds.push(playerId);

      const q = g.currentQuestion;
      if (q && optionIndex === q.correctIndex) {
        const remainingSec = Math.max(1, Math.floor(((g.phaseEndsAt || 0) - Date.now()) / 1000));
        const pts = 100 + remainingSec * 6;
        player.score = (player.score || 0) + pts;
      }

      const activeCount = Object.values(room.players).filter((p) => p.connectionStatus === 'connected').length;
      if (g.answeredPlayerIds.length >= activeCount) {
        g.phase = 'reveal';
        g.phaseEndsAt = Date.now() + 5000;
      }

      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    // --- GAME 4: WORD BATTLE ACTIONS ---
    case 'SUBMIT_WORD': {
      if (mode !== 'word_battle' || g.phase !== 'word_racing') break;
      const word = (payload?.word || '').toLowerCase().trim();
      if (!word) break;

      const starting = (g.startingLetter || '').toLowerCase();
      if (!word.startsWith(starting)) {
        return { updatedRoom: room, publicState: getPublicGameState(room), error: `Word must start with '${starting.toUpperCase()}'.` };
      }

      if (g.claimedWords?.includes(word)) {
        return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Word already claimed!' };
      }

      if (!g.claimedWords) g.claimedWords = [];
      g.claimedWords.push(word);

      const pts = Math.min(250, word.length * 18);
      player.score = (player.score || 0) + pts;

      if (!g.playerWordCounts) g.playerWordCounts = {};
      g.playerWordCounts[playerId] = (g.playerWordCounts[playerId] || 0) + 1;

      if (!g.submissions) g.submissions = [];
      g.submissions.unshift({
        playerId,
        username: player.username,
        avatar: player.avatar,
        word,
        points: pts,
        submittedAt: Date.now()
      });
      if (g.submissions.length > 20) g.submissions.pop();

      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    // --- GAME 5: TRUTH OR DARE ACTIONS ---
    case 'TOD_CHOOSE': {
      if (mode !== 'truth_or_dare') break;
      const choice = payload?.choice === 'dare' ? 'dare' : 'truth';
      g.chosenType = choice;

      const matching = truthOrDarePrompts.filter((p: any) => p.type === choice);
      const chosen = matching[Math.floor(Math.random() * matching.length)] || {
        prompt: choice === 'truth' ? 'What is your biggest fear?' : 'Do 10 jumping jacks!'
      };

      g.currentPrompt = chosen.prompt;
      g.phase = 'performing';
      g.phaseEndsAt = Date.now() + 45000;
      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    case 'TOD_VOTE': {
      if (mode !== 'truth_or_dare') break;
      const vote = payload?.vote === 'completed' ? 'completed' : 'refused';
      if (!g.votes) g.votes = {};
      g.votes[playerId] = vote;

      const activeCount = Object.values(room.players).filter((p) => p.connectionStatus === 'connected').length - 1;
      if (Object.keys(g.votes).length >= Math.max(1, activeCount)) {
        const completedCount = Object.values(g.votes).filter((v) => v === 'completed').length;
        if (completedCount >= Math.ceil(activeCount / 2)) {
          const target = room.players[g.targetPlayerId];
          if (target) target.score = (target.score || 0) + (g.chosenType === 'dare' ? 160 : 110);
        } else {
          // If refused in Sip Edition, add 2 sips
          if (room.config.vibeMode === 'sip_edition' && g.targetPlayerId) {
            room.sipsCount[g.targetPlayerId] = (room.sipsCount[g.targetPlayerId] || 0) + 2;
          }
        }
        g.phase = 'round_results';
        g.phaseEndsAt = Date.now() + 5000;
      }
      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    // --- GAME 6: NEVER HAVE I EVER ACTIONS ---
    case 'NHIE_CHOICE': {
      if (mode !== 'never_have_i_ever') break;
      const choice = payload?.choice === 'have' ? 'have' : 'havenot';
      if (!g.roundChoices) g.roundChoices = {};
      g.roundChoices[playerId] = choice;

      if (choice === 'have') {
        if (!g.innocencePoints) g.innocencePoints = {};
        const currentHearts = g.innocencePoints[playerId] ?? 5;
        g.innocencePoints[playerId] = Math.max(0, currentHearts - 1);

        // Sip Edition penalty!
        if (room.config.vibeMode === 'sip_edition') {
          room.sipsCount[playerId] = (room.sipsCount[playerId] || 0) + 1;
        }
      } else {
        player.score = (player.score || 0) + 50;
      }

      const activeCount = Object.values(room.players).filter((p) => p.connectionStatus === 'connected').length;
      if (Object.keys(g.roundChoices).length >= activeCount) {
        g.phase = 'reveal';
        g.phaseEndsAt = Date.now() + 6000;
      }
      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    // --- GAME 7: MOST LIKELY TO... ACTIONS ---
    case 'MLT_VOTE': {
      if (mode !== 'most_likely_to' || g.phase !== 'voting') break;
      const targetId = payload?.targetPlayerId;
      if (!targetId || !room.players[targetId]) {
        return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Invalid vote target.' };
      }

      if (!g.votes) g.votes = {};
      g.votes[playerId] = targetId;

      if (!g.voteTallies) g.voteTallies = {};
      g.voteTallies[targetId] = (g.voteTallies[targetId] || 0) + 1;

      const activeCount = Object.values(room.players).filter((p) => p.connectionStatus === 'connected').length;
      if (Object.keys(g.votes).length >= activeCount) {
        resolveMostLikelyToVotes(room);
      }

      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    // --- GAME 8: SIP OR SPILL ACTIONS ---
    case 'SOS_ACTION': {
      if (mode !== 'sip_or_spill') break;
      if (playerId !== g.targetPlayerId) {
        return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Not your turn to answer or sip.' };
      }

      const action = payload?.action === 'sip' ? 'sip' : 'spill';
      const confession = (payload?.confession || '').trim().slice(0, 200);

      g.chosenAction = action;
      g.confessionText = confession;

      if (action === 'sip') {
        const sipsToTake = g.spicyLevel || 2;
        room.sipsCount[playerId] = (room.sipsCount[playerId] || 0) + sipsToTake;
        player.score = (player.score || 0) + 40;
      } else {
        player.score = (player.score || 0) + 150;
      }

      g.phase = 'reaction';
      g.phaseEndsAt = Date.now() + 8000;

      return {
        updatedRoom: room,
        publicState: getPublicGameState(room),
        broadcastEvent: {
          name: 'sos:resolved',
          data: {
            playerId,
            username: player.username,
            action,
            confession,
            sips: action === 'sip' ? (g.spicyLevel || 2) : 0
          }
        }
      };
    }

    case 'SOS_REACT': {
      if (mode !== 'sip_or_spill') break;
      const emoji = payload?.emoji || '🥤';
      if (!g.reactions) g.reactions = {};
      g.reactions[playerId] = emoji;

      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    // --- GAME 9: SILLY ROULETTE ACTIONS ---
    case 'ROULETTE_SPIN': {
      if (mode !== 'silly_roulette' || g.phase !== 'spinning') break;
      // Host or target can trigger the spin
      g.targetAngle = 1800 + Math.floor(Math.random() * 360);
      g.phaseEndsAt = Date.now() + 5000;
      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    case 'ROULETTE_VOTE': {
      if (mode !== 'silly_roulette' || g.phase !== 'voting') break;
      if (playerId === g.targetPlayerId) break;

      const vote = payload?.vote === 'nailed_it' ? 'nailed_it' : 'shame_penalty';
      if (!g.votes) g.votes = {};
      g.votes[playerId] = vote;

      if (!g.voteTallies) g.voteTallies = { nailed_it: 0, shame_penalty: 0 };
      g.voteTallies[vote] = (g.voteTallies[vote] || 0) + 1;

      const activeOthers = Object.values(room.players).filter((p) => p.connectionStatus === 'connected' && p.id !== g.targetPlayerId).length;
      if (Object.keys(g.votes).length >= Math.max(1, activeOthers)) {
        if (g.voteTallies.nailed_it >= g.voteTallies.shame_penalty) {
          const target = room.players[g.targetPlayerId];
          if (target) target.score = (target.score || 0) + 180;
        } else {
          // Penalty sip if failed
          if (g.targetPlayerId) {
            room.sipsCount[g.targetPlayerId] = (room.sipsCount[g.targetPlayerId] || 0) + 2;
          }
        }
        g.phase = 'round_results';
        g.phaseEndsAt = Date.now() + 6000;
      }

      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    // --- GAME 10: HOT POTATO ACTIONS ---
    case 'POTATO_PASS': {
      if (mode !== 'hot_potato' || g.phase !== 'bomb_ticking') break;
      if (playerId !== g.activeHolderId) {
        return { updatedRoom: room, publicState: getPublicGameState(room), error: 'You are not holding the ticking bomb!' };
      }

      const word = (payload?.word || '').trim().toLowerCase();
      if (!word || word.length < 2) {
        return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Answer must be at least 2 letters.' };
      }

      if (g.recentWords?.includes(word)) {
        return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Word already passed! Think of another!' };
      }

      // Word accepted! Award fast pass points
      player.score = (player.score || 0) + 40;
      g.passCount = (g.passCount || 0) + 1;
      if (!g.recentWords) g.recentWords = [];
      g.recentWords.push(word);

      // Pass the bomb to another active player!
      const activePlayers = Object.values(room.players).filter((p) => p.connectionStatus === 'connected');
      const otherPlayers = activePlayers.filter((p) => p.id !== playerId);
      const nextPlayer = otherPlayers.length > 0
        ? otherPlayers[Math.floor(Math.random() * otherPlayers.length)]
        : activePlayers[0];

      g.activeHolderId = nextPlayer.id;

      // Accelerated bomb timer: starts at 8s, reduces slightly per pass (min 4.5s)
      const nextDuration = Math.max(4.5, 8 - g.passCount * 0.4);
      g.phaseEndsAt = Date.now() + nextDuration * 1000;

      return {
        updatedRoom: room,
        publicState: getPublicGameState(room),
        broadcastEvent: {
          name: 'potato:passed',
          data: {
            fromPlayerId: playerId,
            toPlayerId: nextPlayer.id,
            word,
            passCount: g.passCount
          }
        }
      };
    }

    // --- ADVANCE ROUND / GAME OVER ---
    case 'NEXT_ROUND': {
      if (!player?.isHost) return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Only host can advance round.' };
      if (room.currentRound >= room.config.totalRounds) {
        room.status = 'game_over';
        room.gameData = { ...room.gameData, awards: generatePartyAwards(room) };
        return { updatedRoom: room, publicState: getPublicGameState(room) };
      }
      room.currentRound += 1;
      return initGameSession(room);
    }
  }

  return { updatedRoom: room, publicState: getPublicGameState(room) };
}

// ========================================================
// 3. PHASE RESOLUTION (WHEN SERVER TIMER HITS 0)
// ========================================================

export function resolveGamePhase(room: RoomState): GameEngineResult {
  const mode = room.config.gameMode;
  const g = room.gameData || {};
  if (!room.sipsCount) room.sipsCount = {};

  switch (mode) {
    case 'who_is_imposter': {
      if (g.phase === 'clue_giving') {
        g.phase = 'voting';
        g.phaseEndsAt = Date.now() + 30000;
      } else if (g.phase === 'voting') {
        resolveImposterVotes(room);
      } else if (g.phase === 'imposter_sudden_death') {
        g.suddenDeathActive = false;
        g.phase = 'round_result';
        g.revealedWord = g.secretWord;
      } else if (g.phase === 'round_result') {
        if (room.currentRound >= room.config.totalRounds) {
          room.status = 'game_over';
          room.gameData.awards = generatePartyAwards(room);
        } else {
          room.currentRound += 1;
          return initImposterGame(room, Object.values(room.players));
        }
      }
      break;
    }

    case 'draw_and_guess': {
      if (g.phase === 'drawing') {
        g.phase = 'round_result';
        g.phaseEndsAt = Date.now() + 6000;
      } else if (g.phase === 'round_result') {
        if (room.currentRound >= room.config.totalRounds) {
          room.status = 'game_over';
          room.gameData.awards = generatePartyAwards(room);
        } else {
          room.currentRound += 1;
          return initDrawAndGuessGame(room, Object.values(room.players));
        }
      }
      break;
    }

    case 'quiz_battle': {
      if (g.phase === 'question') {
        g.phase = 'reveal';
        g.phaseEndsAt = Date.now() + 6000;
      } else if (g.phase === 'reveal') {
        const qIdx = (g.questionIndex || 0) + 1;
        if (qIdx >= (g.questions?.length || room.config.totalRounds || 5)) {
          room.status = 'game_over';
          room.gameData.awards = generatePartyAwards(room);
        } else {
          g.questionIndex = qIdx;
          g.currentQuestion = g.questions[qIdx];
          g.answers = {};
          g.answeredPlayerIds = [];
          g.phase = 'question';
          g.phaseEndsAt = Date.now() + (room.config.roundDurationSeconds || 20) * 1000;
        }
      }
      break;
    }

    case 'word_battle': {
      if (g.phase === 'word_racing') {
        g.phase = 'round_results';
        g.phaseEndsAt = Date.now() + 6000;
      } else if (g.phase === 'round_results') {
        if (room.currentRound >= room.config.totalRounds) {
          room.status = 'game_over';
          room.gameData.awards = generatePartyAwards(room);
        } else {
          room.currentRound += 1;
          return initWordBattleGame(room, Object.values(room.players));
        }
      }
      break;
    }

    case 'truth_or_dare': {
      if (g.phase === 'roulette') {
        g.phase = 'decision';
        g.phaseEndsAt = Date.now() + 20000;
      } else if (g.phase === 'decision' || g.phase === 'performing') {
        g.phase = 'voting';
        g.phaseEndsAt = Date.now() + 20000;
      } else if (g.phase === 'voting') {
        g.phase = 'round_results';
        g.phaseEndsAt = Date.now() + 6000;
      } else if (g.phase === 'round_results') {
        if (room.currentRound >= room.config.totalRounds) {
          room.status = 'game_over';
          room.gameData.awards = generatePartyAwards(room);
        } else {
          room.currentRound += 1;
          return initTruthOrDareGame(room, Object.values(room.players));
        }
      }
      break;
    }

    case 'never_have_i_ever': {
      if (g.phase === 'statement') {
        g.phase = 'reveal';
        g.phaseEndsAt = Date.now() + 7000;
      } else if (g.phase === 'reveal') {
        if (room.currentRound >= room.config.totalRounds) {
          room.status = 'game_over';
          room.gameData.awards = generatePartyAwards(room);
        } else {
          room.currentRound += 1;
          return initNeverHaveIEverGame(room, Object.values(room.players));
        }
      }
      break;
    }

    case 'most_likely_to': {
      if (g.phase === 'voting') {
        resolveMostLikelyToVotes(room);
      } else if (g.phase === 'reveal') {
        g.phase = 'penalty';
        g.phaseEndsAt = Date.now() + 18000;
      } else if (g.phase === 'penalty') {
        g.phase = 'round_results';
        g.phaseEndsAt = Date.now() + 6000;
      } else if (g.phase === 'round_results') {
        if (room.currentRound >= room.config.totalRounds) {
          room.status = 'game_over';
          room.gameData.awards = generatePartyAwards(room);
        } else {
          room.currentRound += 1;
          return initMostLikelyToGame(room, Object.values(room.players));
        }
      }
      break;
    }

    case 'sip_or_spill': {
      if (g.phase === 'dilemma') {
        // Auto sip if target didn't answer in time!
        if (g.targetPlayerId && !g.chosenAction) {
          g.chosenAction = 'sip';
          room.sipsCount[g.targetPlayerId] = (room.sipsCount[g.targetPlayerId] || 0) + (g.spicyLevel || 2);
        }
        g.phase = 'reaction';
        g.phaseEndsAt = Date.now() + 8000;
      } else if (g.phase === 'reaction') {
        g.phase = 'round_results';
        g.phaseEndsAt = Date.now() + 6000;
      } else if (g.phase === 'round_results') {
        if (room.currentRound >= room.config.totalRounds) {
          room.status = 'game_over';
          room.gameData.awards = generatePartyAwards(room);
        } else {
          room.currentRound += 1;
          return initSipOrSpillGame(room, Object.values(room.players));
        }
      }
      break;
    }

    case 'silly_roulette': {
      if (g.phase === 'spinning') {
        g.isSpinning = false;
        g.phase = 'challenge';
        g.phaseEndsAt = Date.now() + 30000;
      } else if (g.phase === 'challenge') {
        g.phase = 'voting';
        g.phaseEndsAt = Date.now() + 15000;
      } else if (g.phase === 'voting') {
        g.phase = 'round_results';
        g.phaseEndsAt = Date.now() + 6000;
      } else if (g.phase === 'round_results') {
        if (room.currentRound >= room.config.totalRounds) {
          room.status = 'game_over';
          room.gameData.awards = generatePartyAwards(room);
        } else {
          room.currentRound += 1;
          return initSillyRouletteGame(room, Object.values(room.players));
        }
      }
      break;
    }

    case 'hot_potato': {
      if (g.phase === 'bomb_ticking') {
        // BOMB EXPLODED in active holder's hands!
        g.explodedPlayerId = g.activeHolderId;
        g.phase = 'exploded';
        g.phaseEndsAt = Date.now() + 12000;

        // Penalty in Sip Edition
        if (room.config.vibeMode === 'sip_edition' && g.activeHolderId) {
          room.sipsCount[g.activeHolderId] = (room.sipsCount[g.activeHolderId] || 0) + 3;
        }

        return {
          updatedRoom: room,
          publicState: getPublicGameState(room),
          broadcastEvent: {
            name: 'bomb:exploded',
            data: {
              victimPlayerId: g.activeHolderId,
              victimUsername: room.players[g.activeHolderId]?.username || 'Player',
              consequence: g.goofyConsequence
            }
          }
        };
      } else if (g.phase === 'exploded') {
        g.phase = 'round_results';
        g.phaseEndsAt = Date.now() + 6000;
      } else if (g.phase === 'round_results') {
        if (room.currentRound >= room.config.totalRounds) {
          room.status = 'game_over';
          room.gameData.awards = generatePartyAwards(room);
        } else {
          room.currentRound += 1;
          return initHotPotatoGame(room, Object.values(room.players));
        }
      }
      break;
    }
  }

  return { updatedRoom: room, publicState: getPublicGameState(room) };
}

// --- Helper: Resolve Most Likely To Votes ---
function resolveMostLikelyToVotes(room: RoomState) {
  const g = room.gameData;
  if (!room.sipsCount) room.sipsCount = {};
  const tallies = g.voteTallies || {};
  let maxVotes = 0;
  let votedPlayerId: string | null = null;

  for (const [targetId, count] of Object.entries(tallies)) {
    if ((count as number) > maxVotes) {
      maxVotes = count as number;
      votedPlayerId = targetId;
    }
  }

  g.votedOutPlayerId = votedPlayerId;
  const victim = votedPlayerId ? room.players[votedPlayerId] : null;

  const ROAST_TEMPLATES = [
    "The crew has spoken! Your chaos is officially certified.",
    "Unanimous agreement: nobody else stood a chance against your energy.",
    "Certified culprit! Time to own your moment of party glory.",
    "The squad voted and there's zero doubt you own this title."
  ];

  g.roastMessage = victim
    ? `${victim.username} was voted by the room with ${maxVotes} votes! ${ROAST_TEMPLATES[Math.floor(Math.random() * ROAST_TEMPLATES.length)]}`
    : "It's a dead tie! Everyone shares the glory!";

  // Award bonus points to voters who voted with the majority
  for (const [voterId, target] of Object.entries(g.votes || {})) {
    if (target === votedPlayerId) {
      const voter = room.players[voterId];
      if (voter) voter.score = (voter.score || 0) + 75;
    }
  }

  // Sip Edition penalty for the voted person
  if (room.config.vibeMode === 'sip_edition' && votedPlayerId) {
    room.sipsCount[votedPlayerId] = (room.sipsCount[votedPlayerId] || 0) + 2;
  }

  g.phase = 'reveal';
  g.phaseEndsAt = Date.now() + 10000;
}

// --- Helper: Resolve Imposter Votes ---
function resolveImposterVotes(room: RoomState) {
  const g = room.gameData;
  const tallies = g.voteTallies || {};
  let maxVotes = 0;
  let votedPlayerId: string | null = null;

  for (const [targetId, count] of Object.entries(tallies)) {
    if ((count as number) > maxVotes) {
      maxVotes = count as number;
      votedPlayerId = targetId;
    }
  }

  const imposterIds = new Set(g.imposterIds || []);
  if (votedPlayerId && imposterIds.has(votedPlayerId)) {
    g.caughtImposterIds = [votedPlayerId];
    g.suddenDeathActive = true;
    g.suddenDeathPlayerId = votedPlayerId;
    g.suddenDeathEndsAt = Date.now() + 12000;
    g.phase = 'imposter_sudden_death';
    g.phaseEndsAt = g.suddenDeathEndsAt;

    for (const p of Object.values(room.players)) {
      if (!imposterIds.has(p.id)) {
        p.score = (p.score || 0) + 100;
      }
    }
  } else {
    g.phase = 'round_result';
    g.revealedWord = g.secretWord;
    g.impostersWon = true;

    for (const p of Object.values(room.players)) {
      if (imposterIds.has(p.id)) {
        p.score = (p.score || 0) + 200;
      }
    }
  }
}

// ========================================================
// 4. SANITIZED PUBLIC GAME STATE EXTRACTOR
// ========================================================

export function getPublicGameState(room: RoomState): any {
  const mode = room.config.gameMode;
  const g = room.gameData || {};

  switch (mode) {
    case 'who_is_imposter': {
      const turnOrder = g.turnOrder || [];
      const currentTurnId = turnOrder[g.currentTurnIndex || 0];
      const state: ImposterPublicState = {
        phase: g.phase || 'clue_giving',
        round: room.currentRound,
        totalRounds: room.config.totalRounds,
        category: g.category || 'General',
        currentTurnPlayerId: currentTurnId,
        currentTurnUsername: room.players[currentTurnId]?.username,
        turnOrder,
        clues: g.clues || {},
        votes: g.votes || {},
        voteTallies: g.voteTallies || {},
        caughtImposterIds: g.caughtImposterIds || [],
        suddenDeathActive: Boolean(g.suddenDeathActive),
        suddenDeathPlayerId: g.suddenDeathPlayerId,
        suddenDeathPlayerUsername: room.players[g.suddenDeathPlayerId]?.username,
        suddenDeathEndsAt: g.suddenDeathEndsAt,
        revealedWord: g.phase === 'round_result' ? g.secretWord : undefined,
        impostersWon: g.impostersWon,
        phaseEndsAt: g.phaseEndsAt
      };
      return state;
    }

    case 'draw_and_guess': {
      const drawer = room.players[g.drawerId] || Object.values(room.players)[0];
      const secret = g.secretWord || 'GAME';
      const state: DrawAndGuessPublicState = {
        phase: g.phase || 'drawing',
        currentDrawerId: drawer?.id || '',
        currentDrawerUsername: drawer?.username || '',
        currentDrawerAvatar: drawer?.avatar || 'cyber_cat',
        wordLength: secret.length,
        wordMask: g.phase === 'round_result' ? secret : secret.replace(/[a-zA-Z]/g, '_ '),
        category: g.category || 'Objects',
        secretWord: g.phase === 'round_result' ? secret : undefined,
        correctGuessers: g.correctGuessers || [],
        phaseEndsAt: g.phaseEndsAt
      };
      return state;
    }

    case 'quiz_battle': {
      const q = g.currentQuestion;
      const state: QuizPublicState = {
        phase: g.phase || 'question',
        questionNumber: (g.questionIndex || 0) + 1,
        totalQuestions: g.questions?.length || room.config.totalRounds || 5,
        currentQuestion: q
          ? {
              id: q.id,
              question: q.question,
              category: q.category,
              difficulty: q.difficulty,
              options: q.options,
              phaseEndsAt: g.phaseEndsAt,
              durationSeconds: room.config.roundDurationSeconds || 20
            }
          : undefined,
        answeredPlayerIds: g.answeredPlayerIds || [],
        totalActivePlayers: Object.keys(room.players).length,
        correctAnswerIndex: g.phase === 'reveal' ? q?.correctIndex : undefined
      };
      return state;
    }

    case 'word_battle': {
      const scores: Record<string, number> = {};
      for (const p of Object.values(room.players)) scores[p.id] = p.score || 0;
      const remaining = Math.max(0, Math.ceil(((g.phaseEndsAt || 0) - Date.now()) / 1000));
      const state: WordBattlePublicState = {
        phase: g.phase || 'word_racing',
        round: room.currentRound,
        totalRounds: room.config.totalRounds,
        category: g.category || 'General',
        startingLetter: g.startingLetter || 'A',
        claimedWords: g.claimedWords || [],
        recentSubmissions: g.submissions || [],
        scores,
        playerWordCounts: g.playerWordCounts || {},
        phaseEndsAt: g.phaseEndsAt,
        remainingSeconds: remaining
      };
      return state;
    }

    case 'truth_or_dare': {
      const target = room.players[g.targetPlayerId] || Object.values(room.players)[0];
      const scores: Record<string, number> = {};
      for (const p of Object.values(room.players)) scores[p.id] = p.score || 0;
      const remaining = Math.max(0, Math.ceil(((g.phaseEndsAt || 0) - Date.now()) / 1000));

      const votes = g.votes || {};
      const completed = Object.values(votes).filter((v) => v === 'completed').length;
      const refused = Object.values(votes).filter((v) => v === 'refused').length;

      const state: TruthOrDarePublicState = {
        phase: g.phase || 'roulette',
        round: room.currentRound,
        totalRounds: room.config.totalRounds,
        targetPlayerId: target?.id || '',
        targetUsername: target?.username || '',
        targetAvatar: target?.avatar || 'cyber_cat',
        intensity: g.intensity || 'party',
        chosenType: g.chosenType,
        currentPrompt: g.currentPrompt,
        votes,
        voteTallies: { completed, refused },
        scores,
        phaseEndsAt: g.phaseEndsAt,
        remainingSeconds: remaining
      };
      return state;
    }

    case 'never_have_i_ever': {
      const remaining = Math.max(0, Math.ceil(((g.phaseEndsAt || 0) - Date.now()) / 1000));
      const choices = g.roundChoices || {};
      const haveCount = Object.values(choices).filter((c) => c === 'have').length;
      const haveNotCount = Object.values(choices).filter((c) => c === 'havenot').length;
      const totalVoted = haveCount + haveNotCount;

      const state: NeverHaveIEverPublicState = {
        phase: g.phase || 'statement',
        round: room.currentRound,
        totalRounds: room.config.totalRounds,
        statement: g.statement || '',
        category: g.category || 'General',
        innocencePoints: g.innocencePoints || {},
        roundChoices: choices,
        stats:
          totalVoted > 0
            ? {
                haveCount,
                haveNotCount,
                totalVoted,
                havePercentage: Math.round((haveCount / totalVoted) * 100)
              }
            : undefined,
        phaseEndsAt: g.phaseEndsAt,
        remainingSeconds: remaining
      };
      return state;
    }

    case 'most_likely_to': {
      const remaining = Math.max(0, Math.ceil(((g.phaseEndsAt || 0) - Date.now()) / 1000));
      const victim = g.votedOutPlayerId ? room.players[g.votedOutPlayerId] : null;

      const state: MostLikelyToPublicState = {
        phase: g.phase || 'voting',
        round: room.currentRound,
        totalRounds: room.config.totalRounds,
        prompt: g.prompt || '',
        category: g.category || 'Party Debate',
        penaltyDare: g.penaltyDare || 'Take 2 sips! 🥤',
        votes: g.votes || {},
        voteTallies: g.voteTallies || {},
        votedOutPlayerId: g.votedOutPlayerId || undefined,
        votedOutUsername: victim?.username,
        votedOutAvatar: victim?.avatar,
        roastMessage: g.roastMessage,
        phaseEndsAt: g.phaseEndsAt,
        remainingSeconds: remaining
      };
      return state;
    }

    case 'sip_or_spill': {
      const remaining = Math.max(0, Math.ceil(((g.phaseEndsAt || 0) - Date.now()) / 1000));
      const target = room.players[g.targetPlayerId] || Object.values(room.players)[0];

      const state: SipOrSpillPublicState = {
        phase: g.phase || 'dilemma',
        round: room.currentRound,
        totalRounds: room.config.totalRounds,
        targetPlayerId: target?.id || '',
        targetUsername: target?.username || '',
        targetAvatar: target?.avatar || 'cyber_cat',
        dilemma: g.dilemma || '',
        question: g.question || '',
        spicyLevel: g.spicyLevel || 1,
        chosenAction: g.chosenAction,
        confessionText: g.confessionText,
        reactions: g.reactions || {},
        phaseEndsAt: g.phaseEndsAt,
        remainingSeconds: remaining
      };
      return state;
    }

    case 'silly_roulette': {
      const remaining = Math.max(0, Math.ceil(((g.phaseEndsAt || 0) - Date.now()) / 1000));
      const target = room.players[g.targetPlayerId] || Object.values(room.players)[0];

      const state: SillyRoulettePublicState = {
        phase: g.phase || 'spinning',
        round: room.currentRound,
        totalRounds: room.config.totalRounds,
        targetPlayerId: target?.id || '',
        targetUsername: target?.username || '',
        targetAvatar: target?.avatar || 'cyber_cat',
        challengeTitle: g.challengeTitle || 'Absurd Challenge',
        challengeText: g.challengeText || 'Entertain the room!',
        challengeCategory: g.challengeCategory || 'absurd',
        targetAngle: g.targetAngle || 1800,
        isSpinning: Boolean(g.isSpinning),
        votes: g.votes || {},
        voteTallies: g.voteTallies || { nailed_it: 0, shame_penalty: 0 },
        phaseEndsAt: g.phaseEndsAt,
        remainingSeconds: remaining
      };
      return state;
    }

    case 'hot_potato': {
      const remaining = Math.max(0, Math.ceil(((g.phaseEndsAt || 0) - Date.now()) / 1000));
      const holder = room.players[g.activeHolderId] || Object.values(room.players)[0];
      const victim = g.explodedPlayerId ? room.players[g.explodedPlayerId] : null;

      const state: HotPotatoPublicState = {
        phase: g.phase || 'bomb_ticking',
        round: room.currentRound,
        totalRounds: room.config.totalRounds,
        activeHolderId: holder?.id || '',
        activeHolderUsername: holder?.username || 'Player',
        activeHolderAvatar: holder?.avatar || 'cyber_cat',
        category: g.category || 'Rapid Fire',
        goofyConsequence: g.goofyConsequence || 'Take a sip! 🥤',
        passCount: g.passCount || 0,
        recentWords: g.recentWords || [],
        bombTimerRemainingMs: Math.max(0, (g.phaseEndsAt || 0) - Date.now()),
        explodedPlayerId: g.explodedPlayerId || undefined,
        explodedUsername: victim?.username,
        phaseEndsAt: g.phaseEndsAt,
        remainingSeconds: remaining
      };
      return state;
    }
  }

  return null;
}

// ========================================================
// 5. PARTY SPECIAL AWARDS & MVP CALCULATION
// ========================================================

export function generatePartyAwards(room: RoomState): PartyAward[] {
  const players = Object.values(room.players);
  if (players.length === 0) return [];

  const awards: PartyAward[] = [];
  const sips = room.sipsCount || {};
  const g = room.gameData || {};

  // 1. Overall MVP "MVP of the Night 👑"
  const sortedByScore = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const mvp = sortedByScore[0];
  if (mvp) {
    awards.push({
      id: 'award_mvp',
      title: 'MVP of the Night 👑',
      description: 'Dominated the matches with supreme arcade brilliance and party presence!',
      recipientId: mvp.id,
      recipientUsername: mvp.username,
      recipientAvatar: mvp.avatar,
      badgeIcon: '👑',
      scoreOrStat: `${mvp.score || 0} PTS`
    });
  }

  // 2. The Certified Liar 🕵️ (Most successful imposter or sneaky civilian)
  let liarPlayer = players.find(p => p.id === g.imposterId);
  if (!liarPlayer) {
    liarPlayer = sortedByScore[1] || players[players.length - 1] || mvp;
  }
  if (liarPlayer) {
    awards.push({
      id: 'award_liar',
      title: 'The Certified Liar 🕵️',
      description: 'Fooled everyone with unmatched poker faces, wild bluffs, and stealthy alibis!',
      recipientId: liarPlayer.id,
      recipientUsername: liarPlayer.username,
      recipientAvatar: liarPlayer.avatar,
      badgeIcon: '🕵️',
      scoreOrStat: liarPlayer.id === g.imposterId ? 'Undetected Imposter' : 'Master of Deception'
    });
  }

  // 3. Sip Champion 🥤 (Player with the most sips logged in room.sipsCount)
  let maxSips = 0;
  let sipChamp: any = null;
  for (const p of players) {
    const pSips = sips[p.id] || 0;
    if (pSips > maxSips) {
      maxSips = pSips;
      sipChamp = p;
    }
  }
  if (!sipChamp) {
    sipChamp = sortedByScore[sortedByScore.length - 1] || mvp;
  }
  awards.push({
    id: 'award_sip_champion',
    title: 'Sip Champion 🥤',
    description: maxSips > 0
      ? 'Chugged penalties like a true legend of the crowd!'
      : 'Held their ground through every spicy dilemma and dare!',
    recipientId: sipChamp.id,
    recipientUsername: sipChamp.username,
    recipientAvatar: sipChamp.avatar,
    badgeIcon: '🥤',
    scoreOrStat: `${maxSips > 0 ? maxSips : 0} Sips Taken`
  });

  // 4. Picasso From Wish 🎨 (Drawings Hall of Shame with actual snapshot thumbnail!)
  if (Array.isArray(g.drawingSnapshots) && g.drawingSnapshots.length > 0) {
    const sortedSnaps = [...g.drawingSnapshots].sort((a, b) => (a.correctCount ?? 0) - (b.correctCount ?? 0));
    const funnySnap = sortedSnaps[0];
    const drawerPlayer = room.players[funnySnap.drawerId] || {
      id: funnySnap.drawerId,
      username: funnySnap.drawerUsername,
      avatar: funnySnap.drawerAvatar
    };
    awards.push({
      id: 'award_picasso_wish',
      title: 'Picasso From Wish 🎨',
      description: 'Created a mind-bending visual masterpiece that left everyone questioning reality!',
      recipientId: drawerPlayer.id,
      recipientUsername: drawerPlayer.username,
      recipientAvatar: drawerPlayer.avatar,
      badgeIcon: '🎨',
      scoreOrStat: `${funnySnap.correctCount || 0} Guesses`,
      thumbnail: funnySnap.snapshot
    });
  } else {
    const secondMvp = sortedByScore[1] || mvp;
    awards.push({
      id: 'award_quick_reflex',
      title: 'Lightning Reflexes ⚡',
      description: 'Reacted before anyone else could even process what was happening!',
      recipientId: secondMvp.id,
      recipientUsername: secondMvp.username,
      recipientAvatar: secondMvp.avatar,
      badgeIcon: '⚡',
      scoreOrStat: 'Fastest Answers'
    });
  }

  // 5. Chaos Menace 🔥 (Player who cast the most sabotages or triggered bomb detonations)
  let chaosMenace: any = null;
  if (g.explodedPlayerId && room.players[g.explodedPlayerId]) {
    chaosMenace = room.players[g.explodedPlayerId];
  } else if (g.usedPowerUps && Object.keys(g.usedPowerUps).length > 0) {
    const powerUser = Object.keys(g.usedPowerUps)[0];
    if (powerUser && room.players[powerUser]) {
      chaosMenace = room.players[powerUser];
    }
  }
  if (!chaosMenace) {
    const nonMvps = players.filter(p => p.id !== mvp.id);
    chaosMenace = nonMvps.length > 0 ? nonMvps[Math.floor(Math.random() * nonMvps.length)] : mvp;
  }
  awards.push({
    id: 'award_chaos_menace',
    title: 'Chaos Menace 🔥',
    description: 'Turned every calm round into hilarious unpredictability, sabotage, and madness!',
    recipientId: chaosMenace.id,
    recipientUsername: chaosMenace.username,
    recipientAvatar: chaosMenace.avatar,
    badgeIcon: '🔥',
    scoreOrStat: '100% Chaos'
  });

  return awards;
}
