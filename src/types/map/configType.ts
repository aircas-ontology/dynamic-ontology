import type * as mars3d from "mars3d";

/** Mars3D 地图构造配置；所有字段语义由 Mars3D Map 构造器定义。 */
export type MapConfig = NonNullable<ConstructorParameters<typeof mars3d.Map>[1]>;
