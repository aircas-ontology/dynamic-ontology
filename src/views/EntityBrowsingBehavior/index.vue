<template>
  <section class="entity-browsing-dewey-behavior" aria-label="实体浏览行为（杜威号动力层）">
    <template v-if="currentView === 'overview'">
      <BehaviorCategoryPanel :groups="groupSummaries" :selected-category-id="selectedCategoryId" @select="selectCategory" />
      <BehaviorInstancePanel
        :category-name="activeCategoryName"
        :function-field-label="functionFieldLabel"
        :is-behavior-tree-category="selectedCategoryId === 'behavior-tree'"
        :instances="filteredInstances"
        :keyword="keyword"
        :implementation-mode="implementationMode"
        :implementation-mode-options="implementationModeOptions"
        :service-status="serviceStatus"
        @update:keyword="keyword = $event"
        @update:implementation-mode="implementationMode = $event"
        @update:service-status="serviceStatus = $event"
        @execution-records="openExecutionRecords"
        @call-test="openCallTest"
        @ai-provenance="openCallTest"
      />
    </template>

    <DeweyBehaviorExecutionPanel v-else-if="currentView === 'execution-records' && selectedInstance" :instance="selectedInstance" @back="returnToOverview" />

    <BehaviorCallTest
      v-else-if="currentView === 'call-test' && selectedInstance && isTrajectoryPredictionCallTest"
      :instance="selectedInstance"
      @back="returnToOverview"
    />

    <DeweyBehaviorCallTestPanel v-else-if="currentView === 'call-test' && selectedInstance" :instance="selectedInstance" @back="returnToOverview" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import BehaviorCategoryPanel from "./components/BehaviorCategoryPanel.vue";
import BehaviorInstancePanel from "./components/BehaviorInstancePanel.vue";
import DeweyBehaviorCallTestPanel from "./components/DeweyBehaviorCallTestPanel.vue";
import DeweyBehaviorExecutionPanel from "./components/DeweyBehaviorExecutionPanel.vue";
import BehaviorCallTest from "./call-test/BehaviorCallTest.vue";
import { powerBehaviorCategories, powerBehaviorGroups, powerBehaviorInstances } from "@/mocks/entityBrowsingDeweyBehavior/deweyBehaviorMock";
import { CALL_TEST_FUNCTION_PROFILE } from "@/mocks/entityBrowsingDeweyBehavior/deweyCallTestMock";
import type { BehaviorImplementationMode, BehaviorServiceStatus, PowerBehaviorCategoryId, PowerBehaviorGroupSummary, PowerBehaviorInstance } from "@/types";

/** 实体浏览行为 Tab：静态复用杜威号动力层分类 / 实例 / 执行记录 / 调用测试（含交换内容），不调接口。
 *  态势评估「轨迹预测」打开图一完整调用测试页（输入面板 + 地图结果）。 */

const selectedCategoryId = ref<PowerBehaviorCategoryId>("perception");
const keyword = ref("");
const implementationMode = ref<BehaviorImplementationMode | "">("");
const serviceStatus = ref<BehaviorServiceStatus | "">("");
const currentView = ref<"overview" | "execution-records" | "call-test">("overview");
const selectedInstance = ref<PowerBehaviorInstance | null>(null);
const isTrajectoryPredictionCallTest = computed(() => selectedInstance.value?.mountedFunction === CALL_TEST_FUNCTION_PROFILE.mountedFunction);

const applicationImplementationModes: readonly BehaviorImplementationMode[] = ["内置函数", "规则引擎", "微服务", "模型服务", "HTTP服务", "容器镜像", "MCP工具"];
const behaviorTreeImplementationModes: readonly BehaviorImplementationMode[] = ["规则触发", "定时调度"];

const groupSummaries = computed<PowerBehaviorGroupSummary[]>(() =>
  powerBehaviorGroups.map((group) => {
    const categories = powerBehaviorCategories
      .filter((category) => category.groupId === group.id)
      .map((category) => ({
        ...category,
        count: powerBehaviorInstances.filter((instance) => instance.categoryId === category.id).length,
      }));
    return {
      ...group,
      count: categories.reduce((total, category) => total + category.count, 0),
      categories,
    };
  }),
);

const activeCategoryName = computed(() => {
  for (const group of groupSummaries.value) {
    const category = group.categories.find((item) => item.id === selectedCategoryId.value);
    if (category) return category.name;
  }
  return "实例行为";
});

const functionFieldLabel = computed(() => {
  if (selectedCategoryId.value === "behavior-tree") return "关联行为";
  const category = powerBehaviorCategories.find((item) => item.id === selectedCategoryId.value);
  return category?.groupId === "basic-operation" ? "更新接口" : "挂载函数";
});

const implementationModeOptions = computed(() =>
  selectedCategoryId.value === "behavior-tree" ? behaviorTreeImplementationModes : applicationImplementationModes,
);

const filteredInstances = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase();
  return powerBehaviorInstances.filter((instance) => {
    const matchesCategory = instance.categoryId === selectedCategoryId.value;
    const matchesKeyword = !normalizedKeyword || instance.name.toLocaleLowerCase().includes(normalizedKeyword);
    const matchesImplementation = !implementationMode.value || instance.implementationMode === implementationMode.value;
    const matchesStatus = !serviceStatus.value || instance.serviceStatus === serviceStatus.value;
    return matchesCategory && matchesKeyword && matchesImplementation && matchesStatus;
  });
});

/**
 * @description 切换行为分类并清理不适用的筛选条件。
 * @param categoryId 所选分类。
 */
function selectCategory(categoryId: PowerBehaviorCategoryId): void {
  selectedCategoryId.value = categoryId;
  if (implementationMode.value && !implementationModeOptions.value.includes(implementationMode.value)) {
    implementationMode.value = "";
  }
}

/**
 * @description 打开所选行为的执行记录。
 * @param instance 当前行为。
 */
function openExecutionRecords(instance: PowerBehaviorInstance): void {
  selectedInstance.value = instance;
  currentView.value = "execution-records";
}

/**
 * @description 打开所选行为的调用测试。
 * @param instance 当前行为。
 */
function openCallTest(instance: PowerBehaviorInstance): void {
  selectedInstance.value = instance;
  currentView.value = "call-test";
}

/**
 * @description 返回行为列表。
 */
function returnToOverview(): void {
  currentView.value = "overview";
}
</script>

<style scoped lang="scss">
.entity-browsing-dewey-behavior {
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 8px;
  overflow: hidden;
}

.entity-browsing-dewey-behavior > :only-child {
  grid-column: 1 / -1;
}

@media (max-width: 1600px) {
  .entity-browsing-dewey-behavior {
    grid-template-columns: 250px minmax(0, 1fr);
  }
}
</style>
