<template>
  <span class="aircas-loading-indicator">
    <span class="aircas-loading-indicator__mark" aria-hidden="true"></span>
    <span class="aircas-loading-indicator__text"><slot /></span>
  </span>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.aircas-loading-indicator {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.aircas-loading-indicator__mark {
  width: 28px;
  height: 28px;
  box-sizing: border-box;
  border: 2px solid var(--aircas-color-accent-cyan-soft);
  border-top-color: var(--aircas-color-title);
  border-radius: 50%;
  animation: aircas-loading-indicator-spin 0.8s linear infinite;
}

.aircas-loading-indicator__text {
  color: inherit;
}

@keyframes aircas-loading-indicator-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .aircas-loading-indicator__mark {
    animation: none;
  }
}
</style>
