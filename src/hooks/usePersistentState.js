import { useCallback, useEffect, useState } from "react";

/** Bump the version when a stored shape changes incompatibly. */
export const STORAGE_PREFIX = "tic-tac-toe:v1:";

function parseStored(raw, initialValue, validate) {
  if (raw === null) return initialValue;
  try {
    const parsed = JSON.parse(raw);
    return validate && !validate(parsed) ? initialValue : parsed;
  } catch {
    return initialValue; // corrupt JSON
  }
}

function readStored(storageKey, initialValue, validate) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return parseStored(raw, initialValue, validate);
  } catch {
    return initialValue; // storage unavailable (e.g. privacy mode)
  }
}

/**
 * Like useState, but persisted to localStorage and kept in sync across tabs.
 *
 * @param {string} key            Storage key (prefixed and versioned).
 * @param {*} initialValue        Used when nothing valid is stored.
 * @param {{ validate?: (value: unknown) => boolean }} [options]
 *   validate: reject stored values that don't have the expected shape.
 */
export function usePersistentState(key, initialValue, { validate } = {}) {
  const storageKey = STORAGE_PREFIX + key;
  const [value, setValue] = useState(() =>
    readStored(storageKey, initialValue, validate)
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage unavailable: keep working in memory.
    }
  }, [storageKey, value]);

  // Another tab changed or cleared this key.
  // initialValue and validate are read when the event fires; callers usually
  // pass inline values, so they are deliberately left out of the deps.
  const onStorage = useCallback(
    (event) => {
      if (event.key !== storageKey) return;
      setValue(parseStored(event.newValue, initialValue, validate));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey]
  );

  useEffect(() => {
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [onStorage]);

  return [value, setValue];
}
