import * as THREE from "three";

/** 创建径向光晕纹理（三维节点装饰）。 */
export function createGlowTexture(color = "#07eaff", size = 128): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.35, `${color}88`);
  gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** 创建节点文字标签纹理（标题 + 副标题）。 */
export function createLabelTexture(title: string, subtitle = "", color = "#eaf1f8"): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.font = "600 34px sans-serif";
  ctx.fillText(title, canvas.width / 2, subtitle ? 58 : 80);
  if (subtitle) {
    ctx.fillStyle = "#a9c6d3";
    ctx.font = "400 22px sans-serif";
    ctx.fillText(subtitle, canvas.width / 2, 108);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
