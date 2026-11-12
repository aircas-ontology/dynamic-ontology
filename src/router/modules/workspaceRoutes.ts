import type { RouteRecordRaw } from "vue-router";

export const workspaceRoutes: RouteRecordRaw[] = [
  {
    path: "/workspace",
    name: "Workspace",
    component: () => import("@/layout/index.vue"),
    meta: { title: "首页" },
    children: [
      {
        path: "ontology-space-browse",
        name: "OntologySpaceBrowse",
        component: () => import("@/views/OntologySpaceManagement/index.vue"),
        props: { browseOnly: true },
        meta: { title: "对象空间浏览" },
      },
      {
        path: "theme-space-browse",
        name: "ThemeSpaceBrowse",
        component: () => import("@/views/ThemeSpaceManagement/index.vue"),
        props: { browseOnly: true },
        meta: { title: "主题空间浏览" },
      },
      {
        path: "ontology-space-management",
        name: "OntologySpaceManagement",
        component: () => import("@/views/OntologySpaceManagement/index.vue"),
        meta: { title: "对象空间管理" },
      },
      {
        path: "theme-space-management",
        name: "ThemeSpaceManagement",
        component: () => import("@/views/ThemeSpaceManagement/index.vue"),
        meta: { title: "主题管理" },
      },
      {
        path: "entity-browsing/:spaceId/object/:objectId",
        name: "EntityBrowsingObjectProfile",
        component: () => import("@/views/EntityBrowsingObjectProfile/index.vue"),
        meta: { title: "对象画像", browseOnly: true },
      },
      {
        path: "entity-browsing/:spaceId",
        name: "EntityBrowsing",
        component: () => import("@/views/EntityBrowsing/index.vue"),
        redirect: { name: "EntityBrowsingObject" },
        meta: { title: "空间浏览", browseOnly: true },
        children: [
          {
            path: "object",
            name: "EntityBrowsingObject",
            component: () => import("@/views/ObjectWorkspacePanel/index.vue"),
            meta: { title: "空间浏览", workspaceTab: "object", browseOnly: true },
          },
          {
            path: "relation",
            name: "EntityBrowsingRelation",
            component: () => import("@/views/SpaceRelationWorkspace/index.vue"),
            meta: { title: "空间浏览", workspaceTab: "relation", browseOnly: true },
          },
          {
            path: "function-operator",
            name: "EntityBrowsingFunctionOperator",
            component: () => import("@/views/FunctionOperatorPanel/index.vue"),
            meta: { title: "空间浏览", workspaceTab: "function-operator", browseOnly: true },
          },
          {
            path: "behavior",
            name: "EntityBrowsingBehavior",
            component: () => import("@/views/EntityBrowsingBehavior/index.vue"),
            meta: { title: "空间浏览", workspaceTab: "behavior", browseOnly: true },
          },
          { path: "behavior-schedule", name: "EntityBrowsingBehaviorSchedule", redirect: { name: "EntityBrowsingObject" } },
        ],
      },
      {
        path: "ontology-space-management/conceptual-model-create",
        name: "OntologyConceptualModelCreate",
        component: () => import("@/views/OntologyConceptualModelCreate/index.vue"),
        meta: { title: "概念模型构建" },
      },
      {
        path: "ontology-space-management/:spaceId",
        name: "OntologySpaceManagementDetail",
        component: () => import("@/views/OntologySpaceManagementDetail/index.vue"),
        meta: { title: "空间内管理" },
        redirect: { name: "OntologySpaceManagementDetailObject" },
        children: [
          {
            path: "object",
            name: "OntologySpaceManagementDetailObject",
            component: () => import("@/views/ObjectWorkspacePanel/index.vue"),
            meta: { title: "空间内管理", workspaceTab: "object" },
          },
          {
            path: "relation",
            name: "OntologySpaceManagementDetailRelation",
            component: () => import("@/views/SpaceRelationWorkspace/index.vue"),
            meta: { title: "空间内管理", workspaceTab: "relation" },
          },
          {
            path: "function-operator",
            name: "OntologySpaceManagementDetailFunctionOperator",
            component: () => import("@/views/FunctionOperatorPanel/index.vue"),
            meta: { title: "空间内管理", workspaceTab: "function-operator" },
          },
          {
            path: "behavior",
            name: "OntologySpaceManagementDetailBehavior",
            component: () => import("@/views/SpaceBehaviorWorkspace/index.vue"),
            meta: { title: "空间内管理", workspaceTab: "behavior" },
          },
          {
            path: "behavior-schedule",
            name: "OntologySpaceManagementDetailBehaviorSchedule",
            component: () => import("@/views/SpaceBehaviorScheduleWorkspace/index.vue"),
            meta: { title: "空间内管理", workspaceTab: "behavior-schedule" },
          },
          {
            path: "llm-builder",
            name: "OntologyLlmBuilder",
            component: () => import("@/views/OntologyLlmBuilder/index.vue"),
            meta: { title: "大模型构建" },
          },
          {
            path: "subspace-create",
            name: "OntologySubspaceCreate",
            component: () => import("@/views/OntologySubspaceCreate/index.vue"),
            meta: { title: "创建主题" },
          },
        ],
      },
      {
        path: "ontology-object/:objectId",
        name: "OntologyObjectDetail",
        component: () => import("@/views/OntologyObjectDetail/index.vue"),
        meta: { title: "对象详情" },
        redirect: { name: "OntologyObjectDetailAttribute" },
        children: [
          {
            path: "attribute",
            name: "OntologyObjectDetailAttribute",
            component: () => import("@/views/OntologyObjectAttributePanel/index.vue"),
            meta: { title: "对象详情", objectDetailTab: "attribute" },
          },
          {
            path: "relation",
            name: "OntologyObjectDetailRelation",
            component: () => import("@/views/SpaceRelationWorkspace/index.vue"),
            meta: { title: "对象详情", objectDetailTab: "relation" },
          },
          {
            path: "behavior",
            name: "OntologyObjectDetailBehavior",
            component: () => import("@/views/SpaceBehaviorWorkspace/index.vue"),
            meta: { title: "对象详情", objectDetailTab: "behavior" },
          },
        ],
      },
      {
        path: "full-text-search",
        name: "FullTextSearch",
        component: () => import("@/views/FullTextSearch/index.vue"),
        meta: { title: "全文检索" },
      },
      {
        path: "application-management",
        name: "ApplicationManagement",
        component: () => import("@/views/ApplicationManagement/index.vue"),
        meta: { title: "应用管理" },
      },
    ],
  },
];
