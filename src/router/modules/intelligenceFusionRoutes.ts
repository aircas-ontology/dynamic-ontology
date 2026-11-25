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
        component: () => import("@/views/IntelligenceEventThemes/index.vue"),
        meta: { title: "事件主题" },
      },
      {
        path: "event-display",
        name: "IntelligenceEventDisplay",
        component: () => import("@/views/IntelligenceEventDisplay/index.vue"),
        meta: { title: "事件态势" },
      },
      {
        path: "hidden-relation-mining",
        name: "IntelligenceHiddenRelationMining",
        component: () => import("@/views/IntelligenceHiddenRelationMining/index.vue"),
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
