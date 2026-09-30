import { onScopeDispose, ref, watch, type Ref } from "vue";
import { getOntologyMetaStatisticInterface } from "@/apis";
import type { OntologyMetaStatisticVO } from "@/types";

export type ObjectResourceStatId = "entity" | "property" | "relation" | "behavior";
export type ObjectResourceCounts = Partial<Record<ObjectResourceStatId, number>>;

/**
 * @description 将本体对象资源统计映射为概览卡片和 Tab 使用的计数字段。
 * @param statistic 后端返回的本体对象资源统计。
 * @returns 实例、属性、关系和行为计数。
 */
export function mapOntologyMetaStatistic(statistic: OntologyMetaStatisticVO): ObjectResourceCounts {
  return {
    entity: statistic.entityCount,
    property: statistic.propertyCount,
    relation: statistic.relationCount,
    behavior: statistic.actionCount,
  };
}

/**
 * @description 按本体唯一标识加载对象资源统计，并丢弃过期响应。
 * @param objectId 路由中的本体唯一标识。
 * @returns 计数、加载状态、错误信息和重新加载方法。
 */
export function useObjectResourceStatistic(objectId: Ref<string>) {
  const counts = ref<ObjectResourceCounts>({});
  const loading = ref(false);
  const error = ref("");
  let generation = 0;
  let disposed = false;
  let pendingId: string | undefined;

  /**
   * @description 请求当前对象的资源统计。同一对象加载中时不重复请求。
   */
  async function loadObjectResourceStatistic() {
    const id = objectId.value.trim();
    if (disposed || (loading.value && pendingId === id)) return;
    const requestId = ++generation;
    pendingId = id;
    loading.value = true;
    error.value = "";
    counts.value = {};
    if (!id) {
      if (!disposed && requestId === generation) {
        error.value = "缺少本体对象标识，无法加载对象资源统计。";
        loading.value = false;
      }
      return;
    }
    try {
      const response = await getOntologyMetaStatisticInterface({ uniqueIdentifier: objectId.value.trim() });
      if (disposed || requestId !== generation) return;
      if (response.code === 200 && response.data) counts.value = mapOntologyMetaStatistic(response.data);
      else error.value = response.message || "对象统计加载失败，请重试。";
    } catch {
      if (!disposed && requestId === generation) error.value = "对象统计加载失败，请重试。";
    } finally {
      if (!disposed && requestId === generation) loading.value = false;
    }
  }

  watch(
    objectId,
    () => {
      void loadObjectResourceStatistic();
    },
    { immediate: true },
  );
  onScopeDispose(() => {
    disposed = true;
    generation += 1;
  });
  return { counts, loading, error, loadObjectResourceStatistic };
}
