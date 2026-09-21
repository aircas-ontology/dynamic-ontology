/*
 * 注册全局组件，类似 element-ui
 * 全局组件使用
 */
import type { App } from "vue";
import AircasLoading from "./AircasLoading.vue";
import AircasPanel from "./AircasPanel.vue";
import AircasTimeline from "./AircasTimeline.vue";

export default (app: App) => {
  app.component("AircasLoading", AircasLoading);
  app.component("AircasPanel", AircasPanel);
  app.component("AircasTimeline", AircasTimeline);
};
