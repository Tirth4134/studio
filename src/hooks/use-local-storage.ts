
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, defaultValue: T): [T, SetValue<T>] {
  const [value, setValue] = useState<T>(defaultValue);

  // Effect to read from localStorage once on the client after mount
  useEffect(() => {
    // This check ensures localStorage is accessed only on the client side
    // and after the initial render to prevent hydration mismatch.
    if (typeof window !== "undefined") {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setValue(JSON.parse(item));
        }
        // If no item in localStorage, `value` remains `defaultValue`.
        // The consuming component (e.g., HomePage) has logic to populate
        // `initialInventory` if the inventory is still empty after this.
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        // If error, value remains defaultValue.
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only re-run if key changes (it's static in this app's usage)

  // Effect to write to localStorage when value changes, only on client
  useEffect(() => {
    // This check ensures localStorage is accessed only on the client side.
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
