import {
  ClueSubmission,
  GameMode,
  ImposterPublicState,
  DrawAndGuessPublicState,
  QuizPublicState,
  WordBattlePublicState,
  TruthOrDarePublicState,
  NeverHaveIEverPublicState,
  PlayerScoreUpdate,
  RoomState
} from '@feto-games/shared-types';

import imposterWords from './data/imposterWords.json';
import drawWords from './data/drawWords.json';
import quizQuestions from './data/quizQuestions.json';
import wordBattleCategories from './data/wordBattleCategories.json';
import truthOrDarePrompts from './data/truthOrDarePrompts.json';
import neverHaveIEverStatements from './data/neverHaveIEverStatements.json';

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
  room.currentRound = 1;

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
    default:
      return initQuizBattleGame(room, activePlayers);
  }
}

// --- Who Is The Imposter ---
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

// --- Draw & Guess ---
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

// --- Quiz Battle ---
function initQuizBattleGame(room: RoomState, players: any[]): GameEngineResult {
  const totalQuestions = room.config.totalRounds || 5;
  const shuffledQuestions = [...quizQuestions].sort(() => 0.5 - Math.random()).slice(0, totalQuestions);
  const currentQ = shuffledQuestions[0] || {
    id: 'q1',
    question: 'What is the speed of light?',
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

// --- Word Battle ---
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

// --- Truth or Dare ---
function initTruthOrDareGame(room: RoomState, players: any[]): GameEngineResult {
  const target = players[Math.floor(Math.random() * players.length)];
  const duration = 6;
  const phaseEndsAt = Date.now() + duration * 1000;

  room.gameData = {
    targetPlayerId: target.id,
    intensity: 'party',
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
    intensity: 'party',
    votes: {},
    voteTallies: { completed: 0, refused: 0 },
    scores,
    phaseEndsAt,
    remainingSeconds: duration
  };

  return { updatedRoom: room, publicState };
}

// --- Never Have I Ever ---
function initNeverHaveIEverGame(room: RoomState, players: any[]): GameEngineResult {
  const item = neverHaveIEverStatements[Math.floor(Math.random() * neverHaveIEverStatements.length)] || {
    statement: 'Never have I ever ghosted someone after a first date',
    category: 'Dating & Romance'
  };

  const duration = 20;
  const phaseEndsAt = Date.now() + duration * 1000;

  const innocence: Record<string, number> = {};
  for (const p of players) innocence[p.id] = 5; // 5 hearts

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
  if (!player && actionType !== 'DISCONNECT') {
    return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Player not in room.' };
  }

  const mode = room.config.gameMode;
  const g = room.gameData || {};

  switch (actionType) {
    // --- WHO IS THE IMPOSTER ACTIONS ---
    case 'SUBMIT_CLUE': {
      if (mode !== 'who_is_imposter') break;
      const clueText = (payload?.clue || '').trim().slice(0, 40);
      if (!clueText) return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Empty clue.' };

      if (!g.clues) g.clues = {};
      g.clues[playerId] = {
        playerId,
        username: player.username,
        avatar: player.avatar,
        clue: clueText,
        submittedAt: Date.now()
      };

      // Advance turn
      g.currentTurnIndex = (g.currentTurnIndex || 0) + 1;
      const turnOrder = g.turnOrder || [];

      if (g.currentTurnIndex >= turnOrder.length) {
        // All clues submitted -> transition to voting
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

      // If all players voted, advance to reveal
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

    // --- DRAW & GUESS ACTIONS ---
    case 'DRAW_GUESS': {
      if (mode !== 'draw_and_guess' || g.phase !== 'drawing') break;
      if (playerId === g.drawerId) return { updatedRoom: room, publicState: getPublicGameState(room) };

      const guess = (payload?.message || '').toLowerCase().trim();
      const secret = (g.secretWord || '').toLowerCase().trim();
      const isCorrect = guess === secret;

      if (isCorrect && !g.correctGuessers?.includes(playerId)) {
        if (!g.correctGuessers) g.correctGuessers = [];
        g.correctGuessers.push(playerId);

        // Award points based on speed
        const remainingTimeSec = Math.max(1, Math.floor(((g.phaseEndsAt || 0) - Date.now()) / 1000));
        const pts = Math.min(300, 100 + remainingTimeSec * 4);
        player.score = (player.score || 0) + pts;

        // Drawer gets bonus for each guesser
        const drawer = room.players[g.drawerId];
        if (drawer) {
          drawer.score = (drawer.score || 0) + 50;
        }

        // Check if all other players have guessed
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

      // Regular chat message broadcast
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

    // --- QUIZ BATTLE ACTIONS ---
    case 'SUBMIT_ANSWER': {
      if (mode !== 'quiz_battle' || g.phase !== 'question') break;
      const optionIndex = payload?.optionIndex;
      if (typeof optionIndex !== 'number') break;

      if (!g.answers) g.answers = {};
      if (g.answers[playerId] !== undefined) break; // already answered

      g.answers[playerId] = optionIndex;
      if (!g.answeredPlayerIds) g.answeredPlayerIds = [];
      g.answeredPlayerIds.push(playerId);

      const q = g.currentQuestion;
      if (q && optionIndex === q.correctIndex) {
        const remainingSec = Math.max(1, Math.floor(((g.phaseEndsAt || 0) - Date.now()) / 1000));
        const pts = 100 + remainingSec * 5;
        player.score = (player.score || 0) + pts;
      }

      // If all answered -> reveal
      const activeCount = Object.values(room.players).filter((p) => p.connectionStatus === 'connected').length;
      if (g.answeredPlayerIds.length >= activeCount) {
        g.phase = 'reveal';
        g.phaseEndsAt = Date.now() + 5000;
      }

      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    // --- WORD BATTLE ACTIONS ---
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

      const pts = Math.min(200, word.length * 15);
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

    // --- TRUTH OR DARE ACTIONS ---
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
          if (target) target.score = (target.score || 0) + (g.chosenType === 'dare' ? 150 : 100);
        }
        g.phase = 'round_results';
        g.phaseEndsAt = Date.now() + 5000;
      }
      return { updatedRoom: room, publicState: getPublicGameState(room) };
    }

    // --- NEVER HAVE I EVER ACTIONS ---
    case 'NHIE_CHOICE': {
      if (mode !== 'never_have_i_ever') break;
      const choice = payload?.choice === 'have' ? 'have' : 'havenot';
      if (!g.roundChoices) g.roundChoices = {};
      g.roundChoices[playerId] = choice;

      if (choice === 'have') {
        if (!g.innocencePoints) g.innocencePoints = {};
        const currentHearts = g.innocencePoints[playerId] ?? 5;
        g.innocencePoints[playerId] = Math.max(0, currentHearts - 1);
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

    case 'NEXT_ROUND': {
      if (!player.isHost) return { updatedRoom: room, publicState: getPublicGameState(room), error: 'Only host can advance round.' };
      if (room.currentRound >= room.config.totalRounds) {
        room.status = 'game_over';
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
        } else {
          room.currentRound += 1;
          return initNeverHaveIEverGame(room, Object.values(room.players));
        }
      }
      break;
    }
  }

  return { updatedRoom: room, publicState: getPublicGameState(room) };
}

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
    // Imposter caught!
    g.caughtImposterIds = [votedPlayerId];
    g.suddenDeathActive = true;
    g.suddenDeathPlayerId = votedPlayerId;
    g.suddenDeathEndsAt = Date.now() + 12000;
    g.phase = 'imposter_sudden_death';
    g.phaseEndsAt = g.suddenDeathEndsAt;

    // Award civilians
    for (const p of Object.values(room.players)) {
      if (!imposterIds.has(p.id)) {
        p.score = (p.score || 0) + 100;
      }
    }
  } else {
    // Civilians failed to catch imposter
    g.phase = 'round_result';
    g.revealedWord = g.secretWord;
    g.impostersWon = true;

    // Award imposters
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
  }

  return null;
}
