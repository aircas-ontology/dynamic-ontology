import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import Layout from "@/layout/index.vue";
// import ontologyRouter from "./modules/ontologyRoutes";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Login",
    component: () => import("@/views/LoginPage/index.vue"),
  },
  {
    path: "/layout",
    component: Layout,
    // children: [...ontologyRouter],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: routes,
});

router.beforeEach((to, from) => {
  // console.log(to, from);
  return true;
});

router.afterEach((to, from) => {
  // console.log(to, from);
});

export default router;
