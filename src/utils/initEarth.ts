import * as mars3d from "mars3d";
import "mars3d-space";
import "mars3d-cesium/Build/Cesium/Widgets/widgets.css";
import "mars3d/mars3d.css";
import { isEmpty } from "lodash-es";
import type { MapConfig } from "@/types";

let globalViewer: mars3d.Map | null = null;

// 加载天空盒
function skyShow(viewer: mars3d.Map): void {
  viewer.scene.skyBox = new mars3d.Cesium.SkyBox({
    sources: {
      negativeX: "/assets/skyBox/px.png",
      negativeY: "/assets/skyBox/py.png",
      negativeZ: "/assets/skyBox/pz.png",
      positiveX: "/assets/skyBox/nx.png",
      positiveY: "/assets/skyBox/ny.png",
      positiveZ: "/assets/skyBox/nz.png",
    },
  });
}

// 初始化地球
function initViewer(el: string | mars3d.Cesium.Viewer, mapConfig: MapConfig = {}): mars3d.Map {
  const viewer = new mars3d.Map(el, isEmpty(mapConfig) ? MAP_CONFIG : mapConfig);
  globalViewer = viewer;
  skyShow(viewer);
  return viewer;
}

export { globalViewer, initViewer };
