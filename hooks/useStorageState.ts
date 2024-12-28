import { useEffect, useCallback, useReducer } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

function useAsyncState<T>(
  initialValue: [boolean, T | null] = [true, null],
): UseStateHook<T> {
  return useReducer(
    (state: [boolean, T | null], action: T | null = null): [boolean, T | null] => [false, action],
    initialValue
  ) as UseStateHook<T>;
}

export async function setStorageItemAsync<T>(key: string, value: T | null) {
  const serializedValue = value ? JSON.stringify(value) : null;
  if (Platform.OS === 'web') {
    try {
      if (serializedValue === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, serializedValue);
      }
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    if (serializedValue == null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, serializedValue);
    }
  }
}

export function useStorageState<T>(key: string): UseStateHook<T> {
  const [state, setState] = useAsyncState<T>();

  useEffect(() => {
    const fetchValue = async () => {
      let value: T | null = null;
      if (Platform.OS === 'web') {
        try {
          const item = localStorage.getItem(key);
          value = item ? JSON.parse(item) : null;
        } catch (e) {
          console.error('Local storage is unavailable:', e);
        }
      } else {
        const item = await SecureStore.getItemAsync(key);
        value = item ? JSON.parse(item) : null;
      }
      setState(value);
    };

    fetchValue();
  }, [key]);

  const setValue = useCallback(
    (value: T | null) => {
      setState(value);
      setStorageItemAsync(key, value);
    },
    [key],
  );

  return [state, setValue];
}
