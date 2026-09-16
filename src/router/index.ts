import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { workspaceRoutes } from "@/router/modules/workspaceRoutes";

import { registerAuthGuard } from "./authGuard";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Login",
    component: () => import("@/views/LoginPage/index.vue"),
  },
  ...workspaceRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "Login" },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

registerAuthGuard(router);

export default router;
