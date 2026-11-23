import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { workspaceRoutes } from "@/router/modules/workspaceRoutes";
import { intelligenceFusionRoutes } from "@/router/modules/intelligenceFusionRoutes";

import { registerAuthGuard } from "./authGuard";
import { registerEmbeddedAutoLoginGuard } from "./embeddedAutoLoginGuard";
import { registerEmbeddedModeGuard } from "./embeddedModeGuard";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Login",
    component: () => import("@/views/LoginPage/index.vue"),
  },
  ...workspaceRoutes,
  ...intelligenceFusionRoutes,
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "Login" },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

registerEmbeddedAutoLoginGuard(router);
registerAuthGuard(router);
registerEmbeddedModeGuard(router);

export default router;
