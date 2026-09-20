import { getExampleInterface } from "./exampleApi";
import { postLoginInterface } from "./loginApi";
import {
  createOntologySpaceInterface,
  deleteOntologyCategoryTreeInterface,
  deleteOntologyRelationCategoryTreeInterface,
  deleteOntologySpaceInterface,
  getOntologyCategoryTreeInterface,
  getOntologyRelationCategoryTreeInterface,
  getOntologySpaceListInterface,
  postCreateOntologyCategoryTreeInterface,
  postCreateOntologyRelationCategoryTreeInterface,
  putUpdateOntologyCategoryNameInterface,
  putUpdateOntologyRelationCategoryNameInterface,
  updateOntologySpaceInterface,
} from "./ontologyManageApi";
import {
  createOntologyObjectArrTypeTreeInterface,
  deleteOntologyObjectArrTypeTreeInterface,
  getOntologyObjectArrTypeTreeInterface,
  updateOntologyObjectArrTypeTreeInterface,
} from "./ontologyObjectArrManageApi";
import {
  createOntologyObjectInterface,
  deleteOntologyObjectInterface,
  getOntologyObjectByCategoryIdInterface,
  updateOntologyObjectInterface,
} from "./ontologyObjectManageApi";
import {
  createOntologyPropertyInterface,
  deleteOntologyPropertyInterface,
  getOntologyPropertyByCategoryIdInterface,
  getOntologyPropertyByOntologyIdInterface,
  updateOntologyPropertyInterface,
} from "./ontologyPropertyApi";

export {
  createOntologySpaceInterface,
  createOntologyObjectInterface,
  createOntologyObjectArrTypeTreeInterface,
  createOntologyPropertyInterface,
  deleteOntologyObjectArrTypeTreeInterface,
  deleteOntologyCategoryTreeInterface,
  deleteOntologyObjectInterface,
  deleteOntologyRelationCategoryTreeInterface,
  deleteOntologySpaceInterface,
  deleteOntologyPropertyInterface,
  getExampleInterface,
  getOntologyCategoryTreeInterface,
  getOntologyObjectArrTypeTreeInterface,
  getOntologyObjectByCategoryIdInterface,
  getOntologyPropertyByCategoryIdInterface,
  getOntologyPropertyByOntologyIdInterface,
  getOntologyRelationCategoryTreeInterface,
  getOntologySpaceListInterface,
  postCreateOntologyCategoryTreeInterface,
  postCreateOntologyRelationCategoryTreeInterface,
  postLoginInterface,
  putUpdateOntologyCategoryNameInterface,
  putUpdateOntologyRelationCategoryNameInterface,
  updateOntologySpaceInterface,
  updateOntologyObjectArrTypeTreeInterface,
  updateOntologyObjectInterface,
  updateOntologyPropertyInterface,
};
