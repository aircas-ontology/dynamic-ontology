<template>
  <div class="intelligence-layout">
    <header class="intelligence-layout__header">
      <div class="intelligence-layout__brand">
        <span class="intelligence-layout__logo" aria-hidden="true"></span>
        <h1>灵境-天枢</h1>
      </div>
      <div class="intelligence-layout__time">
        <span>天文时间<br /><b>2026-11-23 02:26:15 UTC</b></span>
        <h2>情报融合分析平台</h2>
        <span>作战时间<br /><b>2026-11-23 10:26:15</b></span>
      </div>
      <button type="button" @click="logout">退出登录</button>
    </header>
    <div class="intelligence-layout__body">
      <nav class="intelligence-layout__nav">
        <RouterLink v-for="item in menu" :key="item.name" :to="{ name: item.name }" :class="{ active: route.name === item.name }"
          ><el-icon :size="24"><component :is="item.icon" /></el-icon>{{ item.label }}</RouterLink
        ><button type="button" class="collapse">≪ 收缩</button>
      </nav>
      <main class="intelligence-layout__content" :class="{ 'intelligence-layout__content--map': route.name === 'IntelligenceTaskDisplay' }">
        <RouterView />
      </main>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { Connection, Document, MagicStick, Tickets } from "@element-plus/icons-vue";
import { clearLoginToken } from "@/utils/authToken";
const route = useRoute();
const router = useRouter();
const menu = [
  { name: "IntelligenceTaskThemes", label: "任务主题", icon: Tickets },
  { name: "IntelligenceEventThemes", label: "事件主题", icon: Document },
  { name: "IntelligenceHiddenRelationMining", label: "隐含关系\n挖掘", icon: MagicStick },
  { name: "IntelligenceDomainKnowledgeGraph", label: "领域知识\n图谱", icon: Connection },
];
function logout(): void {
  clearLoginToken();
  void router.replace({ name: "Login" });
}
</script>
<style scoped lang="scss">
.intelligence-layout {
  height: 100%;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-page-background);
}
.intelligence-layout__header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  border-bottom: 1px solid var(--aircas-color-border);
  background: var(--aircas-color-panel-background);
}
.intelligence-layout__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  font-size: 20px;
}
.intelligence-layout__brand h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.intelligence-layout__logo {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  background: var(--aircas-color-text-primary);
  mask: url("@/assets/layouts/mainLayout/ontologyLogo.svg") center / contain no-repeat;
}
.intelligence-layout__time {
  display: flex;
  align-items: center;
  gap: 100px;
  text-align: center;
  color: var(--aircas-color-text-secondary);
}
.intelligence-layout__time h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 3px;
  color: var(--aircas-color-text-primary);
}
.intelligence-layout__time b {
  display: inline-block;
  margin-top: 2px;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--aircas-color-text-primary);
}
.intelligence-layout__header button {
  border: 0;
  background: transparent;
  color: var(--aircas-color-text-primary);
  font-size: 13px;
  cursor: pointer;
}
.intelligence-layout__body {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  height: calc(100% - 60px);
}
.intelligence-layout__nav {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 8px;
  border-right: 1px solid var(--aircas-color-border);
}
.intelligence-layout__nav a {
  display: flex;
  width: 71.33px;
  height: 68.23px;
  min-height: 68.23px;
  margin: 0 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--aircas-color-text-primary);
  text-align: center;
  text-decoration: none;
  white-space: pre-line;
  font-size: 13px;
}
.intelligence-layout__nav a.active,
.intelligence-layout__nav a:hover {
  border-color: var(--aircas-color-primary);
  background: var(--aircas-color-hover);
  color: var(--aircas-color-primary);
}
.intelligence-layout__nav a :deep(.el-icon) {
  width: 20px;
  height: 20px;
  font-size: 20px;
}
.collapse {
  position: absolute;
  bottom: 12px;
  left: 8px;
  border: 1px solid var(--aircas-color-border);
  background: transparent;
  color: var(--aircas-color-text-secondary);
  padding: 7px;
  font-size: 14px;
  cursor: pointer;
}
.intelligence-layout__content {
  min-width: 0;
  overflow: auto;
  padding: 18px 24px;
  background-image:
    linear-gradient(var(--aircas-color-effect-grid) 1px, transparent 1px), linear-gradient(90deg, var(--aircas-color-effect-grid) 1px, transparent 1px);
  background-size: 64px 64px;
}
.intelligence-layout__content--map {
  padding: 0;
  overflow: hidden;
}
</style>
