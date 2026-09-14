import type * as mars3d from "mars3d";

export type MapConfig = NonNullable<ConstructorParameters<typeof mars3d.Map>[1]>;
