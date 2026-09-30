/**
 * @description 触发浏览器下载指定文件，并释放临时 URL。
 * @param fileName 下载文件名。
 * @param content 文件内容。
 */
export function downloadSpaceFile(fileName: string, content: Blob): void {
  const url = URL.createObjectURL(content);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * @description 下载本页生成的 JSON，并释放临时 URL。
 * @param fileName 下载文件名。
 * @param content JSON 文本。
 */
export function downloadSpaceJson(fileName: string, content: string): void {
  downloadSpaceFile(fileName, new Blob([content], { type: "application/json;charset=utf-8" }));
}
