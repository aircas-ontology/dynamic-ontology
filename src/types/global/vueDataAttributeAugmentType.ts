/**
 * @description Vue 模板类型扩展：项目开启 strictTemplates 后，允许原生元素与组件透传 data-onboarding 引导锚点属性。
 */
declare module "vue" {
  interface HTMLAttributes {
    [key: `data-${string}`]: string | undefined;
  }

  /** 组件模板中的 data-onboarding 会被 volar 规范化为 camelCase 属性名进行检查，此处为其提供全局组件透传声明。 */
  interface ComponentCustomProps {
    dataOnboarding?: string;
  }
}

export {};
