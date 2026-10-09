import * as THREE from "three";
import { themeColor } from "./themeColor";

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = "…";
  let result = text;
  while (result.length > 0 && ctx.measureText(`${result}${ellipsis}`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}${ellipsis}`;
}

export function createRelationEdgeLabelTexture(
  title: string,
  subtitle: string,
  color: string,
  highlighted: boolean,
): THREE.CanvasTexture {
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

export function resolveSoftCategoryColor(index: number): string {
  const keys = [
    "--aircas-color-accent-cyan",
    "--aircas-color-accent-blue",
    "--aircas-color-accent-purple",
    "--aircas-color-accent-green",
    "--aircas-color-accent-orange",
    "--aircas-color-gold",
    "--aircas-color-border-highlight",
  ] as const;
  const key = keys[index % keys.length] ?? keys[0];
  const base = themeColor(key) || "#4dd2ff";
  const muted = themeColor("--aircas-color-text-muted") || "#9db6c8";
  return mixHex(base, muted, 0.28);
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa.r * (1 - t) + pb.r * t);
  const g = Math.round(pa.g * (1 - t) + pb.g * t);
  const bl = Math.round(pa.b * (1 - t) + pb.b * t);
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

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

function toHex(n: number): string {
  return n.toString(16).padStart(2, "0");
}
