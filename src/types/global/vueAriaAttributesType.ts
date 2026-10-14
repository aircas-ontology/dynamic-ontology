import type { HTMLAttributes } from "vue";

declare module "vue" {
  /** 复用 Vue 已有的标准 ARIA 类型，使组件模板允许直接声明 aria-label。 */
  interface AllowedComponentProps extends Pick<HTMLAttributes, "aria-label"> {}
}
