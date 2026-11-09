<template>
  <section class="behavior-instance-panel">
    <header class="behavior-instance-panel__header">
      <div class="behavior-instance-panel__heading">
        <h2>实例行为</h2>
        <!-- <p>展示杜威号当前可调用及已发布的{{ categoryName }}行为</p> -->
      </div>

      <div class="behavior-instance-panel__filters" aria-label="实例行为筛选条件">
        <el-input
          class="behavior-instance-panel__search"
          :model-value="keyword"
          clearable
          placeholder="检索行为实例名称"
          ariaLabel="检索行为实例名称"
          @update:model-value="updateKeyword"
          size="small"
        >
          <template #prefix>
            <i class="fa fa-search" aria-hidden="true"></i>
          </template>
        </el-input>

        <el-select
          class="behavior-instance-panel__select"
          :model-value="implementationMode"
          clearable
          :placeholder="implementationFilterLabel"
          :ariaLabel="`按${implementationFilterLabel}筛选`"
          @update:model-value="updateImplementationMode"
          size="small"
        >
          <el-option v-for="mode in implementationModeOptions" :key="mode" :label="mode" :value="mode" />
        </el-select>

        <el-select
          class="behavior-instance-panel__select"
          :model-value="serviceStatus"
          clearable
          placeholder="服务状态"
          ariaLabel="按服务状态筛选"
          @update:model-value="updateServiceStatus"
          size="small"
        >
          <el-option v-for="status in serviceStatuses" :key="status" :label="status" :value="status" />
        </el-select>
      </div>
    </header>

    <el-scrollbar class="behavior-instance-panel__scrollbar">
      <div v-if="instances.length" class="behavior-instance-panel__grid">
        <article v-for="instance in instances" :key="instance.id" class="behavior-instance-card" :class="`behavior-instance-card--${instance.categoryId}`">
          <header class="behavior-instance-card__header">
            <span class="behavior-instance-card__icon-wrap" aria-hidden="true">
              <span class="behavior-instance-card__icon" :style="iconStyle(instance.icon)"></span>
            </span>
            <el-tooltip :content="instance.name" placement="top" :show-after="500">
              <h3>{{ instance.name }}</h3>
            </el-tooltip>
            <el-tag class="behavior-instance-card__type" size="small" effect="plain">
              {{ instance.type }}
            </el-tag>
          </header>

          <div class="behavior-instance-card__body">
            <dl class="behavior-instance-card__meta">
              <div class="behavior-instance-card__meta-row">
                <dt>{{ functionFieldLabel }}</dt>
                <el-tooltip :content="relatedBehaviorText(instance)" placement="top" :show-after="500">
                  <dd :class="instance.relatedBehaviors?.length ? 'behavior-instance-card__related' : 'behavior-instance-card__function'">
                    {{ relatedBehaviorText(instance) }}
                  </dd>
                </el-tooltip>
              </div>
              <div class="behavior-instance-card__meta-row">
                <dt>{{ modeFieldLabel }}</dt>
                <dd>{{ instance.implementationMode }}</dd>
              </div>
              <div v-if="isBehaviorTreeCategory && instance.buildMethod" class="behavior-instance-card__meta-row">
                <dt>实现方式</dt>
                <dd>
                  <button
                    v-if="instance.buildMethod === 'AI抽取'"
                    type="button"
                    class="behavior-instance-card__ai-link"
                    :aria-label="`查看${instance.name}AI抽取溯源`"
                    @click="emit('ai-provenance', instance)"
                  >
                    <i class="fa fa-magic" aria-hidden="true"></i>
                    <span>{{ instance.buildMethod }}</span>
                  </button>
                  <span v-else>{{ instance.buildMethod }}</span>
                </dd>
              </div>
            </dl>

            <dl class="behavior-instance-card__meta behavior-instance-card__meta--status">
              <div class="behavior-instance-card__meta-row">
                <dt>服务状态</dt>
                <dd class="behavior-instance-card__status" :class="statusClass(instance.serviceStatus)">
                  <span aria-hidden="true"></span>
                  {{ instance.serviceStatus }}
                </dd>
              </div>
              <div class="behavior-instance-card__meta-row">
                <dt>执行次数</dt>
                <dd>{{ instance.executionCount }} 次</dd>
              </div>
              <div class="behavior-instance-card__meta-row">
                <dt>发布时间</dt>
                <dd>{{ instance.publishedAt }}</dd>
              </div>
            </dl>
          </div>

          <footer class="behavior-instance-card__actions">
            <el-button @click="emit('execution-records', instance)">
              <i class="fa fa-list-alt" aria-hidden="true"></i>
              <span>执行记录</span>
              <i class="fa fa-angle-right" aria-hidden="true"></i>
            </el-button>
            <el-button @click="emit('call-test', instance)">
              <i class="fa fa-terminal" aria-hidden="true"></i>
              <span>调用测试</span>
              <i class="fa fa-arrow-right" aria-hidden="true"></i>
            </el-button>
          </footer>
        </article>
      </div>

      <el-empty v-else description="当前筛选条件下暂无实例行为" />
    </el-scrollbar>
  </section>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from "vue";
import type { BehaviorImplementationMode, BehaviorServiceStatus, PowerBehaviorInstance } from "@/types";

const props = defineProps<{
  categoryName: string;
  functionFieldLabel: string;
  isBehaviorTreeCategory: boolean;
  instances: readonly PowerBehaviorInstance[];
  keyword: string;
  implementationMode: BehaviorImplementationMode | "";
  implementationModeOptions: readonly BehaviorImplementationMode[];
  serviceStatus: BehaviorServiceStatus | "";
}>();

const emit = defineEmits<{
  "update:keyword": [value: string];
  "update:implementation-mode": [value: BehaviorImplementationMode | ""];
  "update:service-status": [value: BehaviorServiceStatus | ""];
  "execution-records": [instance: PowerBehaviorInstance];
  "call-test": [instance: PowerBehaviorInstance];
  "ai-provenance": [instance: PowerBehaviorInstance];
}>();

const implementationModes: readonly BehaviorImplementationMode[] = [
  "内置函数",
  "规则引擎",
  "微服务",
  "模型服务",
  "HTTP服务",
  "容器镜像",
  "MCP工具",
  "规则触发",
  "定时调度",
];
const serviceStatuses: readonly BehaviorServiceStatus[] = ["在线", "维护中", "已停用", "已注册"];

const modeFieldLabel = computed<string>(() => (props.isBehaviorTreeCategory ? "触发方式" : "实现形态"));
const implementationFilterLabel = computed<string>(() => (props.isBehaviorTreeCategory ? "触发方式" : "实现形态"));

const isImplementationMode = (value: unknown): value is BehaviorImplementationMode =>
  typeof value === "string" && implementationModes.includes(value as BehaviorImplementationMode);

const isServiceStatus = (value: unknown): value is BehaviorServiceStatus =>
  typeof value === "string" && serviceStatuses.includes(value as BehaviorServiceStatus);

const updateKeyword = (value: string): void => emit("update:keyword", value);

const updateImplementationMode = (value: unknown): void => {
  emit("update:implementation-mode", isImplementationMode(value) ? value : "");
};

const updateServiceStatus = (value: unknown): void => {
  emit("update:service-status", isServiceStatus(value) ? value : "");
};

const relatedBehaviorText = (instance: PowerBehaviorInstance): string =>
  instance.relatedBehaviors?.length ? instance.relatedBehaviors.join("、") : instance.mountedFunction;

const iconStyle = (icon: string): CSSProperties => ({
  maskImage: `url(${icon})`,
  WebkitMaskImage: `url(${icon})`,
});

const statusClass = (status: BehaviorServiceStatus): string => {
  const classNames: Record<BehaviorServiceStatus, string> = {
    在线: "is-online",
    维护中: "is-maintenance",
    已停用: "is-disabled",
    已注册: "is-online",
  };

  return classNames[status];
};
</script>

<style scoped lang="scss">
.behavior-instance-panel {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
  box-shadow: inset 0 0 28px var(--aircas-color-effect-primary-shadow);
}

.behavior-instance-panel__header {
  display: flex;
  min-width: 0;
  height: 38px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 10px;
  border-bottom: 1px solid var(--aircas-color-border-light);
  background: var(--aircas-color-section-header);
}

.behavior-instance-panel__heading {
  min-width: 180px;

  h2,
  p {
    margin: 0;
  }

  h2 {
    color: var(--aircas-color-text-primary);
    font-size: 16px;
    font-weight: 600;
  }

  p {
    margin-top: 2px;
    overflow: hidden;
    color: var(--aircas-color-text-muted);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.behavior-instance-panel__filters {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(190px, 230px) 118px 118px;
  gap: 8px;
}

.behavior-instance-panel__search,
.behavior-instance-panel__select {
  --el-input-bg-color: var(--aircas-color-input-background);
  --el-input-border-color: var(--aircas-color-border-soft);
  --el-input-hover-border-color: var(--aircas-color-border-highlight);
  --el-input-focus-border-color: var(--aircas-color-accent-cyan);
  --el-input-text-color: var(--aircas-color-text-primary);
  --el-input-placeholder-color: var(--aircas-color-text-muted);
  --el-fill-color-blank: var(--aircas-color-input-background);
  --el-border-color: var(--aircas-color-border-soft);
  --el-border-color-hover: var(--aircas-color-border-highlight);
  --el-text-color-regular: var(--aircas-color-text-primary);
  --el-text-color-placeholder: var(--aircas-color-text-muted);
}

.behavior-instance-panel__search :deep(.el-input__wrapper),
.behavior-instance-panel__select :deep(.el-select__wrapper) {
  min-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 12px;
}

.behavior-instance-panel__scrollbar {
  min-height: 0;
}

.behavior-instance-panel__grid {
  display: grid;
  padding: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.behavior-instance-card {
  display: grid;
  min-width: 0;
  min-height: 210px;
  grid-template-rows: auto minmax(0, 1fr) 34px;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 5px;
  background: var(--aircas-color-card-background);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.behavior-instance-card:hover {
  border-color: var(--aircas-color-border-highlight);
  box-shadow: 0 0 14px var(--aircas-color-effect-primary-shadow);
  transform: translateY(-1px);
}

.behavior-instance-card__header {
  display: grid;
  min-width: 0;
  min-height: 50px;
  padding: 7px 8px;
  grid-template-columns: 30px minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid var(--aircas-color-border-light);

  h3 {
    margin: 0;
    overflow: hidden;
    color: var(--aircas-color-text-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.behavior-instance-card__icon-wrap {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid var(--aircas-color-effect-purple-border);
  border-radius: 50%;
  color: var(--aircas-color-accent-purple);
  background: var(--aircas-color-effect-purple-soft);
  box-shadow: 0 0 10px var(--aircas-color-effect-purple-shadow);
}

.behavior-instance-card__icon {
  width: 18px;
  height: 18px;
  background-color: currentColor;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
}

.behavior-instance-card__type {
  max-width: 82px;
  overflow: hidden;
  border-color: var(--aircas-color-effect-purple-border);
  color: var(--aircas-color-accent-purple);
  background: var(--aircas-color-effect-purple-soft);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-instance-card__body {
  display: grid;
  min-width: 0;
  padding: 8px;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}

.behavior-instance-card__meta {
  display: flex;
  min-width: 0;
  margin: 0;
  flex-direction: column;
  gap: 6px;
}

.behavior-instance-card__meta--status {
  padding-left: 8px;
  border-left: 1px solid var(--aircas-color-border-light);
}

.behavior-instance-card__meta-row {
  display: grid;
  min-width: 0;
  grid-template-columns: 52px minmax(0, 1fr);
  align-items: baseline;
  gap: 4px;

  dt,
  dd {
    margin: 0;
    font-size: 12px;
    line-height: 17px;
  }

  dt {
    color: var(--aircas-color-text-muted);
    white-space: nowrap;
  }

  dd {
    min-width: 0;
    overflow: hidden;
    color: var(--aircas-color-text-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.behavior-instance-card__function,
.behavior-instance-card__related {
  color: var(--aircas-color-accent-cyan);
}

.behavior-instance-card__function {
  font-family: "SFMono-Regular", Consolas, monospace;
}

.behavior-instance-card__ai-link {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 4px;
  padding: 0;
  overflow: hidden;
  border: 0;
  color: var(--aircas-color-accent-orange);
  background: transparent;
  font: inherit;
  line-height: inherit;
  cursor: pointer;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    color: var(--aircas-color-warning);
    text-decoration: underline;
  }
}

.behavior-instance-card__status {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  span {
    width: 6px;
    height: 6px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 7px currentColor;
  }
}

.behavior-instance-card__status.is-online {
  color: var(--aircas-color-success);
}

.behavior-instance-card__status.is-maintenance {
  color: var(--aircas-color-warning);
}

.behavior-instance-card__status.is-disabled {
  color: var(--aircas-color-text-secondary);
}

.behavior-instance-card__actions {
  display: grid;
  padding: 3px 5px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  border-top: 1px solid var(--aircas-color-border-light);
  background: var(--aircas-color-panel-background-deep);

  :deep(.el-button) {
    display: grid;
    min-width: 0;
    height: 26px;
    margin: 0;
    padding: 0 6px;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 4px;
    border-color: var(--aircas-color-border-soft);
    color: var(--aircas-color-text-secondary);
    background: var(--aircas-color-transparent);
    font-size: 12px;
  }

  :deep(.el-button:hover),
  :deep(.el-button:focus-visible) {
    border-color: var(--aircas-color-border-highlight);
    color: var(--aircas-color-accent-cyan);
    background: var(--aircas-color-hover-background);
  }
}

.behavior-instance-card__actions :deep(.el-button > span) {
  display: contents;
}

.behavior-instance-card--analysis .behavior-instance-card__icon-wrap {
  color: var(--aircas-color-accent-blue);
  border-color: var(--aircas-color-effect-blue-border);
  background: var(--aircas-color-effect-blue-soft);
  box-shadow: 0 0 10px var(--aircas-color-effect-blue-shadow);
}

.behavior-instance-card--planning .behavior-instance-card__icon-wrap {
  color: var(--aircas-color-accent-green);
  border-color: var(--aircas-color-effect-success-border);
  background: var(--aircas-color-effect-success-soft);
  box-shadow: 0 0 10px var(--aircas-color-effect-success-shadow);
}

.behavior-instance-card--command-control .behavior-instance-card__icon-wrap {
  color: var(--aircas-color-accent-cyan);
  border-color: var(--aircas-color-border-highlight);
  background: var(--aircas-color-section-background);
  box-shadow: 0 0 10px var(--aircas-color-effect-primary-shadow);
}

.behavior-instance-card--relation .behavior-instance-card__icon-wrap {
  color: var(--aircas-color-accent-orange);
  border-color: var(--aircas-color-effect-warning-border);
  background: var(--aircas-color-effect-warning-soft);
  box-shadow: 0 0 10px var(--aircas-color-effect-warning-shadow);
}

.behavior-instance-card--attribute-update .behavior-instance-card__icon-wrap {
  color: var(--aircas-color-accent-cyan);
  border-color: var(--aircas-color-effect-primary-border);
  background: var(--aircas-color-effect-primary-soft);
  box-shadow: 0 0 10px var(--aircas-color-effect-primary-shadow);
}

.behavior-instance-card--behavior-tree .behavior-instance-card__icon-wrap {
  color: var(--aircas-color-accent-green);
  border-color: var(--aircas-color-effect-success-border);
  background: var(--aircas-color-effect-success-soft);
  box-shadow: 0 0 10px var(--aircas-color-effect-success-shadow);
}

.behavior-instance-card--behavior-tree .behavior-instance-card__type {
  border-color: var(--aircas-color-effect-success-border);
  color: var(--aircas-color-accent-green);
  background: var(--aircas-color-effect-success-soft);
}

@media (max-width: 1600px) {
  .behavior-instance-panel__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .behavior-instance-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .behavior-instance-panel__filters {
    width: 100%;
  }

  .behavior-instance-panel__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
