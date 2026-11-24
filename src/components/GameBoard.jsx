export default function GameBoard({
  onSelectSquare,
  board,
  disabled = false,
  winningLine = null,
}) {
  const isWinningSquare = (row, col) =>
    winningLine?.some((sq) => sq.row === row && sq.col === col) ?? false;

  return (
    <ol id="game-board">
      {board.map((row, rowIndex) => (
        <li key={rowIndex}>
          <ol>
            {row.map((playerSymbol, colIndex) => (
              <li key={colIndex}>
                <button
                  className={
                    isWinningSquare(rowIndex, colIndex) ? "winning" : undefined
                  }
                  onClick={() => onSelectSquare(rowIndex, colIndex)}
                  disabled={disabled || playerSymbol !== null}
                  aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}${
                    playerSymbol ? `: ${playerSymbol}` : ""
                  }`}
                >
                  {playerSymbol}
                </button>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
