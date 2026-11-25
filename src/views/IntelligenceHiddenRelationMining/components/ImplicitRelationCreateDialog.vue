<template>
  <el-dialog
    :model-value="visible"
    title="新增隐含关系"
    width="min(560px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @closed="resetDraft"
  >
    <el-form label-position="top" class="implicit-create">
      <el-form-item label="起始节点" required>
        <el-cascader
          :model-value="draft.startNode"
          :options="nodeGroups"
          :props="cascaderProps"
          placeholder="请选择本体空间及目标"
          filterable
          @update:model-value="updateDraftStartNode"
        />
      </el-form-item>
      <el-form-item label="关联类型" required>
        <el-select v-model="draft.relationType" placeholder="请选择关联类型">
          <el-option v-for="type in relationTypes" :key="type" :label="type" :value="type" />
        </el-select>
      </el-form-item>
      <el-form-item label="关系跳数" required>
        <div class="implicit-create__hops">
          <el-select v-model="draft.hops" multiple clearable placeholder="请选择关系跳数">
            <el-option v-for="hop in hopOptions" :key="hop" :label="`${hop} 跳`" :value="hop" />
          </el-select>
          <el-tooltip content="可多选 1～5 跳，按所选跳数匹配关系链路。" placement="top">
            <el-icon class="implicit-create__help"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <p class="implicit-create__hint">可多选 1～5 跳，按所选跳数匹配关系链路。</p>
      </el-form-item>
    </el-form>
    <p v-if="formError" class="implicit-create__error" role="alert">{{ formError }}</p>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="confirmDraft">保存并分析</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { QuestionFilled } from "@element-plus/icons-vue";
import type { CascaderValue } from "element-plus";
import {
  validateImplicitRelationDraft,
  type ImplicitRelationDraft,
  type ImplicitRelationNodeOption,
  type ValidatedImplicitRelation,
} from "../utils/implicitRelationDraft";

type CascaderNodeGroup = {
  value: string;
  label: string;
  children: Array<{ value: string; label: string }>;
};

const props = defineProps<{ visible: boolean; nodes: ImplicitRelationNodeOption[] }>();
const emit = defineEmits<{ "update:visible": [value: boolean]; create: [value: ValidatedImplicitRelation] }>();
const relationTypes = ["目标与装备", "目标与事件", "目标与相关实体"];
const hopOptions = ["1", "2", "3", "4", "5"];
const defaultRelationType = relationTypes[0] ?? "";
const cascaderProps = { expandTrigger: "click" } as const;
const draft = reactive<ImplicitRelationDraft>({ startNode: [], relationType: defaultRelationType, hops: ["2"] });
const formError = ref("");
const nodeGroups = computed<CascaderNodeGroup[]>(() => {
  const groups = new Map<string, CascaderNodeGroup>();
  for (const node of props.nodes) {
    let group = groups.get(node.spaceName);
    if (!group) {
      group = { value: node.spaceName, label: node.spaceName, children: [] };
      groups.set(node.spaceName, group);
    }
    group.children.push({ value: node.nodeName, label: node.nodeName });
  }
  return [...groups.values()];
});

watch(
  () => props.visible,
  (visible) => {
    if (visible) formError.value = "";
  },
);

/** @description 关闭弹窗后将表单恢复为默认状态。 */
function resetDraft(): void {
  draft.startNode = [];
  draft.relationType = defaultRelationType;
  draft.hops = ["2"];
  formError.value = "";
}

/**
 * @description 同步起始节点级联选择值，仅保留本体空间与目标节点两级路径。
 * @param value 级联选择组件回传的路径值。
 */
function updateDraftStartNode(value: CascaderValue | null | undefined): void {
  draft.startNode = Array.isArray(value) ? value.map(String) : [];
}

/** @description 校验表单并提交新增隐含关系数据。 */
function confirmDraft(): void {
  const result = validateImplicitRelationDraft(draft, props.nodes);
  formError.value = result.error;
  if (!result.value) return;
  emit("create", result.value);
  emit("update:visible", false);
}
</script>
<style scoped lang="scss">
.implicit-create :deep(.el-form-item) {
  margin-bottom: 18px;
}
.implicit-create :deep(.el-form-item__label) {
  font-size: 13px;
}
.implicit-create :deep(.el-select),
.implicit-create :deep(.el-cascader) {
  width: 100%;
}
.implicit-create__hops {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
}
.implicit-create__hops :deep(.el-select) {
  flex: 1;
}
.implicit-create__help {
  color: var(--aircas-color-text-secondary);
  cursor: help;
}
.implicit-create__hint {
  margin: 6px 0 0;
  color: var(--aircas-color-text-secondary);
  font-size: 11px;
  line-height: 1.5;
}
.implicit-create__error {
  margin: 0;
  color: var(--aircas-color-danger);
  font-size: 12px;
}
</style>
