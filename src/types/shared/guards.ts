export type StorageGuard<T> = (value: unknown) => value is T;
