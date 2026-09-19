import type { MapConfig } from "../map/configType";

declare global {
  interface DomainConfig {
    readonly ontology_server: string;
    readonly MAP_SERVER_WMTS_URL: string;
    readonly MAP_SERVER_TMS_URL: string;
    readonly OCEAN_SERVER_URL: string;
    readonly OCEAN_ANALYSIS_SERVER_URL: string;
    readonly LOGIN_URL: string;
    readonly ONTOLOGYMANAGE_URL: string;
  }

  interface SystemConfig {
    readonly systemTitle: string;
    readonly version: string;
  }

  /** 部署时由 `/configs/domainConfig.js` 注入的后端服务地址配置。 */
  const DOMAIN_CONFIG: DomainConfig;

  /** 部署时由 `/configs/mapConfig.js` 注入的 Mars3D 地图配置。 */
  const MAP_CONFIG: MapConfig;

  /** 部署时由 `/configs/systemConfig.js` 注入的系统展示配置。 */
  const SYSTEM_CONFIG: SystemConfig;
}

export {};
