import type { EcfVec3, EciVec3 } from "satellite.js";

export interface EciState {
  /** 地心惯性坐标系位置，单位为千米。 */
  posEci: EciVec3<number>;
  /** 地心惯性坐标系速度，单位为千米/秒。 */
  velEci: EciVec3<number>;
}

export interface EcefState {
  /** 地心地固坐标系位置，单位为千米。 */
  posEcf: EcfVec3<number>;
  /** 地心地固坐标系速度，单位为千米/秒。 */
  velEcf: EcfVec3<number>;
}

export interface SatelliteState extends EciState, EcefState {
  /** 状态时刻的本地格式化文本。 */
  time: string;
  /** 状态时刻的 Unix 毫秒时间戳。 */
  timeMs: number;
  /** NORAD 卫星编号；底层数据未提供时为 null。 */
  noradID: string | null;
  /** 卫星显示名称，允许为空字符串。 */
  name: string;
  /** 经度，单位为度，范围为 -180 至 180。 */
  lon: number;
  /** 纬度，单位为度，范围为 -90 至 90。 */
  lat: number;
  /** 椭球高，单位为米。 */
  altm: number;
  /** 椭球高，单位为千米。 */
  altKm: number;
  /** 相对正北方向的航向角，单位为度，范围为 0 至 360。 */
  headingDeg: number;
}
