<template>
  <section class="call-test-input">
    <header class="call-test-input__title-row">
      <h3>调用测试</h3>
      <el-tag type="success" effect="dark" size="small">{{ profile.sandboxName }}</el-tag>
    </header>

    <div class="call-test-input__write-back">
      <i class="fa fa-shield" aria-hidden="true"></i>
      <strong>{{ writeBack ? "写回原本体实例" : "不写回实例" }}</strong>
      <el-switch :model-value="writeBack" :disabled="disabled" title="是否写回原本体实例" @update:model-value="updateWriteBack" />
      <span>测试输出仅用于验证；开启后也只模拟写回。</span>
    </div>

    <el-scrollbar class="call-test-input__scrollbar">
      <section class="call-test-input__section">
        <h4>函数实现</h4>
        <dl class="call-test-input__profile">
          <div>
            <dt>行为类型</dt>
            <dd>{{ profile.behaviorType }}</dd>
          </div>
          <div>
            <dt>挂载函数</dt>
            <dd>{{ profile.mountedFunction }}</dd>
          </div>
          <div>
            <dt>实现形态</dt>
            <dd>{{ profile.implementationMode }}</dd>
          </div>
          <div>
            <dt>MCP服务</dt>
            <dd>{{ profile.mcpService }}</dd>
          </div>
          <div>
            <dt>Tool名称</dt>
            <dd>{{ profile.toolName }}</dd>
          </div>
          <div>
            <dt>版本</dt>
            <dd>{{ profile.version }}</dd>
          </div>
          <div>
            <dt>服务状态</dt>
            <dd :class="serviceClass">{{ profile.serviceStatus }}</dd>
          </div>
          <div>
            <dt>健康检查</dt>
            <dd :class="healthClass">{{ profile.healthStatus }}</dd>
          </div>
        </dl>
      </section>

      <section class="call-test-input__section">
        <h4>输入来源</h4>
        <el-tabs :model-value="source" stretch @update:model-value="changeSource">
          <el-tab-pane label="当前实例" name="current" :disabled="disabled" />
          <el-tab-pane label="历史复刻" name="history" :disabled="disabled" />
          <el-tab-pane label="自定义输入" name="custom" :disabled="disabled" />
        </el-tabs>
        <el-form class="call-test-input__form" label-position="left" label-width="86px" size="small">
          <el-form-item label="起始网格"
            ><el-input :model-value="input.startGrid" :disabled="disabled" @update:model-value="updateField('startGrid', $event)"
          /></el-form-item>
          <el-form-item label="当前位置">
            <div class="call-test-input__coordinate">
              <el-input-number
                :model-value="input.longitude"
                :precision="4"
                :step="0.01"
                :disabled="disabled"
                controls-position="right"
                title="经度"
                @update:model-value="updateNumber('longitude', $event)"
              />
              <el-input-number
                :model-value="input.latitude"
                :precision="4"
                :step="0.01"
                :disabled="disabled"
                controls-position="right"
                title="纬度"
                @update:model-value="updateNumber('latitude', $event)"
              />
            </div>
          </el-form-item>
          <el-form-item label="当前航向"
            ><el-input-number
              :model-value="input.heading"
              :min="0"
              :max="359"
              :disabled="disabled"
              controls-position="right"
              @update:model-value="updateNumber('heading', $event)"
          /></el-form-item>
          <el-form-item label="当前航速"
            ><el-input-number
              :model-value="input.speedKnots"
              :min="0.1"
              :precision="1"
              :step="0.1"
              :disabled="disabled"
              controls-position="right"
              @update:model-value="updateNumber('speedKnots', $event)"
            /><span class="call-test-input__unit">节</span></el-form-item
          >
          <el-form-item label="轨迹点数"
            ><el-input-number
              :model-value="input.recentTrackPoints"
              :min="1"
              :step="1"
              :disabled="disabled"
              controls-position="right"
              @update:model-value="updateNumber('recentTrackPoints', $event)"
          /></el-form-item>
          <el-form-item label="环境数据"
            ><el-input :model-value="input.envDataVersion" :disabled="disabled" @update:model-value="updateField('envDataVersion', $event)"
          /></el-form-item>
          <el-form-item label="预测配置"
            ><el-input :model-value="`${input.predictionHours}小时 / ${input.pointIntervalMinutes}分钟间隔`" disabled
          /></el-form-item>
        </el-form>
      </section>

      <section class="call-test-input__section">
        <button class="call-test-input__json-toggle" type="button" :aria-expanded="jsonExpanded" @click="jsonExpanded = !jsonExpanded">
          <span><i class="fa" :class="jsonExpanded ? 'fa-angle-down' : 'fa-angle-right'" aria-hidden="true"></i> 查看完整输入 JSON</span>
          <i class="fa fa-code" aria-hidden="true"></i>
        </button>
        <pre v-if="jsonExpanded" class="call-test-input__json">{{ inputJson }}</pre>
      </section>
    </el-scrollbar>

    <footer class="call-test-input__actions">
      <el-button :disabled="disabled" @click="emit('reset')"><i class="fa fa-refresh" aria-hidden="true"></i>重置参数</el-button>
      <el-button :loading="checking" :disabled="disabled" @click="emit('checkService')"><i class="fa fa-heartbeat" aria-hidden="true"></i>检查服务</el-button>
      <el-button type="primary" :loading="running" :disabled="disabled || !serviceHealthy" @click="emit('execute')"
        ><i class="fa fa-play" aria-hidden="true"></i>执行测试</el-button
      >
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { CallTestFunctionProfile, CallTestInput, CallTestInputSource } from "@/types/entityBrowsingDeweyCallTest";

const props = defineProps<{
  profile: CallTestFunctionProfile;
  input: CallTestInput;
  source: CallTestInputSource;
  writeBack: boolean;
  inputJson: string;
  disabled: boolean;
  checking: boolean;
  running: boolean;
  serviceHealthy: boolean;
}>();

const emit = defineEmits<{
  "update:input": [value: CallTestInput];
  "update:source": [value: CallTestInputSource];
  "update:writeBack": [value: boolean];
  reset: [];
  checkService: [];
  execute: [];
}>();

const jsonExpanded = ref(true);
const serviceClass = computed(() =>
  props.profile.serviceStatus === "在线" ? "is-success" : props.profile.serviceStatus === "已注册" ? "is-neutral" : "is-failed",
);
const healthClass = computed(() =>
  props.profile.healthStatus === "正常" ? "is-success" : props.profile.healthStatus === "未检查" ? "is-neutral" : "is-failed",
);

const updateField = (key: "startGrid" | "envDataVersion", value: string): void => emit("update:input", { ...props.input, [key]: value });
const updateNumber = (key: "longitude" | "latitude" | "heading" | "speedKnots" | "recentTrackPoints", value: number | undefined): void => {
  if (value !== undefined) emit("update:input", { ...props.input, [key]: value });
};
const changeSource = (value: string | number): void => emit("update:source", String(value) as CallTestInputSource);
const updateWriteBack = (value: string | number | boolean): void => emit("update:writeBack", Boolean(value));
</script>

<style scoped lang="scss">
.call-test-input {
  display: grid;
  min-width: 0;
  min-height: 0;
  height: 100%;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  background: var(--aircas-color-panel-overlay-deep);
  overflow: hidden;
}
.call-test-input__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--aircas-color-divider);
  background: var(--aircas-color-section-header);
  h3 {
    margin: 0;
    color: var(--aircas-color-text-primary);
    font-size: 17px;
  }
}
.call-test-input__write-back {
  display: grid;
  grid-template-columns: auto auto auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  margin: 8px;
  padding: 9px 12px;
  border: 1px solid var(--aircas-color-green-border);
  border-radius: 5px;
  color: var(--aircas-color-success);
  background: var(--aircas-color-green-soft);
  font-size: 13px;
  span {
    color: var(--aircas-color-text-muted);
    font-size: 12px;
  }
}
.call-test-input__scrollbar {
  min-height: 0;
}
.call-test-input__section {
  margin: 0 8px 8px;
  padding: 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 5px;
  background: var(--aircas-color-section-background);
  h4 {
    margin: 0 0 9px;
    color: var(--aircas-color-text-primary);
    font-size: 14px;
  }
}
.call-test-input__profile {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  div {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    padding: 6px 8px;
    border-bottom: 1px solid var(--aircas-color-divider);
  }
  dt {
    color: var(--aircas-color-text-muted);
  }
  dd {
    min-width: 0;
    margin: 0;
    color: var(--aircas-color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .is-success {
    color: var(--aircas-color-success);
  }
  .is-failed {
    color: var(--aircas-color-warning);
  }
  .is-neutral {
    color: var(--aircas-color-neutral);
  }
}
.call-test-input__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
  :deep(.el-form-item) {
    margin-bottom: 8px;
  }
  :deep(.el-input-number) {
    width: 100%;
  }
}
.call-test-input__coordinate {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}
.call-test-input__unit {
  margin-left: 6px;
  color: var(--aircas-color-text-muted);
}
.call-test-input__json-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 2px 0;
  border: 0;
  color: var(--aircas-color-text-secondary);
  background: transparent;
  cursor: pointer;
}
.call-test-input__json {
  max-height: 190px;
  margin: 9px 0 0;
  padding: 10px;
  overflow: auto;
  border: 1px solid var(--aircas-color-divider);
  border-radius: 4px;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-panel-background-deep);
  font: 12px/1.55 monospace;
}
.call-test-input__actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1.25fr;
  gap: 8px;
  padding: 9px;
  border-top: 1px solid var(--aircas-color-divider);
  .el-button {
    margin: 0;
  }
  i {
    margin-right: 6px;
  }
}
@media (max-width: 1600px) {
  .call-test-input__profile,
  .call-test-input__form {
    grid-template-columns: 1fr;
  }
  .call-test-input__write-back {
    grid-template-columns: auto auto auto;
    span {
      grid-column: 1 / -1;
    }
  }
}
</style>
