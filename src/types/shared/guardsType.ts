/** 将未知的 Storage 解析结果收窄为指定业务类型。 */
export type StorageGuard<T> = (value: unknown) => value is T;
