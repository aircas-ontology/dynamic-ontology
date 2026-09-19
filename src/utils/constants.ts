// 本项目中定义常量的位置

export const earthRadiusKm: number = 6378.135; // 地球平均半径（km）
export const earthRadiusM: number = earthRadiusKm * 1000; // 地球平均半径（m）
export const mu: number = 398600.8; // 地球引力常数 [km^3/s^2]
export const j2: number = 1.08262668e-3; // 地球 J2 扁率摄动系数（用于 RAAN 节点进动修正）
export const earthFlattening: number = 1 / 298.257223563; // 地球扁率
export const earthEccentricitySquared: number = 2 * earthFlattening - earthFlattening * earthFlattening; // 地球偏心率平方
export const geoAltitudeKm: number = 35786; // 同步轨道高度（km）
export const auKm: number = 149597870.7; // 天文单位（km）
export const jdUnixEpoch: number = 2440587.5; // Unix 纪元对应的儒略日
export const msPerDay: number = 86400000; // 一天的毫秒数
export const relationCategoryPredefineColors: string[] = ["#4dd2ff", "#269cff", "#9272ff", "#20d99a", "#ff9f43", "#07eaff"]; // 关系分类颜色选择器预设色
export const requestTimeoutMs: number = 10000; // 接口请求超时时间（毫秒）
