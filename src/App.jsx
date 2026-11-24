import { useState } from "react";
import Player from "./components/Player";
import GameBoard from "./components/GameBoard";
import Log from "./components/Log";
import GameOver from "./components/GameOver";
import {
  deriveActivePlayer,
  deriveBoard,
  getGameStatus,
  isValidMove,
} from "./game/engine";

const DEFAULT_PLAYER_NAMES = {
  X: "Player 1",
  O: "Player 2",
};

function App() {
  const [gameTurns, setGameTurns] = useState([]);
  const [playerNames, setPlayerNames] = useState(DEFAULT_PLAYER_NAMES);

  const activePlayer = deriveActivePlayer(gameTurns);
  const gameBoard = deriveBoard(gameTurns);
  const status = getGameStatus(gameBoard);
  const isGameOver = status.state !== "playing";
  const winnerName = status.state === "won" ? playerNames[status.winner] : null;

  function handleSelectSquare(row, col) {
    setGameTurns((prevTurns) => {
      if (!isValidMove(deriveBoard(prevTurns), row, col)) {
        return prevTurns;
      }
      const player = deriveActivePlayer(prevTurns);
      return [{ square: { row, col }, player }, ...prevTurns];
    });
  }

  function handleRestart() {
    setGameTurns([]);
  }

  function handlePlayerNameChange(symbol, newName) {
    setPlayerNames((prevNames) => ({ ...prevNames, [symbol]: newName }));
  }

  return (
    <main>
      <div id="game-container">
        <ol id="players" className="highlight-player">
          {["X", "O"].map((symbol) => (
            <Player
              key={symbol}
              initialName={DEFAULT_PLAYER_NAMES[symbol]}
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
      </div>
      <Log turns={gameTurns} />
    </main>
  );
}

export default App;
