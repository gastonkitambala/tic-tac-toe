import Player from "./components/Player";
import GameBoard from "./components/GameBoard";
import Log from "./components/Log";
import GameOver from "./components/GameOver";
import Scoreboard from "./components/Scoreboard";
import { usePersistentState } from "./hooks/usePersistentState";
import {
  SYMBOLS,
  deriveActivePlayer,
  deriveBoard,
  getGameStatus,
  isValidMove,
  isValidTurnHistory,
} from "./game/engine";

const DEFAULT_PLAYER_NAMES = {
  X: "Player 1",
  O: "Player 2",
};

const EMPTY_SCORES = { X: 0, O: 0, draws: 0 };

const isCount = (n) => Number.isInteger(n) && n >= 0;

const isValidScores = (s) =>
  s !== null && typeof s === "object" && isCount(s.X) && isCount(s.O) && isCount(s.draws);

const isValidPlayerNames = (names) =>
  names !== null &&
  typeof names === "object" &&
  SYMBOLS.every((symbol) => typeof names[symbol] === "string" && names[symbol].trim());

function App() {
  const [gameTurns, setGameTurns] = usePersistentState("turns", [], {
    validate: isValidTurnHistory,
  });
  const [playerNames, setPlayerNames] = usePersistentState(
    "playerNames",
    DEFAULT_PLAYER_NAMES,
    { validate: isValidPlayerNames }
  );
  const [scores, setScores] = usePersistentState("scores", EMPTY_SCORES, {
    validate: isValidScores,
  });

  const activePlayer = deriveActivePlayer(gameTurns);
  const gameBoard = deriveBoard(gameTurns);
  const status = getGameStatus(gameBoard);
  const isGameOver = status.state !== "playing";
  const winnerName = status.state === "won" ? playerNames[status.winner] : null;

  function handleSelectSquare(row, col) {
    // Computed from the rendered state rather than inside a state updater:
    // updaters must be pure (StrictMode runs them twice), and finishing a
    // game also updates the scores.
    if (!isValidMove(gameBoard, row, col)) return;

    const nextTurns = [{ square: { row, col }, player: activePlayer }, ...gameTurns];
    setGameTurns(nextTurns);

    const nextStatus = getGameStatus(deriveBoard(nextTurns));
    if (nextStatus.state === "won") {
      setScores((prev) => ({ ...prev, [nextStatus.winner]: prev[nextStatus.winner] + 1 }));
    } else if (nextStatus.state === "draw") {
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
    }
  }

  function handleRestart() {
    setGameTurns([]);
  }

  function handleResetScores() {
    setScores(EMPTY_SCORES);
  }

  function handlePlayerNameChange(symbol, newName) {
    setPlayerNames((prevNames) => ({ ...prevNames, [symbol]: newName }));
  }

  return (
    <main>
      <div id="game-container">
        <ol id="players" className="highlight-player">
          {SYMBOLS.map((symbol) => (
            <Player
              key={symbol}
              name={playerNames[symbol]}
              defaultName={DEFAULT_PLAYER_NAMES[symbol]}
              symbol={symbol}
              isActive={!isGameOver && activePlayer === symbol}
              onChangeName={handlePlayerNameChange}
            />
          ))}
        </ol>
        {isGameOver && <GameOver winner={winnerName} onRestart={handleRestart} />}
        <GameBoard
          onSelectSquare={handleSelectSquare}
          board={gameBoard}
          disabled={isGameOver}
          winningLine={status.state === "won" ? status.line : null}
        />
        <Scoreboard
          scores={scores}
          playerNames={playerNames}
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
