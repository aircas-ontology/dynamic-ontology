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

export {
  createOntologySpaceInterface,
  createOntologyObjectInterface,
  createOntologyObjectArrTypeTreeInterface,
  deleteOntologyObjectArrTypeTreeInterface,
  deleteOntologyCategoryTreeInterface,
  deleteOntologyObjectInterface,
  deleteOntologyRelationCategoryTreeInterface,
  deleteOntologySpaceInterface,
  getExampleInterface,
  getOntologyCategoryTreeInterface,
  getOntologyObjectArrTypeTreeInterface,
  getOntologyObjectByCategoryIdInterface,
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
};
