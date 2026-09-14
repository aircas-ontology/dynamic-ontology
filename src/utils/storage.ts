import type { StorageGuard } from "@/types";

export type StorageOperation = "get" | "remove" | "set";

export class StorageError extends Error {
  readonly operation: StorageOperation;

  constructor(operation: StorageOperation) {
    super(`无法${operation === "get" ? "读取" : operation === "set" ? "写入" : "删除"}本地存储数据。`);
    this.name = "StorageError";
    this.operation = operation;
  }
}

function resolveStorage(operation: StorageOperation, storage?: Storage): Storage {
  if (storage) return storage;
  if (typeof window === "undefined" || !window.localStorage) {
    throw new StorageError(operation);
  }

  return window.localStorage;
}

export function setStorage(name: string, value: unknown, storage?: Storage): void {
  try {
    const serializedValue = JSON.stringify(value);

    if (serializedValue === undefined) {
      throw new StorageError("set");
    }

    resolveStorage("set", storage).setItem(name, serializedValue);
  } catch (error: unknown) {
    if (error instanceof StorageError) throw error;
    throw new StorageError("set");
  }
}

export function getStorage<T>(
  name: string,
  isValue: StorageGuard<T>,
  storage?: Storage,
): T | null;
export function getStorage(name: string, isValue?: undefined, storage?: Storage): unknown | null;
export function getStorage<T>(
  name: string,
  isValue?: StorageGuard<T>,
  storage?: Storage,
): T | unknown | null {
  try {
    const storedValue = resolveStorage("get", storage).getItem(name);

    if (storedValue === null) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (isValue && !isValue(parsedValue)) {
      throw new StorageError("get");
    }

    return parsedValue;
  } catch (error: unknown) {
    if (error instanceof StorageError) throw error;
    throw new StorageError("get");
  }
}

export function removeStorage(name: string, storage?: Storage): void {
  try {
    resolveStorage("remove", storage).removeItem(name);
  } catch (error: unknown) {
    if (error instanceof StorageError) throw error;
    throw new StorageError("remove");
  }
}
