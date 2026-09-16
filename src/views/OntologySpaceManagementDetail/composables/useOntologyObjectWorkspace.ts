import { onScopeDispose, ref, watch, type Ref } from "vue";
import type { OntologyObjectWorkspace } from "@/types";
import { ontologySpaceObjectMock } from "@/mocks/ontologySpaceObjectMock/ontologySpaceObjectMock";
import { findObjectWorkspace } from "../utils/objectWorkspace";

export type OntologyObjectWorkspaceStatus = "loading" | "success" | "empty" | "error";

export function useOntologyObjectWorkspace(
  spaceId: Ref<string>,
  loader: (id: string) => Promise<OntologyObjectWorkspace | undefined> = async id =>
    structuredClone(findObjectWorkspace(ontologySpaceObjectMock, id)),
) {
  const status = ref<OntologyObjectWorkspaceStatus>("loading");
  const error = ref("");
  const workspace = ref<OntologyObjectWorkspace>();
  let generation = 0;
  let disposed = false;
  let pendingSpaceId = "";

  async function load() {
    const id = spaceId.value;
    if (disposed || (status.value === "loading" && pendingSpaceId === id)) return;
    const request = ++generation;
    pendingSpaceId = id;
    status.value = "loading";
    error.value = "";
    workspace.value = undefined;
    try {
      const result = await loader(id);
      if (disposed || request !== generation) return;
      workspace.value = result;
      status.value = result?.sections.length ? "success" : "empty";
    } catch {
      if (disposed || request !== generation) return;
      status.value = "error";
      error.value = "本体对象加载失败，请重试。";
    }
  }

  watch(spaceId, load, { immediate: true });
  onScopeDispose(() => {
    disposed = true;
    generation += 1;
  });

  return { status, error, workspace, load };
}
