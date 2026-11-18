import * as THREE from "three";
import { themeColor } from "./themeColor";

/**
 * @description 按 Canvas 实际文字宽度裁剪标签并补省略号。
 * @param ctx 输入参数。
 * @param text 输入参数。
 * @param maxWidth 输入参数。
 * @returns 处理结果。
 */
function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = "…";
  let result = text;
  while (result.length > 0 && ctx.measureText(`${result}${ellipsis}`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}${ellipsis}`;
}

/**
 * @description 将关系名称和辅助文字绘制为可释放的连线纹理。
 * @param title 输入参数。
 * @param subtitle 输入参数。
 * @param color 输入参数。
 * @param highlighted 输入参数。
 * @returns 处理结果。
 */
export function createRelationEdgeLabelTexture(title: string, subtitle: string, color: string, highlighted: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建边标签纹理上下文");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "600 20px sans-serif";
  ctx.fillStyle = color;
  ctx.globalAlpha = highlighted ? 0.95 : 0.48;
  ctx.fillText(ellipsize(ctx, title, 240), 128, 26);
  ctx.font = "500 15px sans-serif";
  ctx.globalAlpha = highlighted ? 0.85 : 0.38;
  ctx.fillText(ellipsize(ctx, subtitle, 240), 128, 50);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * @description 从当前主题分类令牌和次级文本色生成低饱和关系色。
 * @param index 分类色序号。
 * @returns Three.js 可识别的实际颜色。
 */
export function resolveSoftCategoryColor(index: number): string {
  const keys = [
    "--aircas-color-primary",
    "--aircas-color-category-blue",
    "--aircas-color-category-purple",
    "--aircas-color-success",
    "--aircas-color-warning",
    "--aircas-color-warning",
    "--aircas-color-primary",
  ] as const;
  const key = keys[index % keys.length] ?? keys[0];
  const base = themeColor(key);
  const muted = themeColor("--aircas-color-text-secondary");
  return mixHex(base, muted, 0.28);
}

/**
 * @description 按给定比例混合分类主色和次级文字色。
 * @param a 输入参数。
 * @param b 输入参数。
 * @param t 输入参数。
 * @returns 处理结果。
 */
function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa.r * (1 - t) + pb.r * t);
  const g = Math.round(pa.g * (1 - t) + pb.g * t);
  const bl = Math.round(pa.b * (1 - t) + pb.b * t);
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

/**
 * @description 解析三位或六位十六进制颜色。
 * @param value 输入参数。
 * @returns 处理结果。
 */
function parseHex(value: string): { r: number; g: number; b: number } | null {
  const raw = value.trim();
  if (!raw.startsWith("#") || (raw.length !== 7 && raw.length !== 4)) return null;
  if (raw.length === 4) {
    return {
      r: Number.parseInt(raw[1]! + raw[1]!, 16),
      g: Number.parseInt(raw[2]! + raw[2]!, 16),
      b: Number.parseInt(raw[3]! + raw[3]!, 16),
    };
  }
  return {
    r: Number.parseInt(raw.slice(1, 3), 16),
    g: Number.parseInt(raw.slice(3, 5), 16),
    b: Number.parseInt(raw.slice(5, 7), 16),
  };
}

/**
 * @description 将颜色分量编码为两位十六进制。
 * @param n 输入参数。
 * @returns 处理结果。
 */
function toHex(n: number): string {
  return n.toString(16).padStart(2, "0");
}
