import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

import { getOntologyMetaByObjectIdInterface, postOntologyGlobalSearchInterface } from "@/apis";
import type { OntologyGlobalSearchItem } from "@/types";
import {
  resolveOntologyGlobalSearchObjectRoute,
  resolveOntologyGlobalSearchPropertyRoute,
  resolveOntologyGlobalSearchRoute,
} from "@/utils/ontologyGlobalSearchRoute";

export type OntologyGlobalSearchStatus = "idle" | "loading" | "success" | "empty" | "error";

/**
 * @description 全局检索工作区：关键词检索、结果状态与空间/对象/关系分组/属性跳转。
 * @returns 检索状态与操作方法。
 */
export function useOntologyGlobalSearch() {
  const router = useRouter();
  const keyword = ref("");
  const results = ref<OntologyGlobalSearchItem[]>([]);
  const status = ref<OntologyGlobalSearchStatus>("idle");
  const errorMessage = ref("");
  let requestSerial = 0;

  /**
   * @description 按当前关键词发起全局检索；空关键词则清空结果。
   * @param sizs 可选返回条数上限。
   */
  async function searchOntologyGlobal(sizs?: number): Promise<void> {
    const trimmed = keyword.value.trim();
    if (!trimmed) {
      results.value = [];
      status.value = "idle";
      errorMessage.value = "";
      return;
    }

    const serial = ++requestSerial;
    status.value = "loading";
    errorMessage.value = "";

    try {
      const response = await postOntologyGlobalSearchInterface({
        keyword: trimmed,
        ...(sizs !== undefined ? { sizs } : {}),
      });
      if (serial !== requestSerial) {
        return;
      }
      if (response.code !== 200) {
        results.value = [];
        status.value = "error";
        errorMessage.value = response.message.trim() || "检索失败，请稍后重试。";
        return;
      }
      const list = Array.isArray(response.data) ? response.data : [];
      results.value = list;
      status.value = list.length ? "success" : "empty";
    } catch (cause: unknown) {
      if (serial !== requestSerial) {
        return;
      }
      results.value = [];
      status.value = "error";
      errorMessage.value = cause instanceof Error && cause.message.trim() ? cause.message : "检索失败，请稍后重试。";
    }
  }

  /**
   * @description 清空关键词与结果。
   */
  function clearOntologyGlobalSearch(): void {
    requestSerial += 1;
    keyword.value = "";
    results.value = [];
    status.value = "idle";
    errorMessage.value = "";
  }

  /**
   * @description 点击结果项：空间/关系分组直接跳转；对象与属性先查对象简要信息再拼路由。
   * @param item 检索结果。
   * @returns 是否已发起跳转。
   */
  async function openOntologyGlobalSearchItem(item: OntologyGlobalSearchItem): Promise<boolean> {
    if (item.type === "对象" || item.type === "属性") {
      if (item.objectId === undefined || item.objectId === null || !Number.isFinite(item.objectId)) {
        ElMessage.info("该类型暂不支持跳转");
        return false;
      }
      try {
        const response = await getOntologyMetaByObjectIdInterface({ objectId: item.objectId });
        if (response.code !== 200 || !response.data) {
          throw new Error(response.message.trim() || "对象信息查询失败");
        }
        const location =
          item.type === "对象" ? resolveOntologyGlobalSearchObjectRoute(item, response.data) : resolveOntologyGlobalSearchPropertyRoute(item, response.data);
        if (!location) {
          ElMessage.info("该类型暂不支持跳转");
          return false;
        }
        await router.push(location);
        return true;
      } catch (cause: unknown) {
        ElMessage.error(cause instanceof Error && cause.message.trim() ? cause.message : "对象信息查询失败");
        return false;
      }
    }
    const location = resolveOntologyGlobalSearchRoute(item);
    if (!location) {
      ElMessage.info("该类型暂不支持跳转");
      return false;
    }
    await router.push(location);
    return true;
  }

  return {
    keyword,
    results,
    status,
    errorMessage,
    searchOntologyGlobal,
    clearOntologyGlobalSearch,
    openOntologyGlobalSearchItem,
  };
}
