import type { RouteRecordRaw } from "vue-router";

export const intelligenceFusionRoutes: RouteRecordRaw[] = [
  {
    path: "/intelligence-fusion",
    name: "IntelligenceFusion",
    component: () => import("@/views/IntelligenceFusionLayout/index.vue"),
    meta: { title: "情报融合分析平台" },
    redirect: { name: "IntelligenceTaskThemes" },
    children: [
      { path: "task-themes", name: "IntelligenceTaskThemes", component: () => import("@/views/IntelligenceTaskThemes/index.vue"), meta: { title: "任务主题" } },
      {
        path: "task-display",
        name: "IntelligenceTaskDisplay",
        component: () => import("@/views/IntelligenceTaskDisplay/index.vue"),
        meta: { title: "任务展示" },
      },
      {
        path: "event-themes",
        name: "IntelligenceEventThemes",
        component: () => import("@/views/IntelligenceFusionPlaceholder/index.vue"),
        props: { title: "事件主题" },
        meta: { title: "事件主题" },
      },
      {
        path: "hidden-relation-mining",
        name: "IntelligenceHiddenRelationMining",
        component: () => import("@/views/IntelligenceFusionPlaceholder/index.vue"),
        props: { title: "隐含关系挖掘" },
        meta: { title: "隐含关系挖掘" },
      },
      {
        path: "domain-knowledge-graph",
        name: "IntelligenceDomainKnowledgeGraph",
        component: () => import("@/views/IntelligenceFusionPlaceholder/index.vue"),
        props: { title: "领域知识图谱" },
        meta: { title: "领域知识图谱" },
      },
    ],
  },
];
