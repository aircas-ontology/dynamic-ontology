<template>
  <section class="ontology-login">
    <div class="bg-pattern" aria-hidden="true"></div>

    <main class="layout">
      <section class="left-panel">
        <header class="brand">
          <div class="brand-logo">
            <img :src="logoImage" alt="动态本体平台图标" />
          </div>
          <div>
            <h1>空天 · 灵枢</h1>

            <!-- <p>Dynamic Ontology Platform</p> -->
          </div>
        </header>

        <div class="headline">
          <h2>让知识随业务而生，随环境而变</h2>
          <p>动态感知 ｜ 自主演化 ｜ 智能融合</p>
        </div>

        <div class="visual-area">
          <div class="stack-visual" aria-label="本体分层示意图">
            <img :src="layer4" alt="" class="stack-layer layer-4" />
            <img :src="layer3" alt="" class="stack-layer layer-3" />
            <img :src="layer2" alt="" class="stack-layer layer-2" />
            <img :src="layer1" alt="" class="stack-layer layer-1" />
            <img :src="layer01" alt="" class="stack-layer layer-01" />
            <img :src="layer02" alt="" class="stack-layer layer-02" />
          </div>
          <!-- <ul class="stack-notes left-notes">
            <li class="n-top">本体语言 &amp; 工具链</li>
            <li class="n-mid">本体引擎</li>
            <li class="n-mid2">安全与治理</li>
            <li class="n-bottom">数据、逻辑 &amp; 行为服务</li>
          </ul> -->
        </div>
      </section>

      <aside class="login-card">
        <h3>欢迎登录</h3>
        <!-- <p class="sub-title">动态本体平台</p> -->

        <form class="login-form" novalidate @submit.prevent="onSubmit">
          <label class="field">
            <span class="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5.5 20c.7-3.2 3-5 6.5-5s5.8 1.8 6.5 5" />
              </svg>
            </span>
            <input
              v-model="formData.username"
              :disabled="loginStatus === 'submitting'"
              type="text"
              aria-label="用户名"
              placeholder="请输入用户名"
              autocomplete="username"
              @input="resetLoginStatus"
            />
          </label>

          <label class="field">
            <span class="field-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="5.5" y="10" width="13" height="10" rx="2" />
                <path d="M8.5 10V7.8a3.5 3.5 0 0 1 7 0V10" />
              </svg>
            </span>
            <input
              v-model="formData.password"
              class="password-input"
              :disabled="loginStatus === 'submitting'"
              :type="showPassword ? 'text' : 'password'"
              aria-label="密码"
              placeholder="请输入密码"
              autocomplete="current-password"
              @input="resetLoginStatus"
            />
            <button
              class="eye"
              type="button"
              :disabled="loginStatus === 'submitting'"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="togglePasswordVisibility"
            >
              <svg v-if="showPassword" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"
                />
                <circle cx="12" cy="12" r="3.2" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.2 3.2l17.6 17.6" />
                <path
                  d="M9.8 5.9A11.2 11.2 0 0 1 12 5.5C19.2 5.5 23 12 23 12a18.6 18.6 0 0 1-4.2 4.9"
                />
                <path
                  d="M14.2 18.1c-.7.2-1.4.4-2.2.4C4.8 18.5 1 12 1 12a18.8 18.8 0 0 1 5.4-5.6"
                />
                <path d="M10 10a2.8 2.8 0 0 0 4 4" />
              </svg>
            </button>
          </label>

          <p v-if="loginStatus === 'error'" class="login-error" role="alert">
            {{ loginError }}
          </p>

          <button
            class="submit"
            type="submit"
            :disabled="loginStatus === 'submitting'"
            :aria-busy="loginStatus === 'submitting'"
          >
            {{ loginStatus === "submitting" ? "提交中..." : "登 录" }}
          </button>
        </form>

        <div class="core-title">
          <span></span>
          <p>平台核心理念</p>
          <span></span>
        </div>

        <ul class="core-grid">
          <li>
            <span class="core-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z"
                />
              </svg>
            </span>
            <strong>动态感知</strong>
            <small>感知行为变化</small>
          </li>
          <li>
            <span class="core-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M6 17 17 6M8 6h9v9" /></svg>
            </span>
            <strong>自主进化</strong>
            <small>适应业务发展</small>
          </li>
          <li>
            <span class="core-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="8" cy="8" r="3" />
                <circle cx="16" cy="8" r="3" />
                <circle cx="8" cy="16" r="3" />
                <circle cx="16" cy="16" r="3" />
              </svg>
            </span>
            <strong>智能融合</strong>
            <small>融合异构知识</small>
          </li>
        </ul>

        <!-- <p class="security">企业级安全防护 ｜ 权限精细管控 ｜ 全链路审计</p> -->
      </aside>
    </main>

    <footer class="copyright">
      © 2026 动态本体平台 · 中国科学院空天信息创新研究院
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

import layer01 from "@/assets/pages/loginPage/images/layer01.svg";
import layer02 from "@/assets/pages/loginPage/images/layer02.svg";
import layer1 from "@/assets/pages/loginPage/images/layer1.svg";
import layer2 from "@/assets/pages/loginPage/images/layer2.svg";
import layer3 from "@/assets/pages/loginPage/images/layer3.svg";
import layer4 from "@/assets/pages/loginPage/images/layer4.svg";
import logoImage from "@/assets/pages/loginPage/images/loginLogo.png";
import { postLoginInterface } from "@/apis";
import type { LoginCredentials } from "@/types";

type LoginCommandStatus = "idle" | "submitting" | "success" | "error";

const showPassword = ref(false);
const router = useRouter();
const loginStatus = ref<LoginCommandStatus>("idle");
const loginError = ref("");
const formData = ref<LoginCredentials>({
  username: "",
  password: "",
});

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}

function resetLoginStatus() {
  if (loginStatus.value === "submitting") return;
  loginStatus.value = "idle";
  loginError.value = "";
}

async function onSubmit() {
  if (loginStatus.value === "submitting") return;

  loginStatus.value = "submitting";
  loginError.value = "";

  try {
    const response = await postLoginInterface(formData.value);
    if (response.code !== 200) {
      throw new Error(response.message || "登录失败，请检查账号密码后重试。");
    }
    const failure = await router.push({ name: "OntologySpaceManagement" });
    if (failure) throw new Error("进入系统失败，请稍后重试。");
    loginStatus.value = "success";
  } catch (error) {
    loginStatus.value = "error";
    loginError.value =
      error instanceof Error && error.message
        ? error.message
        : "登录失败，请稍后重试。";
    ElMessage.error(loginError.value);
  }
}
</script>

<style scoped lang="scss">
.ontology-login {
  min-height: 100vh;
  padding: 28px 40px 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: var(--aircas-color-text-primary);
  background: radial-gradient(
      circle at 12% 18%,
      var(--aircas-color-accent-blue-soft),
      transparent 32%
    ),
    radial-gradient(
      circle at 82% 78%,
      var(--aircas-color-accent-cyan-soft),
      transparent 34%
    ),
    linear-gradient(
      135deg,
      var(--aircas-color-page-background),
      var(--aircas-color-panel-background-deep)
    );
}

.bg-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(
      var(--aircas-color-accent-cyan-soft) 1px,
      transparent 1px
    ),
    linear-gradient(
      145deg,
      var(--aircas-color-accent-blue-soft),
      transparent 58%
    );
  background-size: 30px 30px, auto;
  opacity: 0.68;
}

.layout {
  position: relative;
  z-index: 1;
  flex: 1;
  width: 100%;
  max-width: 1440px;
  min-height: 0;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(620px, 1.25fr) minmax(420px, 0.75fr);
  gap: 64px;
  align-items: center;
}

.left-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-logo {
  display: grid;
  width: 68px;
  height: 68px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 16px;
  background: var(--aircas-color-accent-cyan-fill);
  box-shadow: 0 0 24px var(--aircas-color-accent-cyan-shadow);
}

.brand-logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.12);
}

.brand h1 {
  margin: 0;
  color: var(--aircas-color-accent-green);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-shadow: 0 0 12px var(--aircas-color-accent-green-shadow);
}

.headline {
  margin-top: 44px;

  h2 {
    max-width: 720px;
    margin: 0 0 12px;
    font-size: 48px;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.2;
    color: var(--aircas-color-text-primary);
  }

  p {
    margin: 0;
    color: var(--aircas-color-accent-cyan);
    font-size: 17px;
    letter-spacing: 0.18em;
  }
}

.visual-area {
  position: relative;
  width: min(100%, 780px);
  margin-top: 20px;
}

.stack-visual {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  min-height: 470px;

  .stack-layer {
    position: absolute;
    left: 50%;
    display: block;
    width: 100%;
    height: auto;
    user-select: none;
    pointer-events: none;
    transform: translateX(-50%);
  }
}

.layer-4 {
  bottom: 0;
  z-index: 1;
}

.layer-3,
.layer-2,
.layer-1,
.layer-01,
.layer-02 {
  bottom: 10%;
}

.layer-3 {
  z-index: 2;
}
.layer-2 {
  z-index: 3;
}
.layer-1 {
  z-index: 4;
}
.layer-01 {
  z-index: 5;
}
.layer-02 {
  z-index: 6;
}

.login-card {
  width: 100%;
  max-width: 460px;
  justify-self: end;
  padding: 34px 32px 28px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 20px;
  background: linear-gradient(
    160deg,
    var(--aircas-color-card-background),
    var(--aircas-color-panel-background-deep)
  );
  box-shadow: 0 24px 60px var(--aircas-color-accent-blue-shadow),
    inset 0 1px 0 var(--aircas-color-accent-cyan-soft);

  h3 {
    margin: 0 0 26px;
    color: var(--aircas-color-text-primary);
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-align: center;
  }
}

.login-form {
  display: grid;
  gap: 14px;
}

.login-error {
  margin: 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
  line-height: 1.5;
}

.field {
  position: relative;

  input {
    width: 100%;
    min-height: 48px;
    border: 1px solid var(--aircas-color-border-soft);
    border-radius: 10px;
    padding: 12px 44px 12px 44px;
    outline: none;
    color: var(--aircas-color-text-primary);
    font-size: 15px;
    background: var(--aircas-color-input-background);
    transition: border-color 0.2s ease, box-shadow 0.2s ease,
      background-color 0.2s ease;

    &::placeholder {
      color: var(--aircas-color-text-placeholder);
    }

    &:focus {
      border-color: var(--aircas-color-focus-border);
      background: var(--aircas-color-panel-background);
      box-shadow: 0 0 0 3px var(--aircas-color-accent-cyan-soft);
    }
  }
}

.password-input {
  &::-ms-reveal,
  &::-ms-clear,
  &::-webkit-credentials-auto-fill-button,
  &::-webkit-textfield-decoration-container {
    display: none;
  }
}

.field-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  color: var(--aircas-color-text-secondary);
  pointer-events: none;
  transform: translateY(-50%);

  svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.7;
  }
}

.eye {
  position: absolute;
  top: 50%;
  right: 10px;
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  place-items: center;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  cursor: pointer;
  transform: translateY(-50%);
  transition: color 0.2s ease, background-color 0.2s ease;

  &:hover,
  &:focus-visible {
    color: var(--aircas-color-accent-cyan);
    background: var(--aircas-color-accent-cyan-soft);
  }

  &:focus-visible {
    outline: 2px solid var(--aircas-color-accent-cyan);
    outline-offset: 2px;
  }

  svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.9;
  }
}

.submit {
  min-height: 48px;
  margin-top: 6px;
  border: 0;
  border-radius: 10px;
  color: var(--aircas-color-text-inverse);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.28em;
  background: linear-gradient(
    100deg,
    var(--aircas-color-accent-cyan),
    var(--aircas-color-accent-blue)
  );
  box-shadow: 0 10px 24px var(--aircas-color-accent-blue-shadow);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;

  &:hover {
    filter: brightness(1.08);
    box-shadow: 0 14px 30px var(--aircas-color-accent-blue-shadow);
    transform: translateY(-2px);
  }

  &:active {
    box-shadow: 0 6px 14px var(--aircas-color-accent-blue-shadow);
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid var(--aircas-color-accent-cyan);
    outline-offset: 3px;
  }

  &:disabled {
    color: var(--aircas-color-text-disabled);
    background: var(--aircas-color-selected-background);
    box-shadow: none;
    cursor: not-allowed;
    transform: none;
  }
}

.core-title {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
  margin: 28px 0 16px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  letter-spacing: 0.12em;

  span {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--aircas-color-accent-cyan),
      transparent
    );
  }

  p {
    margin: 0;
  }
}

.core-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    padding: 12px 6px;
    border: 1px solid var(--aircas-color-accent-cyan-border);
    border-radius: 10px;
    text-align: center;
    background: var(--aircas-color-accent-cyan-fill);
  }

  strong {
    display: block;
    margin-bottom: 4px;
    color: var(--aircas-color-accent-green);
    font-size: 14px;
  }

  small {
    color: var(--aircas-color-text-secondary);
    font-size: 11px;
  }
}

.core-mark {
  display: block;
  width: 20px;
  height: 20px;
  margin-bottom: 6px;
  color: var(--aircas-color-accent-cyan);

  svg {
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.7;
  }
}

.copyright {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  text-align: center;
}
</style>
