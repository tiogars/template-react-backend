import { useEffect, useState } from 'react';

export function usePersistentState<T extends string>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(
    () => (window.localStorage.getItem(key) as T | null) ?? defaultValue,
  );

  useEffect(() => {
    window.localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}