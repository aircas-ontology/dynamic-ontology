import { defineStore } from "pinia";

export const useAircasPanelStore = defineStore("aircasPanel", {
  state: () => ({
    /** 当前面板的最大 z-index */
    currentPanelIndex: 10,
  }),
  actions: {
    /** 更新当前面板的最大 z-index */
    updatePanelIndex(index: number) {
      this.currentPanelIndex = index;
    },
  },
});
