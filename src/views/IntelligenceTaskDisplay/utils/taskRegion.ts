/** 地图区域顶点经纬度。 */
export type TaskRegionPoint = [longitude: number, latitude: number];

/**
 * @description 将接口返回的区域字符串解析为可绘制的闭合区域顶点。
 * @param value 区域字符串，格式为 `lon,lat;lon,lat`。
 * @returns 至少包含三个合法顶点的区域点位；空值、非法值或顶点不足时返回空数组。
 */
export function parseTaskRegionPoints(value: string | undefined): TaskRegionPoint[] {
  if (!value?.trim()) return [];

  const points = value.split(";").flatMap((item) => {
    const [longitudeText = "", latitudeText = ""] = item.split(",");
    const longitude = Number(longitudeText);
    const latitude = Number(latitudeText);
    return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90
      ? ([[longitude, latitude]] as TaskRegionPoint[])
      : [];
  });

  return points.length >= 3 ? points : [];
}
