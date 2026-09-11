// 本项目中定义常量的位置

export const earthRadiusKm: number = 6378.135; // 地球平均半径（km）
export const earthRadiusM = earthRadiusKm * 1000; // 地球平均半径（m）
export const mu = 398600.8; // 地球引力常数 [km^3/s^2]
export const j2 = 1.08262668e-3; // 地球 J2 扁率摄动系数（用于 RAAN 节点进动修正）
export const earthFlattening = 1 / 298.257223563; // 地球扁率
export const earthEccentricitySquared = 2 * earthFlattening - earthFlattening * earthFlattening; // 地球偏心率平方
export const geoAltitudeKm = 35786; // 同步轨道高度（km）
export const auKm = 149597870.7; // 天文单位（km）
export const jdUnixEpoch = 2440587.5; // Unix 纪元对应的儒略日
export const msPerDay = 86400000; // 一天的毫秒数
