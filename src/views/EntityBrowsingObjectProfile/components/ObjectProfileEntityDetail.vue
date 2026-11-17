<template>
  <section class="object-profile-entity-detail" aria-label="实体详情">
    <header class="object-profile-entity-detail__header">
      <div class="object-profile-entity-detail__identity">
        <h2 :title="entityName">{{ entityName }}</h2>
        <span>实体详情 · {{ instanceId }}</span>
      </div>
      <el-button plain :icon="ArrowLeft" @click="emit('back')">返回实体列表</el-button>
    </header>
    <div class="object-profile-entity-detail__top">
      <aside class="object-profile-entity-detail__panel object-profile-entity-detail__categories" aria-label="属性分类树">
        <h3>属性分类</h3>
        <el-input v-model="categorySearch" clearable placeholder="搜索属性分类" ariaLabel="搜索属性分类" />
        <div v-if="categoryStatus === 'loading'" class="object-profile-entity-detail__state" role="status"><AircasLoading>正在加载分类…</AircasLoading></div>
        <div v-else-if="categoryStatus === 'error'" class="object-profile-entity-detail__state" role="alert">
          <p>{{ categoryError }}</p>
          <el-button @click="loadPropertyCategories">重试</el-button>
        </div>
        <el-tree
          v-else
          ref="treeRef"
          class="object-profile-entity-detail__tree"
          :data="categoryTree"
          node-key="id"
          :props="treeProps"
          :current-node-key="selectedCategoryId"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
          :filter-node-method="filterCategoryNode"
          @node-click="selectPropertyCategory"
        />
        <p v-if="categoryStatus === 'empty'" class="object-profile-entity-detail__note">暂无属性分类</p>
      </aside>
      <section class="object-profile-entity-detail__panel object-profile-entity-detail__properties" aria-label="实体属性和值">
        <header class="object-profile-entity-detail__section-title">
          <h3>实体属性</h3>
          <span>{{ filteredProperties.length }} 项</span>
        </header>
        <div v-if="propertyStatus === 'loading'" class="object-profile-entity-detail__state" role="status">
          <AircasLoading>正在加载实体属性…</AircasLoading>
        </div>
        <el-alert v-if="usingListProperties" type="warning" :closable="false" show-icon title="完整属性加载失败，已显示列表中的已知属性">
          <template #default
            ><p>{{ propertyError }}</p>
            <el-button size="small" @click="loadEntityProperties">重试</el-button></template
          >
        </el-alert>
        <div v-if="propertyStatus === 'error' && !usingListProperties" class="object-profile-entity-detail__state" role="alert">
          <p>{{ propertyError }}</p>
          <el-button @click="loadEntityProperties">重试</el-button>
        </div>
        <el-empty v-else-if="propertyStatus !== 'loading' && !filteredProperties.length" description="当前分类暂无属性值" :image-size="64" />
        <div v-else-if="propertyStatus !== 'loading'" class="object-profile-entity-detail__property-groups">
          <section
            v-for="group in propertyGroups"
            :key="group.name"
            class="object-profile-entity-detail__property-group"
            :aria-label="group.name || '未命名分组'"
          >
            <h4>{{ group.name || "未命名分组" }}</h4>
            <template v-if="group.name === 'main'">
              <div v-for="(record, index) in group.records" :key="record.id" class="object-profile-entity-detail__property-record">
                <p v-if="group.records.length > 1" class="object-profile-entity-detail__record-title">
                  记录 {{ index + 1 }} · 数据主键：{{ record.dataPrimaryKey }}
                </p>
                <dl class="object-profile-entity-detail__key-values">
                  <div v-for="property in record.properties" :key="property.id" class="object-profile-entity-detail__key-value">
                    <dt>{{ property.name }}</dt>
                    <dd>{{ property.value }}</dd>
                  </div>
                </dl>
              </div>
            </template>
            <el-table v-else :data="group.table.rows" row-key="id" class="object-profile-entity-detail__subtable" border>
              <el-table-column prop="dataPrimaryKey" label="数据主键" min-width="100" show-overflow-tooltip />
              <el-table-column v-for="(column, columnIndex) in group.table.columns" :key="column.id" :label="column.label" min-width="140">
                <template #default="{ row }"
                  ><span class="object-profile-entity-detail__subtable-value">{{ row.cells[columnIndex] }}</span></template
                >
              </el-table-column>
            </el-table>
          </section>
        </div>
      </section>
      <section class="object-profile-entity-detail__panel object-profile-entity-detail__relations" aria-label="实体关系图">
        <header class="object-profile-entity-detail__section-title">
          <h3>实体关系</h3>
        </header>
        <div v-if="relations === undefined && relationStatus === 'loading'" class="object-profile-entity-detail__state" role="status">
          <AircasLoading>正在加载实体关系…</AircasLoading>
        </div>
        <div v-else-if="relations === undefined && relationStatus === 'error'" class="object-profile-entity-detail__state" role="alert">
          <p>{{ relationError }}</p>
          <el-button @click="loadEntityRelations">重试</el-button>
        </div>
        <OntologyRelationGraph2d v-else :items="resolvedRelations" :seed-names="[entityName]" readonly empty-description="暂无关联实体" />
      </section>
    </div>
    <ObjectProfileEntityBehaviors
      :items="behaviors"
      :status="behaviorStatus"
      :error="behaviorError"
      :page="behaviorPage"
      :page-size="behaviorPageSize"
      :total="behaviorTotal"
      @retry="loadEntityBehaviors()"
      @page-change="loadEntityBehaviors"
      @execute="openEntityBehaviorTest"
    />
    <BehaviorTestDialog
      v-if="activeBehavior && activeBehavior.kind !== 'behaviorTree'"
      v-model="behaviorTestVisible"
      :apis="behaviorTestApis"
      :space-id="spaceId"
      :behavior="activeBehavior"
      :initial-entity="initialBehaviorEntity"
    />
    <BehaviorTreeTestDialog
      v-if="activeBehavior && activeBehavior.kind === 'behaviorTree'"
      v-model="behaviorTreeTestVisible"
      :query-object-catalog="behaviorTestApis.getOntologyCategoryTreeInterface"
      :space-id="spaceId"
      :behavior="activeBehavior"
      :initial-entity="initialBehaviorEntity"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { ElMessage, type ElTree } from "element-plus";
import * as behaviorTestApis from "@/apis";
import BehaviorTestDialog from "@/components/BehaviorTestDialog/BehaviorTestDialog.vue";
import BehaviorTreeTestDialog from "@/components/BehaviorTreeTestDialog.vue";
import type { BehaviorTestEntityRow, ListOntologyActionRecord, SpaceBehaviorItem } from "@/types";
import { mapListOntologyActionRecord } from "@/utils/behaviorParameters/mapListOntologyActionRecord";
import { createBehaviorTestInitialEntity } from "@/utils/behaviorParameters/createBehaviorTestInitialEntity";
import type { GetOntologyEntityRowDetailParams, ObjectProfileEntityCategory, ObjectProfileEntityListProperty, OntologyRelationClass } from "@/types";
import AircasLoading from "@/components/AircasLoading.vue";
import OntologyRelationGraph2d from "@/components/OntologyRelationGraph2d.vue";
import ObjectProfileEntityBehaviors from "./ObjectProfileEntityBehaviors.vue";
import { useObjectProfileEntityDetail } from "../composables/useObjectProfileEntityDetail";
import { buildEntityPropertyTable, groupEntityPropertyRows, parseEntityPrimaryKey } from "../utils/entityDetailData";

const props = withDefaults(
  defineProps<{
    objectId: string;
    instanceId: string;
    spaceId: string;
    entityName: string;
    entityPrimaryKey?: GetOntologyEntityRowDetailParams["entityPrimaryKey"];
    listProperties?: ObjectProfileEntityListProperty[];
    relations?: OntologyRelationClass[];
  }>(),
  { listProperties: () => [] },
);
const emit = defineEmits<{ back: [] }>();
const activeBehavior = ref<SpaceBehaviorItem | null>(null);
const behaviorTestVisible = ref(false);
const behaviorTreeTestVisible = ref(false);
const initialBehaviorEntity = ref<BehaviorTestEntityRow>();

/** @description 打开当前卡片对应的测试弹窗并传递当前实例，不自动执行行为。 @param record 行为列表记录。 */
function openEntityBehaviorTest(record: ListOntologyActionRecord): void {
  try {
    if (!props.objectId.trim() || !props.spaceId.trim() || !record.actionApi.trim()) throw new Error("缺少空间、对象或行为标识，无法执行");
    const primaryKey = props.entityPrimaryKey ?? parseEntityPrimaryKey(props.instanceId);
    initialBehaviorEntity.value = createBehaviorTestInitialEntity(props.objectId, primaryKey, props.entityName);
    activeBehavior.value = {
      ...mapListOntologyActionRecord(record),
      ontologyUniqIdentifier: record.ontologyUniqIdentifier?.trim() || props.objectId,
    };
    behaviorTestVisible.value = activeBehavior.value.kind !== "behaviorTree";
    behaviorTreeTestVisible.value = activeBehavior.value.kind === "behaviorTree";
  } catch (cause) {
    ElMessage.error(cause instanceof Error ? cause.message : "当前实例无效，无法执行行为");
  }
}

/** @description 当前实例或空间改变时关闭测试并清理前一次行为选择。 */
function clearEntityBehaviorTest(): void {
  behaviorTestVisible.value = false;
  behaviorTreeTestVisible.value = false;
  activeBehavior.value = null;
  initialBehaviorEntity.value = undefined;
}
watch(() => [props.objectId, props.instanceId, props.spaceId, JSON.stringify(props.entityPrimaryKey)] as const, clearEntityBehaviorTest);

const identity = computed(() => ({
  objectId: props.objectId,
  instanceId: props.instanceId,
  spaceId: props.spaceId,
  entityPrimaryKey: props.entityPrimaryKey,
  listProperties: props.listProperties,
}));
const {
  relations: entityRelations,
  relationStatus,
  relationError,
  loadEntityRelations,
  usingListProperties,
  categories,
  behaviors,
  selectedCategoryId,
  filteredProperties,
  propertyStatus,
  categoryStatus,
  behaviorStatus,
  propertyError,
  categoryError,
  behaviorError,
  behaviorPage,
  behaviorPageSize,
  behaviorTotal,
  loadEntityProperties,
  loadPropertyCategories,
  loadEntityBehaviors,
} = useObjectProfileEntityDetail(identity);
const resolvedRelations = computed(() => props.relations ?? entityRelations.value);
const treeRef = ref<InstanceType<typeof ElTree> | null>(null);
const categorySearch = ref("");
const treeProps = { children: "children", label: "label" };
const categoryTree = computed(() => categories.value);
const propertyGroups = computed(() =>
  groupEntityPropertyRows(filteredProperties.value).map((group) => ({ ...group, table: buildEntityPropertyTable(group.records) })),
);

/** @description 分类树按名称搜索，保留父子结构。 @param keyword 搜索关键字。 @param node 分类节点。 @returns 是否匹配。 */
function filterCategoryNode(keyword: string, node: unknown): boolean {
  if (!node || typeof node !== "object" || !("label" in node) || typeof node.label !== "string") return false;
  return !keyword || node.label.toLocaleLowerCase().includes(keyword.trim().toLocaleLowerCase());
}
/** @description 选择分类后筛选实体属性。 @param node 选中分类。 */
function selectPropertyCategory(node: ObjectProfileEntityCategory): void {
  selectedCategoryId.value = node.id;
}
watch([categorySearch, categories], () => treeRef.value?.filter(categorySearch.value), { flush: "post" });
</script>

<style scoped lang="scss">
.object-profile-entity-detail {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  overflow: auto;
  color: var(--aircas-color-text-primary);
}
.object-profile-entity-detail__header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.object-profile-entity-detail__identity {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 12px;
}
.object-profile-entity-detail__identity h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.object-profile-entity-detail__identity span {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.object-profile-entity-detail__top {
  display: grid;
  min-height: 400px;
  height: min(58vh, 640px);
  flex-shrink: 0;
  grid-template-columns: 220px minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 12px;
}
.object-profile-entity-detail__panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--aircas-color-border);
  border-radius: 8px;
  background: var(--aircas-color-panel-background);
  overflow: hidden;
}
.object-profile-entity-detail__panel h3 {
  margin: 0;
  flex-shrink: 0;
  font-size: 16px;
}
.object-profile-entity-detail__section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.object-profile-entity-detail__section-title span {
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.object-profile-entity-detail__tree {
  min-height: 0;
  flex: 1;
  overflow: auto;
}
.object-profile-entity-detail__property-groups {
  min-height: 0;
  flex: 1;
  overflow: auto;
}
.object-profile-entity-detail__property-group + .object-profile-entity-detail__property-group {
  margin-top: 16px;
}
.object-profile-entity-detail__property-group h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--aircas-color-primary);
  overflow-wrap: anywhere;
}
.object-profile-entity-detail__property-record {
  padding: 12px;
  border: 1px solid var(--aircas-color-border-light);
  border-radius: 6px;
  background: var(--aircas-color-panel-background-deep);
}
.object-profile-entity-detail__subtable {
  width: 100%;
}
.object-profile-entity-detail__subtable-value {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.object-profile-entity-detail__property-record + .object-profile-entity-detail__property-record {
  margin-top: 8px;
}
.object-profile-entity-detail__record-title {
  margin: 0 0 12px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.object-profile-entity-detail__key-values {
  display: grid;
  gap: 12px;
  margin: 0;
}
.object-profile-entity-detail__key-value {
  display: grid;
  grid-template-columns: minmax(80px, 1fr) minmax(0, 2fr);
  gap: 12px;
  font-size: 14px;
}
.object-profile-entity-detail__key-value dt {
  color: var(--aircas-color-text-secondary);
  overflow-wrap: anywhere;
}
.object-profile-entity-detail__key-value dd {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.object-profile-entity-detail__state {
  display: flex;
  min-height: 150px;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--aircas-color-text-secondary);
}
.object-profile-entity-detail__state p {
  overflow-wrap: anywhere;
}
.object-profile-entity-detail__note {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
@media (max-width: 1200px) {
  .object-profile-entity-detail__top {
    grid-template-columns: 180px minmax(0, 1.2fr) minmax(0, 1fr);
  }
  .object-profile-entity-detail__panel {
    padding: 12px;
  }
}
@media (max-width: 1000px) {
  .object-profile-entity-detail__top {
    height: auto;
    grid-template-columns: 180px minmax(0, 1fr);
    grid-template-rows: 400px 320px;
  }
  .object-profile-entity-detail__relations {
    grid-column: 1 / -1;
  }
}
@media (max-width: 640px) {
  .object-profile-entity-detail__top {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 240px 400px 320px;
  }
  .object-profile-entity-detail__identity {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
