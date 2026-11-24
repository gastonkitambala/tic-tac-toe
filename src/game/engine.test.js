import { describe, it, expect } from "vitest";
import {
  createEmptyBoard,
  getWinningLines,
  deriveBoard,
  deriveActivePlayer,
  getWinner,
  isDraw,
  getAvailableMoves,
  getGameStatus,
  isValidMove,
} from "./engine";

// Helper: build a board from a compact string like "XO.|.X.|..O"
function board(str) {
  return str.split("|").map((row) => [...row].map((c) => (c === "." ? null : c)));
}

describe("createEmptyBoard", () => {
  it("creates a 3x3 board of nulls by default", () => {
    expect(createEmptyBoard()).toEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
  });

  it("creates an NxN board", () => {
    const b = createEmptyBoard(4);
    expect(b).toHaveLength(4);
    b.forEach((row) => expect(row).toEqual([null, null, null, null]));
  });

  it("returns independent rows", () => {
    const b = createEmptyBoard();
    b[0][0] = "X";
    expect(b[1][0]).toBeNull();
  });
});

describe("getWinningLines", () => {
  it("returns 8 lines for 3x3", () => {
    expect(getWinningLines(3)).toHaveLength(8);
  });

  it("returns 2n + 2 lines for NxN", () => {
    expect(getWinningLines(4)).toHaveLength(10);
  });

  it("includes both diagonals", () => {
    const lines = getWinningLines(3);
    expect(lines).toContainEqual([
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
    ]);
    expect(lines).toContainEqual([
      { row: 0, col: 2 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
    ]);
  });
});

describe("deriveBoard", () => {
  it("returns an empty board for no turns", () => {
    expect(deriveBoard([])).toEqual(createEmptyBoard());
  });

  it("places each turn's symbol (turns are newest-first)", () => {
    const turns = [
      { square: { row: 1, col: 1 }, player: "O" },
      { square: { row: 0, col: 0 }, player: "X" },
    ];
    expect(deriveBoard(turns)).toEqual(board("X..|.O.|..."));
  });
});

describe("deriveActivePlayer", () => {
  it("is X on an empty game", () => {
    expect(deriveActivePlayer([])).toBe("X");
  });

  it("alternates based on the latest turn", () => {
    expect(deriveActivePlayer([{ square: { row: 0, col: 0 }, player: "X" }])).toBe("O");
    expect(
      deriveActivePlayer([
        { square: { row: 0, col: 1 }, player: "O" },
        { square: { row: 0, col: 0 }, player: "X" },
      ])
    ).toBe("X");
  });
});

describe("getWinner", () => {
  it("returns null for an empty board", () => {
    expect(getWinner(createEmptyBoard())).toBeNull();
  });

  it("detects a row win", () => {
    expect(getWinner(board("XXX|OO.|..."))).toEqual({
      symbol: "X",
      line: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ],
    });
  });

  it("detects a column win", () => {
    expect(getWinner(board("OX.|OX.|O.X"))?.symbol).toBe("O");
  });

  it("detects an anti-diagonal win", () => {
    expect(getWinner(board("O.X|OX.|X..")).symbol).toBe("X");
  });

  it("returns null when no line is complete", () => {
    expect(getWinner(board("XOX|XOO|OXX"))).toBeNull();
  });

  it("works on a 4x4 board", () => {
    expect(getWinner(board("O...|.O..|..O.|...O")).symbol).toBe("O");
  });
});

describe("isDraw", () => {
  it("is true for a full board with no winner", () => {
    expect(isDraw(board("XOX|XOO|OXX"))).toBe(true);
  });

  it("is false for a full board with a winner", () => {
    expect(isDraw(board("XXX|OOX|XOO"))).toBe(false);
  });

  it("is false for an incomplete board", () => {
    expect(isDraw(board("XO.|...|..."))).toBe(false);
  });
});

describe("getAvailableMoves", () => {
  it("lists empty squares in reading order", () => {
    expect(getAvailableMoves(board("XOX|O.X|OX."))).toEqual([
      { row: 1, col: 1 },
      { row: 2, col: 2 },
    ]);
  });
});

describe("isValidMove", () => {
  it("accepts an empty square in an ongoing game", () => {
    expect(isValidMove(board("X..|...|..."), 1, 1)).toBe(true);
  });

  it("rejects an occupied square", () => {
    expect(isValidMove(board("X..|...|..."), 0, 0)).toBe(false);
  });

  it("rejects any move after a win", () => {
    expect(isValidMove(board("XXX|OO.|..."), 2, 2)).toBe(false);
  });

  it("rejects out-of-bounds squares", () => {
    expect(isValidMove(createEmptyBoard(), 3, 0)).toBe(false);
    expect(isValidMove(createEmptyBoard(), 0, -1)).toBe(false);
  });
});

describe("getGameStatus", () => {
  it("reports in-progress games", () => {
    expect(getGameStatus(board("X..|...|..."))).toEqual({ state: "playing" });
  });

  it("reports wins with the winning line", () => {
    const status = getGameStatus(board("XXX|OO.|..."));
    expect(status.state).toBe("won");
    expect(status.winner).toBe("X");
    expect(status.line).toHaveLength(3);
  });

  it("reports draws", () => {
    expect(getGameStatus(board("XOX|XOO|OXX"))).toEqual({ state: "draw" });
  });
});
