interface ExportOntologySpaceFileNameInput {
  contentDisposition: string;
  contentType: string;
  apiName: string;
  spaceId: number;
}

/**
 * @description 从 Content-Disposition 中取出文件名。
 * @param contentDisposition 响应头原文。
 * @returns 解码后的文件名；没有可用文件名时返回空字符串。
 */
function readDispositionFileName(contentDisposition: string): string {
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/["']/g, ""));
    } catch {
      return "";
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(contentDisposition);
  if (quoted?.[1]) return quoted[1].trim();
  const plain = /filename=([^;]+)/i.exec(contentDisposition);
  return plain?.[1]?.trim().replace(/^"|"$/g, "") ?? "";
}

/**
 * @description 去掉文件名中的路径分隔符。
 * @param fileName 原始文件名。
 * @returns 可作为下载名的文件名；无效时返回空字符串。
 */
function sanitizeExportFileName(fileName: string): string {
  const name = fileName.replace(/[\\/]/g, "").trim();
  if (!name || name === "." || name === "..") return "";
  return name;
}

/**
 * @description 在响应头没有文件名时，用空间 API 名称和内容类型生成下载名。
 * @param apiName 空间 API 名称。
 * @param spaceId 空间 id。
 * @param contentType 响应 Content-Type。
 * @returns 备用下载文件名。
 */
function buildFallbackExportFileName(apiName: string, spaceId: number, contentType: string): string {
  const base = apiName.trim() || `ontology-space-${spaceId}`;
  if (/json/i.test(contentType)) return `${base}.json`;
  if (/zip/i.test(contentType)) return `${base}.zip`;
  return base;
}

/**
 * @description 决定本体空间导出文件的下载名。
 * @param input 响应头与当前空间信息。
 * @returns 用于浏览器下载的文件名。
 */
export function resolveExportOntologySpaceFileName(input: ExportOntologySpaceFileNameInput): string {
  const fromHeader = sanitizeExportFileName(readDispositionFileName(input.contentDisposition));
  if (fromHeader) return fromHeader;
  return buildFallbackExportFileName(input.apiName, input.spaceId, input.contentType);
}
