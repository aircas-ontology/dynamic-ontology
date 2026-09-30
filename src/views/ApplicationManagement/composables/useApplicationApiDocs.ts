import { computed, onMounted, onUnmounted, ref } from "vue";

import { getOntologyApiDocsInterface } from "@/apis";
import { apiDocsOntologyMock } from "@/mocks/apiDocsOntologyMock/apiDocsOntologyMock";
import type { ApiDocsEndpointDetail, ApiDocsEndpointGroup, ApiDocsEndpointItem, ApiDocsHttpMethod, ApiDocsServiceInfo, OntologyApiDocsData } from "@/types";
import { RequestError } from "@/utils/request";

import { mapApiDocsEndpointDetail, mapApiDocsEndpointGroups, mapApiDocsServiceInfo } from "../utils/parseOpenApiDocument";

/**
 * @description 应用管理页：加载 OpenAPI 文档并维护选中接口与展示模型。
 * @returns 文档异步状态、分组列表、选中详情与选择操作。
 */
export function useApplicationApiDocs() {
  const document = ref<OntologyApiDocsData | null>(null);
  const loading = ref(false);
  const error = ref("");
  const selectedId = ref("");
  let disposed = false;
  let generation = 0;

  const serviceInfo = computed<ApiDocsServiceInfo | null>(() => {
    return document.value ? mapApiDocsServiceInfo(document.value) : null;
  });

  const endpointGroups = computed<ApiDocsEndpointGroup[]>(() => {
    return document.value ? mapApiDocsEndpointGroups(document.value) : [];
  });

  const flatEndpoints = computed<ApiDocsEndpointItem[]>(() => {
    return endpointGroups.value.flatMap((group) => group.endpoints);
  });

  const selectedDetail = computed<ApiDocsEndpointDetail | null>(() => {
    if (!document.value || !selectedId.value) {
      return null;
    }
    const [method, ...pathParts] = selectedId.value.split(":");
    const path = pathParts.join(":");
    if (!method || !path) {
      return null;
    }
    return mapApiDocsEndpointDetail(document.value, method as ApiDocsHttpMethod, path);
  });

  /**
   * @description 选中左侧接口项；空 id 时清空选中。
   * @param endpointId 接口唯一键。
   */
  function selectEndpoint(endpointId: string): void {
    selectedId.value = endpointId;
  }

  /**
   * @description 拉取 OpenAPI 文档；失败时回退 Mock，并默认选中首个接口。
   */
  async function loadOntologyApiDocs(): Promise<void> {
    const requestId = ++generation;
    loading.value = true;
    error.value = "";
    try {
      const response = await getOntologyApiDocsInterface();
      if (disposed || requestId !== generation) {
        return;
      }
      document.value = response;
    } catch (cause) {
      if (disposed || requestId !== generation) {
        return;
      }
      document.value = apiDocsOntologyMock;
      error.value = cause instanceof RequestError ? cause.message : "接口文档加载失败，已展示本地样例。";
    } finally {
      if (!disposed && requestId === generation) {
        loading.value = false;
        if (!selectedId.value && flatEndpoints.value[0]) {
          selectedId.value = flatEndpoints.value[0].id;
        }
      }
    }
  }

  onMounted(() => {
    void loadOntologyApiDocs();
  });

  onUnmounted(() => {
    disposed = true;
  });

  return {
    document,
    loading,
    error,
    selectedId,
    serviceInfo,
    endpointGroups,
    selectedDetail,
    selectEndpoint,
    loadOntologyApiDocs,
  };
}
