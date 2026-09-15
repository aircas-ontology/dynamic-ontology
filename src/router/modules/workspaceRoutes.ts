import type { RouteRecordRaw } from "vue-router";

export const workspaceRoutes: RouteRecordRaw[] = [
  {
    path: "/workspace",
    name: "Workspace",
    component: () => import("@/layout/index.vue"),
    meta: { title: "首页" },
    children: [
      {
        path: "ontology-space-management",
        name: "OntologySpaceManagement",
        component: () => import("@/views/OntologySpaceManagement/index.vue"),
        meta: { title: "本体空间管理" },
      },
    ],
  },
];
