import type { StorageGuard } from "@/types";

export function setStorage(name: string, value: unknown): void {
  window.localStorage.setItem(name, JSON.stringify(value));
}

export function getStorage<T>(
  name: string,
  isValue: StorageGuard<T>,
): T | false;
export function getStorage(name: string): unknown | false;
export function getStorage<T>(
  name: string,
  isValue?: StorageGuard<T>,
): T | unknown | false {
  try {
    const storedValue = window.localStorage.getItem(name);

    if (storedValue === null) {
      return false;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    return isValue ? (isValue(parsedValue) ? parsedValue : false) : parsedValue;
  } catch (error: unknown) {
    console.log(`get ${name} for error ${String(error)}`);
    return false;
  }
}

export function removeStorage(name: string): void {
  try {
    window.localStorage.removeItem(name);
  } catch (error: unknown) {
    console.log(error);
  }
}
