/** 生成 UUID v4 所需的随机字节源。 */
export interface UuidRandomSource {
  getRandomValues(array: Uint8Array): Uint8Array;
}

/**
 * @description 使用 `getRandomValues` 生成 UUID v4，兼容 Chrome 90+ 和非安全上下文。
 * @param randomSource 可选随机源，测试可注入；默认使用 `globalThis.crypto`。
 * @returns RFC 4122 UUID v4 字符串。
 */
export function generateUuidV4(randomSource?: UuidRandomSource): string {
  const cryptoApi = randomSource ?? globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
    throw new Error("当前环境不支持生成会话 id。");
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  const versionByte = bytes[6];
  const variantByte = bytes[8];
  if (versionByte === undefined || variantByte === undefined) {
    throw new Error("当前环境不支持生成会话 id。");
  }
  bytes[6] = (versionByte & 0x0f) | 0x40;
  bytes[8] = (variantByte & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
