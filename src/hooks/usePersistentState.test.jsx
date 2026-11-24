// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePersistentState, STORAGE_PREFIX } from "./usePersistentState";

const KEY = "test-key";
const STORED_KEY = STORAGE_PREFIX + KEY;

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("usePersistentState", () => {
  it("uses the initial value when nothing is stored", () => {
    const { result } = renderHook(() => usePersistentState(KEY, { a: 1 }));
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it("restores a previously stored value", () => {
    localStorage.setItem(STORED_KEY, JSON.stringify({ a: 2 }));
    const { result } = renderHook(() => usePersistentState(KEY, { a: 1 }));
    expect(result.current[0]).toEqual({ a: 2 });
  });

  it("writes updates to localStorage, including updater functions", () => {
    const { result } = renderHook(() => usePersistentState(KEY, 0));
    act(() => result.current[1](5));
    expect(JSON.parse(localStorage.getItem(STORED_KEY))).toBe(5);
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(6);
    expect(JSON.parse(localStorage.getItem(STORED_KEY))).toBe(6);
  });

  it("falls back to the initial value on corrupt JSON", () => {
    localStorage.setItem(STORED_KEY, "{not json");
    const { result } = renderHook(() => usePersistentState(KEY, "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  it("falls back when the validator rejects the stored value", () => {
    localStorage.setItem(STORED_KEY, JSON.stringify("bad"));
    const { result } = renderHook(() =>
      usePersistentState(KEY, 1, { validate: (v) => typeof v === "number" })
    );
    expect(result.current[0]).toBe(1);
  });

  it("keeps working in memory when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const { result } = renderHook(() => usePersistentState(KEY, 1));
    expect(result.current[0]).toBe(1);
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(2);
  });

  it("syncs when another tab changes the value", () => {
    const { result } = renderHook(() => usePersistentState(KEY, 0));
    act(() => {
      localStorage.setItem(STORED_KEY, JSON.stringify(42));
      window.dispatchEvent(
        new StorageEvent("storage", { key: STORED_KEY, newValue: JSON.stringify(42) })
      );
    });
    expect(result.current[0]).toBe(42);
  });

  it("resets to the initial value when another tab clears it", () => {
    localStorage.setItem(STORED_KEY, JSON.stringify(9));
    const { result } = renderHook(() => usePersistentState(KEY, 0));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORED_KEY, newValue: null }));
    });
    expect(result.current[0]).toBe(0);
  });
});
