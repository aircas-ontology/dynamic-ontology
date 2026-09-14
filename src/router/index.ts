import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Login",
    component: () => import("@/views/LoginPage/index.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: { name: "Login" },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
