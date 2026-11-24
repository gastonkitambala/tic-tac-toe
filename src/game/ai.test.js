import { describe, it, expect } from "vitest";
import { chooseMove, DIFFICULTIES } from "./ai";
import { createEmptyBoard, getAvailableMoves, getWinner } from "./engine";

function board(str) {
  return str.split("|").map((row) => [...row].map((c) => (c === "." ? null : c)));
}

/** Deterministic pseudo-random source for reproducible tests. */
function seededRng(seed = 1) {
  let s = seed;
  const next = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  // Small seeds give near-zero first outputs; discard a few to mix them.
  for (let i = 0; i < 5; i++) next();
  return next;
}

const other = (symbol) => (symbol === "X" ? "O" : "X");

describe("chooseMove", () => {
  it("exposes the supported difficulties", () => {
    expect(DIFFICULTIES).toEqual(["easy", "medium", "hard"]);
  });

  it.each(DIFFICULTIES)("%s returns an empty, in-bounds square", (difficulty) => {
    const b = board("XO.|.X.|O..");
    for (let seed = 1; seed <= 20; seed++) {
      const move = chooseMove(b, "X", difficulty, seededRng(seed));
      expect(getAvailableMoves(b)).toContainEqual(move);
    }
  });

  it.each(DIFFICULTIES)("%s returns null when the board is full", (difficulty) => {
    expect(chooseMove(board("XOX|XOO|OXX"), "X", difficulty)).toBeNull();
  });

  it.each(DIFFICULTIES)("%s returns null when the game is already won", (difficulty) => {
    expect(chooseMove(board("XXX|OO.|..."), "O", difficulty)).toBeNull();
  });

  it("rejects unknown difficulties", () => {
    expect(() => chooseMove(createEmptyBoard(), "X", "impossible")).toThrow();
  });

  it("easy plays different moves for different random seeds", () => {
    const moves = new Set();
    for (let seed = 1; seed <= 30; seed++) {
      const m = chooseMove(createEmptyBoard(), "X", "easy", seededRng(seed));
      moves.add(`${m.row},${m.col}`);
    }
    expect(moves.size).toBeGreaterThan(3);
  });

  describe.each(["medium", "hard"])("%s", (difficulty) => {
    it("takes an immediate win", () => {
      // O can win at (1,2); X threatens (0,2) too — winning beats blocking.
      expect(chooseMove(board("XX.|OO.|X.."), "O", difficulty)).toEqual({ row: 1, col: 2 });
    });

    it("blocks the opponent's immediate win", () => {
      expect(chooseMove(board("XX.|O..|..."), "O", difficulty)).toEqual({ row: 0, col: 2 });
    });
  });

  it("medium takes the center when there is nothing to win or block", () => {
    expect(chooseMove(board("X..|...|..."), "O", "medium")).toEqual({ row: 1, col: 1 });
  });

  it("hard answers a corner opening with the center", () => {
    // Every non-center reply to a corner opening loses with best play.
    for (let seed = 1; seed <= 10; seed++) {
      expect(chooseMove(board("X..|...|..."), "O", "hard", seededRng(seed))).toEqual({
        row: 1,
        col: 1,
      });
    }
  });

  it("hard prefers the fastest win", () => {
    // O wins now at (2,2); it must not play a slower winning line instead.
    expect(chooseMove(board("OX.|XO.|X.."), "O", "hard")).toEqual({ row: 2, col: 2 });
  });

  it("hard sets up a fork when one is available", () => {
    // X: (0,0),(1,1)  O: (0,1),(2,2). No immediate win for either side,
    // but X can fork by playing (1,0) or (2,0), creating two threats.
    const b = board("XO.|.X.|..O");
    const move = chooseMove(b, "X", "hard");
    b[move.row][move.col] = "X";
    // After X's move, X must have two open winning threats (a fork).
    const threats = getAvailableMoves(b).filter(({ row, col }) => {
      const copy = b.map((r) => [...r]);
      copy[row][col] = "X";
      return getWinner(copy)?.symbol === "X";
    });
    expect(threats.length).toBeGreaterThanOrEqual(2);
  });
});

/**
 * Plays every possible game against the hard AI: at each opponent turn,
 * branch on every legal move. Returns counts of outcomes.
 */
function exhaustivePlay(aiSymbol, difficulty = "hard") {
  const results = { aiWins: 0, draws: 0, aiLosses: 0 };

  function play(b, toMove) {
    const winner = getWinner(b);
    if (winner) {
      results[winner.symbol === aiSymbol ? "aiWins" : "aiLosses"]++;
      return;
    }
    const moves = getAvailableMoves(b);
    if (moves.length === 0) {
      results.draws++;
      return;
    }
    if (toMove === aiSymbol) {
      const { row, col } = chooseMove(b, aiSymbol, difficulty, seededRng(7));
      const next = b.map((r) => [...r]);
      next[row][col] = aiSymbol;
      play(next, other(toMove));
    } else {
      for (const { row, col } of moves) {
        const next = b.map((r) => [...r]);
        next[row][col] = toMove;
        play(next, other(toMove));
      }
    }
  }

  play(createEmptyBoard(), "X");
  return results;
}

describe("hard AI is unbeatable", () => {
  it("never loses when playing second (O)", () => {
    const results = exhaustivePlay("O");
    expect(results.aiLosses).toBe(0);
    expect(results.aiWins + results.draws).toBeGreaterThan(0);
  });

  it("never loses when playing first (X)", () => {
    const results = exhaustivePlay("X");
    expect(results.aiLosses).toBe(0);
  });

  it("the harness detects losses: medium can be beaten", () => {
    // Guards against the exhaustive check above passing vacuously.
    expect(exhaustivePlay("O", "medium").aiLosses).toBeGreaterThan(0);
  });
});
