import type { RouteRecordRaw } from "vue-router";

const emptyWorkspacePanel = () => import("@/views/OntologySpaceManagementDetail/components/EmptyWorkspacePanel.vue");

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
      {
        path: "ontology-space-management/:spaceId",
        name: "OntologySpaceManagementDetail",
        component: () => import("@/views/OntologySpaceManagementDetail/index.vue"),
        meta: { title: "空间内管理" },
        redirect: { name: "OntologySpaceManagementDetailOverview" },
        children: [
          {
            path: "overview",
            name: "OntologySpaceManagementDetailOverview",
            component: emptyWorkspacePanel,
            meta: { title: "空间内管理", workspaceTab: "overview" },
          },
          {
            path: "object",
            name: "OntologySpaceManagementDetailObject",
            component: emptyWorkspacePanel,
            meta: { title: "空间内管理", workspaceTab: "object" },
          },
          {
            path: "relation",
            name: "OntologySpaceManagementDetailRelation",
            component: () => import("@/views/OntologySpaceManagementDetail/relationComponents/SpaceRelationWorkspace.vue"),
            meta: { title: "空间内管理", workspaceTab: "relation" },
          },
          {
            path: "function-operator",
            name: "OntologySpaceManagementDetailFunctionOperator",
            component: emptyWorkspacePanel,
            meta: { title: "空间内管理", workspaceTab: "function-operator" },
          },
          {
            path: "behavior",
            name: "OntologySpaceManagementDetailBehavior",
            component: emptyWorkspacePanel,
            meta: { title: "空间内管理", workspaceTab: "behavior" },
          },
          {
            path: "behavior-schedule",
            name: "OntologySpaceManagementDetailBehaviorSchedule",
            component: emptyWorkspacePanel,
            meta: { title: "空间内管理", workspaceTab: "behavior-schedule" },
          },
        ],
      },
      {
        path: "full-text-search",
        name: "FullTextSearch",
        component: () => import("@/views/FullTextSearch/index.vue"),
        meta: { title: "全文检索" },
      },
    ],
  },
];
