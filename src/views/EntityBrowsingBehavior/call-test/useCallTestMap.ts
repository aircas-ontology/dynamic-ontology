import * as mars3d from "mars3d";
import type { Ref } from "vue";
import type { CallTestRunStatus, CallTestTrajectoryPoint } from "@/types";
import type { CallTestInput } from "@/types";
import { CALL_TEST_HISTORICAL_TRACK } from "@/mocks/entityBrowsingDeweyBehavior/deweyCallTestMock";
import { buildConeVertices } from "@/utils/trajectoryForecast";
import { initViewer } from "@/utils/initEarth";
import type { ViewerHandle } from "@/utils/initEarth";
import shipDeweyIcon from "@/assets/pages/entityBrowsingBehavior/icons/shipDewey.svg";

const NM_TO_METERS = 1852;

export const useCallTestMap = (
  containerRef: Ref<HTMLElement | null>,
  statusRef: Ref<CallTestRunStatus>,
  trajectoryRef: Ref<readonly CallTestTrajectoryPoint[]>,
  inputRef: Ref<CallTestInput>,
) => {
  let handle: ViewerHandle | null = null;
  let map: mars3d.Map | null = null;
  let currentLayer: mars3d.layer.GraphicLayer | null = null;
  let resultLayer: mars3d.layer.GraphicLayer | null = null;
  let historyLayer: mars3d.layer.GraphicLayer | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const themeColor = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const renderHistoryTrack = (): void => {
    if (!historyLayer) return;
    historyLayer.clear();
    const points = CALL_TEST_HISTORICAL_TRACK;
    if (points.length === 0) return;
    const green = themeColor("--aircas-color-success");
    historyLayer.addGraphic(
      new mars3d.graphic.PolylineEntity({
        id: "call-test-history-track",
        name: "杜威号历史轨迹",
        positions: points.map((point) => [point.longitude, point.latitude, 0]),
        style: { width: 3, color: green, opacity: 0.85, clampToGround: true },
      }),
    );
    const endpoint = points.at(-1)!;
    historyLayer.addGraphic(
      new mars3d.graphic.LabelEntity({
        position: [endpoint.longitude, endpoint.latitude, 6],
        style: {
          text: "历史轨迹终点",
          color: themeColor("--aircas-color-text-primary"),
          font_size: 12,
          outline: true,
          outlineColor: themeColor("--aircas-color-page-background"),
          outlineWidth: 2,
          pixelOffsetY: -22,
          clampToGround: true,
        },
      }),
    );
  };

  const renderCurrentPosition = (point: Pick<CallTestTrajectoryPoint, "longitude" | "latitude">): void => {
    if (!currentLayer) return;
    currentLayer.clear();
    currentLayer.addGraphic(
      new mars3d.graphic.BillboardEntity({
        id: "call-test-current-ship",
        name: "杜威号当前位置",
        position: [point.longitude, point.latitude, 0],
        style: { image: shipDeweyIcon, width: 38, height: 38, clampToGround: true },
      }),
    );
    currentLayer.addGraphic(
      new mars3d.graphic.LabelEntity({
        position: [point.longitude, point.latitude, 0],
        style: {
          text: "杜威号（当前位置）",
          color: themeColor("--aircas-color-text-primary"),
          font_size: 13,
          outline: true,
          outlineColor: themeColor("--aircas-color-page-background"),
          outlineWidth: 3,
          pixelOffsetY: -30,
          clampToGround: true,
        },
      }),
    );
  };

  const renderResult = (): void => {
    if (!resultLayer) return;
    resultLayer.clear();
    const points = trajectoryRef.value;
    if (statusRef.value !== "success" || points.length === 0) return;
    const forecast = themeColor("--aircas-color-warning");
    const green = themeColor("--aircas-color-success");
    const panel = themeColor("--aircas-color-overlay");
    const pageBg = themeColor("--aircas-color-page-background");
    const white = themeColor("--aircas-color-text-primary");

    // 1) 误差扇区（不确定性锥）：由每点沿航向左右偏移误差半径构造平滑「喇叭口」，
    //    取代原定宽 CorridorEntity 拼接，直观呈现「预测越久误差越大」的台风式开口。
    const coneFlat = buildConeVertices(points);
    const conePositions: [number, number, number][] = [];
    for (let i = 0; i + 1 < coneFlat.length; i += 2) {
      const lng = coneFlat[i];
      const lat = coneFlat[i + 1];
      if (lng === undefined || lat === undefined) break;
      conePositions.push([lng, lat, 0]);
    }
    if (conePositions.length >= 4) {
      resultLayer.addGraphic(
        new mars3d.graphic.PolygonEntity({
          positions: conePositions,
          style: { color: forecast, opacity: 0.12, clampToGround: true },
        }),
      );
      const outlinePositions = [...conePositions];
      outlinePositions.push(conePositions[0]!);
      resultLayer.addGraphic(
        new mars3d.graphic.PolylineEntity({
          positions: outlinePositions,
          style: { width: 1.5, materialType: "PolylineDash", materialOptions: { color: forecast, dashLength: 12 }, clampToGround: true },
        }),
      );
    }

    // 2) 预测中心线：台风预报常用「橙色虚线」
    resultLayer.addGraphic(
      new mars3d.graphic.PolylineEntity({
        positions: points.map((point) => [point.longitude, point.latitude, 20]),
        style: { width: 4, materialType: "PolylineDash", materialOptions: { color: forecast, dashLength: 16 }, clampToGround: true },
      }),
    );

    // 3) 关键时效节点：同心误差圆 + 节点点标 + 时间标签 + 弹窗
    points
      .filter((point) => point.isHourlyNode)
      .forEach((point) => {
        const hour = point.minutesFromStart / 60;
        resultLayer?.addGraphic(
          new mars3d.graphic.CircleEntity({
            id: `call-test-error-circle-t${hour}h`,
            name: `${hour} 小时误差圆`,
            position: [point.longitude, point.latitude, 0],
            style: {
              radius: Math.max(1, point.errorRadiusNm * NM_TO_METERS),
              color: forecast,
              opacity: 0.1,
              outline: true,
              outlineColor: forecast,
              outlineOpacity: 0.85,
              clampToGround: true,
            },
          }),
        );
        const graphic = new mars3d.graphic.PointPrimitive({
          position: [point.longitude, point.latitude, 60],
          style: { color: forecast, pixelSize: hour === 3 ? 13 : 11, outlineColor: white, outlineWidth: 2 },
          attr: point,
        });
        graphic.bindPopup(
          `<div class="call-test-map-popup"><strong>未来 ${hour} 小时</strong><span>时间：${point.displayTime}</span><span>经度：${point.longitude.toFixed(4)}°E</span><span>纬度：${point.latitude.toFixed(4)}°N</span><span>误差半径：${point.errorRadiusNm.toFixed(2)} 海里</span></div>`,
          { template: false, background: panel },
        );
        resultLayer?.addGraphic(graphic);
        resultLayer?.addGraphic(
          new mars3d.graphic.LabelEntity({
            position: [point.longitude, point.latitude, 60],
            style: { text: `T+${hour}h`, color: forecast, font_size: 12, outline: true, outlineColor: pageBg, outlineWidth: 2, pixelOffsetY: -20 },
          }),
        );
      });
  };

  const render = (): void => {
    renderHistoryTrack();
    const point = trajectoryRef.value[0] ?? {
      longitude: inputRef.value.longitude,
      latitude: inputRef.value.latitude,
    };
    renderCurrentPosition(point);
    renderResult();
    if (map) {
      let positions: [number, number][] = [];
      if (statusRef.value === "success") {
        // 预测态：将误差锥包络顶点并入包围盒，确保完整锥体进入视野
        const coneFlat = buildConeVertices(trajectoryRef.value);
        const coneCoords: [number, number][] = [];
        for (let i = 0; i + 1 < coneFlat.length; i += 2) {
          const lng = coneFlat[i];
          const lat = coneFlat[i + 1];
          if (lng === undefined || lat === undefined) break;
          coneCoords.push([lng, lat]);
        }
        positions = [...trajectoryRef.value.map((item) => [item.longitude, item.latitude] as [number, number]), ...coneCoords];
      } else {
        positions = CALL_TEST_HISTORICAL_TRACK.map((item) => [item.longitude, item.latitude] as [number, number]);
      }
      const longitudes = positions.map((item) => item[0]!);
      const latitudes = positions.map((item) => item[1]!);
      const centerLongitude = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
      const centerLatitude = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
      const span = Math.max(Math.max(...longitudes) - Math.min(...longitudes), Math.max(...latitudes) - Math.min(...latitudes));
      map.setCameraView({
        lat: centerLatitude,
        lng: centerLongitude,
        alt: statusRef.value === "success" ? Math.max(180000, span * 180000) : Math.max(260000, span * 180000),
        heading: 0,
        pitch: -89.9,
      });
      map.scene.requestRender();
    }
  };

  const init = (): void => {
    const container = containerRef.value;
    if (!container || map) return;
    handle = initViewer(container.id);
    map = handle.viewer;
    currentLayer = new mars3d.layer.GraphicLayer({ name: "call-test-current-position" });
    resultLayer = new mars3d.layer.GraphicLayer({ name: "call-test-prediction-result" });
    historyLayer = new mars3d.layer.GraphicLayer({ name: "call-test-history-track" });
    map.addLayer(currentLayer);
    map.addLayer(resultLayer);
    map.addLayer(historyLayer);
    renderHistoryTrack();
    resizeObserver = new ResizeObserver(() => map?.scene.requestRender());
    resizeObserver.observe(container);
    render();
  };

  const destroy = (): void => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    handle?.dispose();
    handle = null;
    map = null;
    currentLayer = null;
    resultLayer = null;
    historyLayer = null;
  };

  return { init, render, destroy };
};
