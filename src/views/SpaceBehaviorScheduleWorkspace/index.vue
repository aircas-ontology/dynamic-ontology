<template>
  <section class="behavior-schedule-workspace" aria-label="行为调度管理">
    <div class="behavior-schedule-workspace__toolbar">
      <div class="behavior-schedule-workspace__filters">
        <el-input v-model="keyword" class="behavior-schedule-workspace__keyword" clearable placeholder="调度名称">
          <template #prefix
            ><el-icon><Search /></el-icon
          ></template>
        </el-input>
        <el-select v-model="strategy" class="behavior-schedule-workspace__strategy" clearable placeholder="调度策略">
          <el-option v-for="item in strategies" :key="item" :label="item" :value="item" />
        </el-select>
        <el-button @click="applyFilters">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
      <el-button :icon="Plus" @click="showPendingMessage('新建调度')">新建调度</el-button>
    </div>

    <div class="behavior-schedule-workspace__table-wrap">
      <el-table :data="filteredSchedules" class="aircas-table--accent-header behavior-schedule-workspace__table" height="100%" stripe>
        <el-table-column label="调度名称" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="behavior-schedule-workspace__name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="调度策略" width="110">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.strategy }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="关联对象" min-width="140" show-overflow-tooltip />
        <el-table-column prop="behavior" label="行为" min-width="140" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="300">
          <template #default>
            <div class="behavior-schedule-workspace__row-actions">
              <el-button size="small" @click="showPendingMessage('查看')">查看</el-button>
              <el-button size="small" @click="showPendingMessage('编辑')">编辑</el-button>
              <el-button size="small" @click="showPendingMessage('调用日志')">调用日志</el-button>
              <el-button size="small" @click="showPendingMessage('删除')">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="暂无调度" :image-size="72" /></template>
      </el-table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Plus, Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

type ScheduleRecord = { name: string; strategy: string; target: string; behavior: string; description: string; createdAt: string };

const schedules: readonly ScheduleRecord[] = [
  {
    name: "舰艇威胁响应调度",
    strategy: "规则调度",
    target: "驱逐舰 DDG-105",
    behavior: "威胁响应行为树",
    description: "检测到高威胁目标时触发响应策略",
    createdAt: "2026-08-12 09:30",
  },
  {
    name: "巡逻航线周期刷新",
    strategy: "周期调度",
    target: "驱逐舰 DDG-105",
    behavior: "巡逻航线规划",
    description: "按日周期刷新巡逻航线方案",
    createdAt: "2026-08-15 14:20",
  },
  {
    name: "高轨监视任务调度",
    strategy: "规则调度",
    target: "GSSAP-6 卫星",
    behavior: "高轨监视计划",
    description: "接近事件触发后启动监视任务",
    createdAt: "2026-08-18 11:05",
  },
  {
    name: "通信能力评估周期任务",
    strategy: "周期调度",
    target: "驱逐舰 DDG-105",
    behavior: "通信能力评估",
    description: "每周执行通信链路评估",
    createdAt: "2026-08-22 16:40",
  },
  {
    name: "轨迹关联规则调度",
    strategy: "规则调度",
    target: "驱逐舰 DDG-105",
    behavior: "轨迹关联",
    description: "多源航迹中实时触发关联算子",
    createdAt: "2026-08-26 10:15",
  },
  {
    name: "环境场周期采集",
    strategy: "周期调度",
    target: "海洋环境场",
    behavior: "海表风场采集",
    description: "按小时周期采集海表风场数据",
    createdAt: "2026-08-28 08:00",
  },
  {
    name: "机动事件响应调度",
    strategy: "规则调度",
    target: "USA-325 卫星",
    behavior: "机动事件分析",
    description: "检测到轨道机动后启动分析流程",
    createdAt: "2026-09-01 13:25",
  },
];

const keyword = ref("");
const strategy = ref("");
const appliedKeyword = ref("");
const appliedStrategy = ref("");
const strategies = ["规则调度", "周期调度"];
const filteredSchedules = computed(() =>
  schedules.filter(
    (item) => (!appliedKeyword.value || item.name.includes(appliedKeyword.value)) && (!appliedStrategy.value || item.strategy === appliedStrategy.value),
  ),
);

/** @description 应用调度名称和策略筛选条件。 */
function applyFilters() {
  appliedKeyword.value = keyword.value.trim();
  appliedStrategy.value = strategy.value;
}
/** @description 清空调度列表筛选条件。 */
function resetFilters() {
  keyword.value = "";
  strategy.value = "";
  applyFilters();
}
/** @description 为暂未接入的调度操作提供统一反馈。 @param action 操作名称。 */
function showPendingMessage(action: string) {
  ElMessage.info(`${action}页面暂未接入`);
}
</script>

<style scoped lang="scss">
.behavior-schedule-workspace {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  width: 100%;
  height: 100%;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.behavior-schedule-workspace__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-panel-background), var(--aircas-color-panel-background-deep));
  box-shadow: inset 0 0 18px var(--aircas-color-effect-page-glow);
}

:root:not(.dark) .behavior-schedule-workspace__toolbar {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}
.behavior-schedule-workspace__filters {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
  gap: 8px;
}
.behavior-schedule-workspace__keyword {
  width: min(220px, 24vw);
}
.behavior-schedule-workspace__strategy {
  width: 140px;
}
.behavior-schedule-workspace__table-wrap {
  min-width: 0;
  min-height: 0;
  flex: 1;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
}
.behavior-schedule-workspace__table {
  width: 100%;
  height: 100%;
}
.behavior-schedule-workspace__name {
  color: var(--aircas-color-text-primary);
  font-weight: 600;
}
.behavior-schedule-workspace__row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}
</style>
