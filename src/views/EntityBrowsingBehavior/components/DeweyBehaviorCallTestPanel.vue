<template>
  <section class="dewey-behavior-call-test" aria-label="调用测试">
    <header class="dewey-behavior-call-test__header">
      <el-button type="primary" plain @click="emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回实例行为
      </el-button>
      <div>
        <h2>{{ instance.name }} · 调用测试</h2>
        <p>静态沙箱 · 挂载函数 {{ instance.mountedFunction }} · {{ instance.implementationMode }}</p>
      </div>
      <el-button type="primary" :loading="running" @click="runCallTest">执行测试</el-button>
    </header>

    <div class="dewey-behavior-call-test__body">
      <article class="dewey-behavior-call-test__panel">
        <header>
          <h3>交换入参</h3>
          <el-tag size="small" effect="plain">input</el-tag>
        </header>
        <pre>{{ inputJson }}</pre>
      </article>

      <article class="dewey-behavior-call-test__panel">
        <header>
          <h3>交换出参</h3>
          <el-tag size="small" :type="runStatus === 'success' ? 'success' : 'info'" effect="plain">
            {{ runStatus === "idle" ? "待执行" : runStatus === "running" ? "执行中" : "output" }}
          </el-tag>
        </header>
        <pre>{{ outputJson }}</pre>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { resolveDeweyBehaviorExchange } from "@/mocks/entityBrowsingDeweyBehavior/deweyBehaviorExchangeMock";
import type { PowerBehaviorInstance } from "@/types/entityBrowsingDeweyBehavior";

const props = defineProps<{
  instance: PowerBehaviorInstance;
}>();

const emit = defineEmits<{
  back: [];
}>();

const exchange = computed(() => resolveDeweyBehaviorExchange(props.instance.mountedFunction));
const runStatus = ref<"idle" | "running" | "success">("idle");
const running = ref(false);
const resultOutput = ref<Record<string, unknown> | null>(null);

const inputJson = computed(() => JSON.stringify(exchange.value.input, null, 2));
const outputJson = computed(() =>
  JSON.stringify(resultOutput.value ?? { hint: "点击「执行测试」后展示静态出参" }, null, 2),
);

/**
 * @description 静态调用测试：短暂 loading 后回写交换出参。
 */
async function runCallTest(): Promise<void> {
  if (running.value) return;
  running.value = true;
  runStatus.value = "running";
  resultOutput.value = null;
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  resultOutput.value = exchange.value.output;
  runStatus.value = "success";
  running.value = false;
  ElMessage.success("调用测试完成（静态 Mock）");
}
</script>

<style scoped lang="scss">
.dewey-behavior-call-test {
  display: flex;
  min-width: 0;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
}

.dewey-behavior-call-test__header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 16px;
}

.dewey-behavior-call-test__header h2 {
  margin: 0;
  color: var(--aircas-color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.dewey-behavior-call-test__header p {
  margin: 4px 0 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}

.dewey-behavior-call-test__header > .el-button:last-child {
  margin-left: auto;
}

.dewey-behavior-call-test__body {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dewey-behavior-call-test__panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-card-background);
}

.dewey-behavior-call-test__panel > header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--aircas-color-border);
}

.dewey-behavior-call-test__panel h3 {
  margin: 0;
  color: var(--aircas-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.dewey-behavior-call-test__panel pre {
  margin: 0;
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 12px;
  color: var(--aircas-color-text-primary);
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
