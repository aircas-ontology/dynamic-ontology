<template>
  <header class="header-bar">
    <div class="header-bar__brand">
      <span class="header-bar__logo" aria-hidden="true"></span>
      <h1>空天 · 灵枢</h1>
      <span class="header-bar__version">{{ version }}</span>
    </div>
    <div class="header-bar__search" title="全局搜索暂未开放">
      <el-input class="aircas-input" placeholder="检索空间、对象、实例、属性..." :prefix-icon="Search" ariaLabel="全局搜索（暂未开放）" disabled />
    </div>
    <div class="header-bar__tools">
      <button type="button" class="header-bar__tool" :aria-label="dark ? '切换浅色主题' : '切换深色主题'" @click="toggleTheme">
        <el-icon :size="20">
          <Sunny v-if="dark" />
          <Moon v-else />
        </el-icon>
      </button>
      <button type="button" class="header-bar__tool" aria-label="消息暂未开放" title="消息暂未开放" disabled>
        <el-icon :size="20">
          <Bell />
        </el-icon>
      </button>
      <button type="button" class="header-bar__tool" aria-label="帮助暂未开放" title="帮助暂未开放" disabled>
        <el-icon :size="20">
          <QuestionFilled />
        </el-icon>
      </button>
      <el-dropdown class="aircas-dropdown" popper-class="aircas-dropdown-popper" trigger="click" @command="logoutCurrentSession">
        <button type="button" class="header-bar__user" aria-label="访客菜单">
          <el-icon :size="20"><UserFilled /></el-icon>
          <span>访客</span>
        </button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Bell, Moon, QuestionFilled, Search, Sunny, UserFilled } from "@element-plus/icons-vue";
import { LOGIN_ROUTE_NAME } from "@/router/authGuard";
import { clearLoginToken } from "@/utils/authToken";

const version = SYSTEM_CONFIG.version;
const router = useRouter();
const dark = ref(document.documentElement.getAttribute("theme") !== "light");

/**
 * @description 在暗色和浅色主题之间切换，并写回文档根节点的 theme 属性。
 */
function toggleTheme() {
  dark.value = !dark.value;
  document.documentElement.setAttribute("theme", dark.value ? "dark" : "light");
}

/**
 * @description 退出当前会话：清除浏览器中的登录令牌，并替换到登录页，避免返回已退出的页面。
 * @param command 访客菜单命令，仅处理 logout。
 */
function logoutCurrentSession(command: string) {
  if (command !== "logout") return;
  clearLoginToken();
  void router.replace({ name: LOGIN_ROUTE_NAME });
}
</script>
<style scoped lang="scss">
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  height: 50px;
  gap: 20px;
  padding: 0 15px;
  color: var(--aircas-color-text-primary);
  background: linear-gradient(90deg, var(--aircas-color-page-background), var(--aircas-color-menu-background));
  border-bottom: 1px solid var(--aircas-color-border-soft);
}

.header-bar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.header-bar__logo {
  width: 30px;
  height: 30px;
  background: var(--aircas-color-text-primary);
  mask: url("@/assets/layouts/mainLayout/ontologyLogo.svg") center / contain no-repeat;
  flex-shrink: 0;
}

.header-bar h1 {
  font-size: 24px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-bar__version {
  padding: 2px 8px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 12px;
  font-size: 12px;
  color: var(--aircas-color-title);
  background: var(--aircas-color-background);
}

.header-bar__search {
  flex: 0 1 640px;
  min-width: 180px;
}

.header-bar__search .aircas-input {
  --el-input-border-radius: 20px;
}

.header-bar__tools {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.header-bar__tool {
  display: inline-flex;
  padding: 4px;
  border: 0;
  background: var(--aircas-color-transparent);
  color: inherit;
  cursor: pointer;
}

.header-bar__tool:hover {
  background: var(--aircas-color-hover-background);
}

.header-bar__tool:disabled {
  color: var(--aircas-color-text-disabled);
  cursor: not-allowed;
}

.header-bar__tool:focus-visible {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: 2px;
}

.header-bar__user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: var(--aircas-color-transparent);
  color: inherit;
  font-size: 14px;
  cursor: pointer;
}

.header-bar__user:hover {
  color: var(--aircas-color-title);
}

.header-bar__user:focus-visible {
  outline: 2px solid var(--aircas-color-accent-cyan);
  outline-offset: 2px;
}

.header-bar__user .el-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--aircas-color-selected-background);
}

@media (max-width: 900px) {
  .header-bar {
    gap: 12px;
    padding: 0 12px;
  }

  .header-bar h1 {
    font-size: 20px;
  }

  .header-bar__tools {
    gap: 8px;
  }

  .header-bar__version {
    display: none;
  }
}

@media (max-width: 600px) {
  .header-bar__search {
    display: none;
  }

  .header-bar__user span {
    display: none;
  }
}
</style>
