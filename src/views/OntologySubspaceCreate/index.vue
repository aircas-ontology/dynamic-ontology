<template>
  <section class="ontology-subspace-create" aria-label="创建子空间">
    <aside class="ontology-subspace-create__tree-panel">
      <header class="ontology-subspace-create__tree-header">
        <div>
          <p class="ontology-subspace-create__eyebrow">OBJECT SCOPE</p>
          <h1>分类体系树</h1>
        </div>
        <span class="ontology-subspace-create__count">已选 {{ selectedCount }}</span>
      </header>
      <el-input v-model="keyword" class="aircas-input" clearable placeholder="搜索分类" ariaLabel="搜索分类" />
      <div class="ontology-subspace-create__tree-actions">
        <el-button class="aircas-button" size="small" @click="selectAll">全选对象</el-button>
        <el-button class="aircas-button" size="small" @click="clearSelection">清空选择</el-button>
      </div>
      <el-tree
        ref="treeRef"
        class="ontology-subspace-create__tree"
        node-key="id"
        show-checkbox
        default-expand-all
        :data="treeData"
        :props="treeProps"
        :filter-node-method="filterNode"
        @check="updateSelectedCount"
      />
      <footer class="ontology-subspace-create__tree-footer">
        <el-button class="aircas-button" @click="goBack">返回</el-button>
        <span>父空间：{{ parentSpaceName }}</span>
        <el-button class="aircas-button" type="primary" @click="goNext">下一步</el-button>
      </footer>
    </aside>

    <main class="ontology-subspace-create__content">
      <section class="ontology-subspace-create__identity">
        <el-form class="aircas-form ontology-subspace-create__identity-form" label-position="top">
          <el-form-item label="子空间名称"><el-input v-model="spaceName" class="aircas-input" ariaLabel="子空间名称" /></el-form-item>
          <el-form-item label="API 名称"><el-input v-model="apiName" class="aircas-input" ariaLabel="API 名称" /></el-form-item>
        </el-form>
        <ol class="ontology-subspace-create__flow" aria-label="子空间创建步骤">
          <li v-for="(step, index) in flowSteps" :key="step" :class="{ 'is-active': index === 0 }">
            <span>{{ index + 1 }}</span
            >{{ step }}
          </li>
        </ol>
      </section>
      <section class="ontology-subspace-create__empty-state" aria-live="polite">
        <p class="ontology-subspace-create__eyebrow">STEP 01</p>
        <h2>第一步：选择对象</h2>
        <p>请先在左侧分类体系树下勾选需要纳入子空间的本体对象。</p>
        <strong>{{ selectedCount }} 个对象</strong>
        <div class="ontology-subspace-create__empty-illustration" aria-hidden="true"><span>⌘</span><i></i><i></i><i></i></div>
        <small>请在左侧勾选本体对象</small>
      </section>
    </main>
    <button class="ontology-subspace-create__assistant" type="button" aria-label="打开 AI 助手" @click="openAssistant">✦<span>AI 助手</span></button>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, type TreeInstance } from "element-plus";
import { useRoute, useRouter } from "vue-router";

interface SubspaceTreeNode {
  id: string;
  label: string;
  children?: SubspaceTreeNode[];
}

const route = useRoute();
const router = useRouter();
const treeRef = ref<TreeInstance>();
const keyword = ref("");
const selectedIds = ref<string[]>([]);
const spaceName = ref(`${String(route.query.spaceName || "海军本体空间")}子空间`);
const apiName = ref(`subspace_${Date.now()}`);
const parentSpaceName = computed(() => String(route.query.spaceName || "海军本体空间"));
const treeProps = { children: "children", label: "label" };
const flowSteps = ["选择对象", "选择实例", "配置属性", "配置关系"];
const treeData: SubspaceTreeNode[] = [
  {
    id: "overview",
    label: "本体空间总览",
    children: [
      {
        id: "ship",
        label: "舰船",
        children: [
          {
            id: "carrier",
            label: "航空母舰",
            children: [
              { id: "ford", label: "福特级航空母舰(CVN)" },
              { id: "nimitz", label: "尼米兹级航空母舰(CVN)" },
            ],
          },
          {
            id: "destroyer",
            label: "驱逐舰",
            children: [
              { id: "burke", label: "阿利·伯克级驱逐舰(DDG)" },
              { id: "flight1", label: "阿利伯克级Flight-I驱逐舰(DDG)" },
              { id: "flight2", label: "阿利伯克级Flight-II驱逐舰(DDG)" },
              { id: "flight2a", label: "阿利伯克级Flight-IIA驱逐舰(DDG)" },
              { id: "flight3", label: "阿利伯克级Flight-III驱逐舰(DDG)" },
              { id: "zumwalt", label: "朱姆沃尔特级驱逐舰(DDG)" },
            ],
          },
          { id: "cruiser", label: "巡洋舰", children: [{ id: "ticonderoga", label: "提康德罗加级巡洋舰(CG)" }] },
          { id: "frigate", label: "护卫舰", children: [{ id: "constellation", label: "星座级护卫舰(FFG)" }] },
          {
            id: "submarine",
            label: "潜艇",
            children: [
              { id: "ohio", label: "俄亥俄级弹道导弹核潜艇(SSBN)" },
              { id: "virginia", label: "弗吉尼亚级攻击型核潜艇" },
            ],
          },
        ],
      },
    ],
  },
];
const selectedCount = computed(() => selectedIds.value.length);

/** @description 根据关键字过滤分类树节点。 @param value 当前搜索关键字。 @param data 当前树节点。 */
function filterNode(value: string, data: Record<string, unknown>) {
  const label = typeof data.label === "string" ? data.label : "";
  return !value || label.includes(value.trim());
}

/** @description 同步分类树的勾选对象数量。 */
function updateSelectedCount() {
  selectedIds.value = (treeRef.value?.getCheckedKeys(false) ?? []).map(String);
}

/** @description 全选当前分类体系树中的对象。 */
function selectAll() {
  treeRef.value?.setCheckedKeys(flattenNodes(treeData).map((node) => node.id));
  updateSelectedCount();
}

/** @description 清空当前分类体系树的勾选状态。 */
function clearSelection() {
  treeRef.value?.setCheckedKeys([]);
  updateSelectedCount();
}

/** @description 递归展开树节点，供全选使用。 @param nodes 待展开节点列表。 @returns 所有节点。 */
function flattenNodes(nodes: SubspaceTreeNode[]): SubspaceTreeNode[] {
  return nodes.flatMap((node) => [node, ...(node.children ? flattenNodes(node.children) : [])]);
}

/** @description 返回本体空间管理列表。 */
function goBack() {
  void router.push({ name: "OntologySpaceManagement" });
}

/** @description 校验对象选择并进入下一步。 */
function goNext() {
  if (!spaceName.value.trim() || !apiName.value.trim()) {
    ElMessage.warning("请填写子空间名称和 API 名称");
    return;
  }
  if (!selectedCount.value) {
    ElMessage.warning("请至少选择一个本体对象");
    return;
  }
  ElMessage.success(`已选择 ${selectedCount.value} 个对象，可继续配置子空间`);
}

/** @description 打开 AI 助手提示。 */
function openAssistant() {
  ElMessage.info("AI 助手将在后续步骤中提供子空间配置建议");
}

watch(keyword, (value) => treeRef.value?.filter(value));
</script>

<style scoped lang="scss">
.ontology-subspace-create {
  display: grid;
  min-width: 0;
  height: 100%;
  min-height: 0;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-page-background);
}
.ontology-subspace-create__tree-panel,
.ontology-subspace-create__content {
  min-width: 0;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-page-glow);
}
.ontology-subspace-create__tree-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 16px;
}
.ontology-subspace-create__tree-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 14px;
}
.ontology-subspace-create__tree-header h1 {
  margin: 3px 0 0;
  font-size: 18px;
}
.ontology-subspace-create__eyebrow {
  margin: 0;
  color: var(--aircas-color-accent-cyan);
  font-size: 11px;
  letter-spacing: 0.12em;
}
.ontology-subspace-create__count {
  color: var(--aircas-color-text-muted);
  font-size: 12px;
}
.ontology-subspace-create__tree-actions {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}
.ontology-subspace-create__tree-actions .el-button + .el-button {
  margin-left: 0;
}
.ontology-subspace-create__tree {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding: 4px 0;
  background: var(--aircas-color-transparent);
}
.ontology-subspace-create__tree :deep(.el-tree-node__content) {
  height: 32px;
  color: var(--aircas-color-text-secondary);
}
.ontology-subspace-create__tree :deep(.el-tree-node__content:hover),
.ontology-subspace-create__tree :deep(.el-tree-node:focus > .el-tree-node__content) {
  background: var(--aircas-color-hover-background);
}
.ontology-subspace-create__tree :deep(.el-checkbox__inner) {
  border-color: var(--aircas-color-border-soft);
  background: var(--aircas-color-input-background);
}
.ontology-subspace-create__tree-footer {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--aircas-color-divider);
}
.ontology-subspace-create__tree-footer span {
  min-width: 0;
  overflow: hidden;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ontology-subspace-create__content {
  display: flex;
  min-height: 0;
  flex-direction: column;
  padding: 16px;
  overflow: auto;
}
.ontology-subspace-create__identity {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 1.3fr;
  gap: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--aircas-color-divider);
}
.ontology-subspace-create__identity-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.ontology-subspace-create__identity-form .el-form-item {
  margin-bottom: 0;
}
.ontology-subspace-create__flow {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  align-items: start;
  margin: 0;
  padding: 4px 0 0;
  list-style: none;
}
.ontology-subspace-create__flow li {
  display: grid;
  justify-items: center;
  gap: 7px;
  color: var(--aircas-color-text-muted);
  font-size: 12px;
  text-align: center;
}
.ontology-subspace-create__flow li span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 50%;
}
.ontology-subspace-create__flow li.is-active {
  color: var(--aircas-color-accent-cyan);
}
.ontology-subspace-create__flow li.is-active span {
  border-color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-soft);
}
.ontology-subspace-create__empty-state {
  display: grid;
  flex: 1;
  place-content: center;
  justify-items: center;
  min-height: 360px;
  text-align: center;
}
.ontology-subspace-create__empty-state h2 {
  margin: 5px 0 8px;
  font-size: 20px;
}
.ontology-subspace-create__empty-state p:not(.ontology-subspace-create__eyebrow) {
  margin: 0;
  color: var(--aircas-color-text-secondary);
}
.ontology-subspace-create__empty-state strong {
  margin-top: 18px;
  color: var(--aircas-color-accent-cyan);
  font-size: 14px;
}
.ontology-subspace-create__empty-illustration {
  position: relative;
  display: grid;
  width: 180px;
  height: 100px;
  place-items: center;
  margin: 22px 0 10px;
  border: 1px dashed var(--aircas-color-border-soft);
  border-radius: 10px;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-panel-background-deep);
  font-size: 34px;
}
.ontology-subspace-create__empty-illustration i {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 1px solid var(--aircas-color-accent-purple);
  border-radius: 3px;
  background: var(--aircas-color-accent-purple-soft);
}
.ontology-subspace-create__empty-illustration i:nth-child(2) {
  top: 18px;
  left: 26px;
}
.ontology-subspace-create__empty-illustration i:nth-child(3) {
  top: 28px;
  right: 30px;
}
.ontology-subspace-create__empty-illustration i:nth-child(4) {
  bottom: 16px;
  left: 72px;
}
.ontology-subspace-create__empty-state small {
  color: var(--aircas-color-text-muted);
}
.ontology-subspace-create__assistant {
  position: fixed;
  right: 26px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 20px;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-panel-background);
  box-shadow: 0 8px 20px var(--aircas-color-divider);
  cursor: pointer;
}
@media (max-width: 1100px) {
  .ontology-subspace-create {
    grid-template-columns: 300px minmax(0, 1fr);
  }
  .ontology-subspace-create__identity {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .ontology-subspace-create {
    display: flex;
    flex-direction: column;
    padding: 12px;
  }
  .ontology-subspace-create__tree-panel {
    min-height: 420px;
  }
  .ontology-subspace-create__identity-form {
    grid-template-columns: 1fr;
  }
}
</style>
