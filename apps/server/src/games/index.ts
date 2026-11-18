import { GameRegistry } from './engine/GameRegistry.js';
import { ImposterGameEngine } from './imposter/ImposterGameEngine.js';
import { DrawAndGuessEngine } from './draw/DrawAndGuessEngine.js';
import { QuizBattleEngine } from './quiz/QuizBattleEngine.js';
import { WordBattleEngine } from './wordbattle/WordBattleEngine.js';
import { TruthOrDareEngine } from './truthordare/TruthOrDareEngine.js';
import { NeverHaveIEverEngine } from './nhie/NeverHaveIEverEngine.js';

export const imposterEngine = new ImposterGameEngine();
export const drawAndGuessEngine = new DrawAndGuessEngine();
export const quizBattleEngine = new QuizBattleEngine();
export const wordBattleEngine = new WordBattleEngine();
export const truthOrDareEngine = new TruthOrDareEngine();
export const neverHaveIEverEngine = new NeverHaveIEverEngine();

// Register all 6 modular party engines with the registry
GameRegistry.register(imposterEngine);
GameRegistry.register(drawAndGuessEngine);
GameRegistry.register(quizBattleEngine);
GameRegistry.register(wordBattleEngine);
GameRegistry.register(truthOrDareEngine);
GameRegistry.register(neverHaveIEverEngine);

export { GameRegistry };
export * from './engine/IPartyGameEngine.js';
