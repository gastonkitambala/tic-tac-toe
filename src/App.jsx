import { useEffect, useEffectEvent } from "react";
import Player from "./components/Player";
import GameBoard from "./components/GameBoard";
import Log from "./components/Log";
import GameOver from "./components/GameOver";
import Scoreboard from "./components/Scoreboard";
import GameModeControls from "./components/GameModeControls";
import { usePersistentState } from "./hooks/usePersistentState";
import {
  SYMBOLS,
  deriveActivePlayer,
  deriveBoard,
  getGameStatus,
  isValidMove,
  isValidTurnHistory,
} from "./game/engine";
import { chooseMove, DIFFICULTIES } from "./game/ai";

const DEFAULT_PLAYER_NAMES = {
  X: "Player 1",
  O: "Player 2",
};

const DEFAULT_SETTINGS = { opponent: "human", difficulty: "medium" };

/** The computer always plays O, so the human moves first. */
const COMPUTER_SYMBOL = "O";
const COMPUTER_NAME = "Computer";
const COMPUTER_MOVE_DELAY_MS = 450;

const EMPTY_SCORES = { X: 0, O: 0, draws: 0 };

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isCount = (n) => Number.isInteger(n) && n >= 0;
const isValidScores = (s) => isObject(s) && isCount(s.X) && isCount(s.O) && isCount(s.draws);
const isValidScoresByMode = (all) => isObject(all) && Object.values(all).every(isValidScores);

const isValidPlayerNames = (names) =>
  isObject(names) &&
  SYMBOLS.every((symbol) => typeof names[symbol] === "string" && names[symbol].trim());

const isValidSettings = (s) =>
  isObject(s) &&
  ["human", "computer"].includes(s.opponent) &&
  DIFFICULTIES.includes(s.difficulty);

/** Scores are kept separately for 2-player games and each AI difficulty. */
const modeKeyOf = (settings) =>
  settings.opponent === "human" ? "human" : `computer-${settings.difficulty}`;

function App() {
  const [gameTurns, setGameTurns] = usePersistentState("turns", [], {
    validate: isValidTurnHistory,
  });
  const [playerNames, setPlayerNames] = usePersistentState(
    "playerNames",
    DEFAULT_PLAYER_NAMES,
    { validate: isValidPlayerNames }
  );
  const [settings, setSettings] = usePersistentState("settings", DEFAULT_SETTINGS, {
    validate: isValidSettings,
  });
  const [scoresByMode, setScoresByMode] = usePersistentState(
    "scoresByMode",
    {},
    { validate: isValidScoresByMode }
  );

  const vsComputer = settings.opponent === "computer";
  const modeKey = modeKeyOf(settings);
  const scores = scoresByMode[modeKey] ?? EMPTY_SCORES;
  const displayNames = vsComputer
    ? { ...playerNames, [COMPUTER_SYMBOL]: COMPUTER_NAME }
    : playerNames;

  const activePlayer = deriveActivePlayer(gameTurns);
  const gameBoard = deriveBoard(gameTurns);
  const status = getGameStatus(gameBoard);
  const isGameOver = status.state !== "playing";
  const isComputerTurn = vsComputer && !isGameOver && activePlayer === COMPUTER_SYMBOL;
  const winnerName = status.state === "won" ? displayNames[status.winner] : null;

  function playMove(row, col) {
    // Computed from the rendered state rather than inside a state updater:
    // updaters must be pure (StrictMode runs them twice), and finishing a
    // game also updates the scores.
    if (!isValidMove(gameBoard, row, col)) return;

    const nextTurns = [{ square: { row, col }, player: activePlayer }, ...gameTurns];
    setGameTurns(nextTurns);

    const next = getGameStatus(deriveBoard(nextTurns));
    if (next.state === "playing") return;

    const field = next.state === "won" ? next.winner : "draws";
    setScoresByMode((prev) => {
      const current = prev[modeKey] ?? EMPTY_SCORES;
      return { ...prev, [modeKey]: { ...current, [field]: current[field] + 1 } };
    });
  }

  function handleSelectSquare(row, col) {
    if (isComputerTurn) return;
    playMove(row, col);
  }

  // Reads the latest state when the timer fires without restarting the timer
  // on every render.
  const playComputerMove = useEffectEvent(() => {
    const move = chooseMove(gameBoard, COMPUTER_SYMBOL, settings.difficulty);
    if (move) playMove(move.row, move.col);
  });

  useEffect(() => {
    if (!isComputerTurn) return;
    const timer = setTimeout(playComputerMove, COMPUTER_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isComputerTurn, gameTurns]);

  function handleRestart() {
    setGameTurns([]);
  }

  function handleResetScores() {
    setScoresByMode((prev) => ({ ...prev, [modeKey]: EMPTY_SCORES }));
  }

  function handleSettingsChange(nextSettings) {
    setSettings(nextSettings);
    setGameTurns([]); // a new opponent means a new game
  }

  function handlePlayerNameChange(symbol, newName) {
    setPlayerNames((prevNames) => ({ ...prevNames, [symbol]: newName }));
  }

  return (
    <main>
      <div id="game-container">
        <GameModeControls settings={settings} onChange={handleSettingsChange} />
        <ol id="players" className="highlight-player">
          {SYMBOLS.map((symbol) => (
            <Player
              key={symbol}
              name={displayNames[symbol]}
              defaultName={DEFAULT_PLAYER_NAMES[symbol]}
              symbol={symbol}
              isActive={!isGameOver && activePlayer === symbol}
              isComputer={vsComputer && symbol === COMPUTER_SYMBOL}
              onChangeName={handlePlayerNameChange}
            />
          ))}
        </ol>
        {isGameOver && <GameOver winner={winnerName} onRestart={handleRestart} />}
        <GameBoard
          onSelectSquare={handleSelectSquare}
          board={gameBoard}
          disabled={isGameOver || isComputerTurn}
          winningLine={status.state === "won" ? status.line : null}
        />
        <Scoreboard
          scores={scores}
          playerNames={displayNames}
          canStartNewGame={gameTurns.length > 0}
          onNewGame={handleRestart}
          onResetScores={handleResetScores}
        />
      </div>
      <Log turns={gameTurns} />
    </main>
  );
}

export default App;
