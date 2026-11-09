/**
 * 杜威号轨迹预测算法（TS 移植自 src/example/forecast.js）。
 *
 * 职责：
 * 1. generateTrajectoryForecast —— 基于当前位置/航向/航速外推未来预测轨迹点
 *    （含分钟偏移、经纬度、航速、航向、误差半径）。航向做渐进转向（每次运行随机，
 *    保证预测结果每次不同），航速轻微衰减，误差半径随时间线性递增（台风式不确定性锥）。
 * 2. buildConeVertices —— 由预测点生成「误差扇区」（不确定性锥）包络顶点。
 *
 * 说明：因 AGENTS.md 2.3 禁止在 src/ 新增 .js 应用源码，故以 TS 移植，不直接 import forecast.js。
 */

const EARTH_RADIUS_KM = 6371;
const KM_PER_NAUTICAL_MILE = 1.852;

export interface TrajectoryForecastInput {
  longitude: number;
  latitude: number;
  heading: number;
  speedKnots: number;
  hours?: number;
  stepMinutes?: number;
  targetHeading?: number;
}

export interface TrajectoryForecastPoint {
  minutesFromStart: number;
  longitude: number;
  latitude: number;
  speedKnots: number;
  heading: number;
  errorRadiusNm: number;
  isHourlyNode: boolean;
}

const round = (value: number, digits: number): number => Number(value.toFixed(digits));
const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);
const normalizeHeading = (value: number): number => ((value % 360) + 360) % 360;

/** 由起点沿方位角前进 distKm，求终点（大圆正解，移植自 forecast.js）。 */
export const destPoint = (lat: number, lng: number, bearing: number, distKm: number): { lat: number; lng: number } => {
  const rad = Math.PI / 180;
  const delta = distKm / EARTH_RADIUS_KM;
  const theta = bearing * rad;
  const phi1 = lat * rad;
  const lambda1 = lng * rad;
  const sinPhi2 = Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta);
  const phi2 = Math.asin(sinPhi2);
  const lambda2 = lambda1 + Math.atan2(
    Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
    Math.cos(delta) - Math.sin(phi1) * sinPhi2,
  );
  return { lat: phi2 / rad, lng: ((lambda2 / rad + 540) % 360) - 180 };
};

/**
 * 生成未来轨迹预测（渐进转向 + 默认随机弯曲）。
 * 未指定目标航向时，每次运行随机左/右转、累计转向量与转向急缓；指定目标航向时生成可复现结果；
 * 位移使用大圆 destPoint，航速随时间轻微衰减，误差半径线性递增（台风预报同款规律）。
 */
export const generateTrajectoryForecast = (input: TrajectoryForecastInput): TrajectoryForecastPoint[] => {
  const hours = input.hours ?? 3;
  const stepMinutes = input.stepMinutes ?? 15;
  const startHeading = normalizeHeading(input.heading);

  // 随机化弯曲参数（每次运行结果不同）
  const hasTargetHeading = Number.isFinite(input.targetHeading);
  const turnDirection = hasTargetHeading ? 1 : (Math.random() < 0.5 ? -1 : 1);
  const totalTurnDeg = hasTargetHeading ? 0 : randomBetween(35, 95);
  const targetHeading = hasTargetHeading ? normalizeHeading(input.targetHeading!) : normalizeHeading(startHeading + turnDirection * totalTurnDeg);
  const turnRateDegPerHour = hasTargetHeading ? 12 : randomBetween(4, 12);
  const turnRateDegPerStep = turnRateDegPerHour * (stepMinutes / 60);

  const points: TrajectoryForecastPoint[] = [{
    minutesFromStart: 0,
    longitude: round(input.longitude, 4),
    latitude: round(input.latitude, 4),
    speedKnots: round(input.speedKnots, 1),
    heading: Math.round(startHeading),
    errorRadiusNm: round(2 + 1.9 * 0, 2),
    isHourlyNode: false,
  }];

  let latitude = input.latitude;
  let longitude = input.longitude;
  let heading = startHeading;

  const totalSteps = Math.round((hours * 60) / stepMinutes);
  for (let step = 1; step <= totalSteps; step += 1) {
    const minutes = step * stepMinutes;
    const hoursElapsed = minutes / 60;

    // 渐进转向：按每步最大转向速率逼近目标航向，保证平滑曲线
    let diff = targetHeading - heading;
    diff = ((diff + 540) % 360) - 180; // 取最短有向夹角
    heading = Math.abs(diff) > 0.5
      ? heading + Math.sign(diff) * Math.min(turnRateDegPerStep, Math.abs(diff))
      : targetHeading;
    heading = normalizeHeading(heading);

    const speedKmh = input.speedKnots * KM_PER_NAUTICAL_MILE * (1 - 0.15 * (hoursElapsed / hours));
    const next = destPoint(latitude, longitude, heading, speedKmh * (stepMinutes / 60));
    latitude = next.lat;
    longitude = next.lng;

    const speedKnots = input.speedKnots * (1 - 0.15 * (hoursElapsed / hours));
    points.push({
      minutesFromStart: minutes,
      longitude: round(longitude, 4),
      latitude: round(latitude, 4),
      speedKnots: round(speedKnots, 1),
      heading: Math.round(normalizeHeading(heading)),
      // 误差随时间线性递增（台风预报式不确定性锥），3h 内 T+3h 圆明显大于 T+1h
      errorRadiusNm: round(2 + 1.9 * hoursElapsed, 2),
      isHourlyNode: minutes % 60 === 0,
    });
  }

  return points;
};

/**
 * 构建误差扇区（不确定性锥）包络多边形顶点。
 * 对每个预测点沿航向左右法向偏移 errorRadiusNm 得到两侧边界，末端补一段圆弧，闭合成「喇叭口」。
 * @param points 预测点（含当前位置）
 * @returns 扁平化 [lng, lat, ...] 顶点数组
 */
export const buildConeVertices = (points: readonly TrajectoryForecastPoint[]): number[] => {
  const rightSide: { lat: number; lng: number }[] = [];
  const leftSide: { lat: number; lng: number }[] = [];
  for (const point of points) {
    const offsetKm = point.errorRadiusNm * KM_PER_NAUTICAL_MILE;
    rightSide.push(destPoint(point.latitude, point.longitude, point.heading + 90, offsetKm));
    leftSide.push(destPoint(point.latitude, point.longitude, point.heading - 90, offsetKm));
  }
  const end = points[points.length - 1];
  if (!end) return [];
  const endOffsetKm = end.errorRadiusNm * KM_PER_NAUTICAL_MILE;
  const arc: { lat: number; lng: number }[] = [];
  for (let angle = 90; angle >= -90; angle -= 15) {
    arc.push(destPoint(end.latitude, end.longitude, end.heading + angle, endOffsetKm));
  }
  const ring = [...rightSide, ...arc, ...leftSide.slice().reverse()];
  const flat: number[] = [];
  for (const vertex of ring) flat.push(vertex.lng, vertex.lat);
  return flat;
};
