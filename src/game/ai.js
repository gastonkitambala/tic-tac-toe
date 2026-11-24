import { getAvailableMoves, getWinner } from "./engine";

/**
 * Computer opponent.
 *
 *   easy   – picks a random empty square.
 *   medium – wins if it can, otherwise blocks, otherwise takes the center,
 *            otherwise plays randomly. Beatable with a fork.
 *   hard   – minimax with alpha-beta pruning. Never loses on 3x3.
 *
 * All functions are pure; randomness is injected (`rng`) so tests are
 * reproducible.
 */
export const DIFFICULTIES = ["easy", "medium", "hard"];

const opponentOf = (symbol) => (symbol === "X" ? "O" : "X");

function pickRandom(items, rng) {
  return items[Math.floor(rng() * items.length)];
}

function withMove(board, { row, col }, symbol) {
  const next = board.map((r) => [...r]);
  next[row][col] = symbol;
  return next;
}

function findWinningMove(board, symbol, moves) {
  return moves.find((m) => getWinner(withMove(board, m, symbol))?.symbol === symbol);
}

function chooseMedium(board, symbol, moves, rng) {
  const center = Math.floor(board.length / 2);
  return (
    findWinningMove(board, symbol, moves) ??
    findWinningMove(board, opponentOf(symbol), moves) ??
    moves.find((m) => m.row === center && m.col === center) ??
    pickRandom(moves, rng)
  );
}

/**
 * Scores `board` from `me`'s point of view, with `toMove` about to play.
 * Wins score higher the sooner they happen (and losses the later), so the
 * AI finishes games quickly and resists for as long as possible.
 */
function minimax(board, me, toMove, depth, alpha, beta) {
  const winner = getWinner(board);
  if (winner) return winner.symbol === me ? 10 - depth : depth - 10;

  const moves = getAvailableMoves(board);
  if (moves.length === 0) return 0;

  const maximizing = toMove === me;
  let best = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const score = minimax(withMove(board, move, toMove), me, opponentOf(toMove), depth + 1, alpha, beta);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break; // the other player will never allow this line
  }
  return best;
}

function chooseHard(board, symbol, moves, rng) {
  // Score every root move with a full window so equally good moves tie
  // exactly; then pick among them at random to keep games varied.
  const scored = moves.map((move) => ({
    move,
    score: minimax(withMove(board, move, symbol), symbol, opponentOf(symbol), 1, -Infinity, Infinity),
  }));
  const bestScore = Math.max(...scored.map((s) => s.score));
  return pickRandom(
    scored.filter((s) => s.score === bestScore).map((s) => s.move),
    rng
  );
}

/**
 * Returns the square `symbol` should play, or null if the game is over.
 * @param {(string|null)[][]} board
 * @param {"X"|"O"} symbol
 * @param {"easy"|"medium"|"hard"} difficulty
 * @param {() => number} [rng] returns a number in [0, 1)
 */
export function chooseMove(board, symbol, difficulty, rng = Math.random) {
  if (!DIFFICULTIES.includes(difficulty)) {
    throw new Error(`Unknown difficulty: ${difficulty}`);
  }
  if (getWinner(board)) return null;

  const moves = getAvailableMoves(board);
  if (moves.length === 0) return null;

  switch (difficulty) {
    case "easy":
      return pickRandom(moves, rng);
    case "medium":
      return chooseMedium(board, symbol, moves, rng);
    default:
      return chooseHard(board, symbol, moves, rng);
  }
}
