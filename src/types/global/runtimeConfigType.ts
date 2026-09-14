import type { MapConfig } from "../map/configType";

declare global {
  /** 部署时由 `/configs/mapConfig.js` 注入的 Mars3D 地图配置。 */
  const MAP_CONFIG: MapConfig;
}

export {};
