import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementIcons from "@element-plus/icons-vue";

import "element-plus/dist/index.css";
import "font-awesome/css/font-awesome.min.css";
import "@/styles/index.scss";

import App from "./App.vue";
import router from "./router";
import ComponentRegister from "./components/register";

const app = createApp(App);

// 全局注册 element-plus 图标组件（各组件以全局名直接使用）
for (const [key, component] of Object.entries(ElementIcons)) {
  app.component(key, component);
}

app.use(ElementPlus, { locale: zhCn });
app.use(ComponentRegister);
app.use(createPinia());
app.use(router);
app.mount("#app");
