import type { OntologyPropertyInfo } from "./getOntologyPropertyByOntologyIdType";

export interface GetOntologyPropertyByCategoryIdParams {
  categoryId?: number;
}

export type GetOntologyPropertyByCategoryIdData = OntologyPropertyInfo[];
