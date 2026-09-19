import { defineStore } from "pinia";

export const useOntologySpaceDetailStore = defineStore("ontologySpaceDetail", {
  state: () => ({
    spaceId: "",
    displayName: "",
  }),
  actions: {
    setCurrentSpace(spaceId: string, displayName: string) {
      this.spaceId = spaceId;
      this.displayName = displayName;
    },
    clearCurrentSpace() {
      this.spaceId = "";
      this.displayName = "";
    },
  },
});
