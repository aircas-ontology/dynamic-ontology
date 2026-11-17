/*
 * 注册全局组件，类似 element-ui
 * 全局组件使用
 */
import type { App } from "vue";
import AircasLoading from "./AircasLoading.vue";
import AircasPanel from "./AircasPanel.vue";
import AircasTimeline from "./AircasTimeline.vue";
import BehaviorParameterConfig from "./BehaviorParameterConfig/BehaviorParameterConfig.vue";
import BehaviorTreeExecPanel from "./BehaviorTreeExecPanel.vue";
import OnboardingGuideOverlay from "./OnboardingGuide/OnboardingGuideOverlay.vue";
import OntologyGlobalSearchField from "./OntologyGlobalSearchField/OntologyGlobalSearchField.vue";
import OntologyRelationGraph2d from "./OntologyRelationGraph2d.vue";

export default (app: App) => {
  app.component("AircasLoading", AircasLoading);
  app.component("AircasPanel", AircasPanel);
  app.component("AircasTimeline", AircasTimeline);
  app.component("BehaviorParameterConfig", BehaviorParameterConfig);
  app.component("BehaviorTreeExecPanel", BehaviorTreeExecPanel);
  app.component("OnboardingGuideOverlay", OnboardingGuideOverlay);
  app.component("OntologyGlobalSearchField", OntologyGlobalSearchField);
  app.component("OntologyRelationGraph2d", OntologyRelationGraph2d);
};
