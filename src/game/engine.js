/**
 * Pure tic-tac-toe game logic. No React, no side effects.
 *
 * Shapes:
 *   Symbol  = "X" | "O"
 *   Board   = (Symbol | null)[][]            (square, size x size)
 *   Square  = { row: number, col: number }
 *   Turn    = { square: Square, player: Symbol }
 *   Turns are stored newest-first.
 */

export const SYMBOLS = ["X", "O"];
export const DEFAULT_SIZE = 3;

export function createEmptyBoard(size = DEFAULT_SIZE) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

const linesCache = new Map();

/** All rows, columns and both diagonals for a size x size board. */
export function getWinningLines(size = DEFAULT_SIZE) {
  if (linesCache.has(size)) return linesCache.get(size);

  const indices = [...Array(size).keys()];
  const lines = [
    ...indices.map((row) => indices.map((col) => ({ row, col }))),
    ...indices.map((col) => indices.map((row) => ({ row, col }))),
    indices.map((i) => ({ row: i, col: i })),
    indices.map((i) => ({ row: i, col: size - 1 - i })),
  ];

  linesCache.set(size, lines);
  return lines;
}

export function deriveBoard(turns, size = DEFAULT_SIZE) {
  const board = createEmptyBoard(size);
  for (const { square, player } of turns) {
    board[square.row][square.col] = player;
  }
  return board;
}

export function deriveActivePlayer(turns) {
  return turns.length > 0 && turns[0].player === "X" ? "O" : "X";
}

/** Returns { symbol, line } for the first complete line, or null. */
export function getWinner(board) {
  for (const line of getWinningLines(board.length)) {
    const first = board[line[0].row][line[0].col];
    if (first && line.every(({ row, col }) => board[row][col] === first)) {
      return { symbol: first, line };
    }
  }
  return null;
}

export function getAvailableMoves(board) {
  const moves = [];
  board.forEach((row, rowIndex) =>
    row.forEach((cell, colIndex) => {
      if (cell === null) moves.push({ row: rowIndex, col: colIndex });
    })
  );
  return moves;
}

export function isDraw(board) {
  return getAvailableMoves(board).length === 0 && !getWinner(board);
}

export function isValidMove(board, row, col) {
  const size = board.length;
  if (row < 0 || col < 0 || row >= size || col >= size) return false;
  return board[row][col] === null && !getWinner(board);
}

/**
 * { state: "playing" }
 * { state: "won", winner: Symbol, line: Square[] }
 * { state: "draw" }
 */
export function getGameStatus(board) {
  const win = getWinner(board);
  if (win) return { state: "won", winner: win.symbol, line: win.line };
  if (getAvailableMoves(board).length === 0) return { state: "draw" };
  return { state: "playing" };
}
