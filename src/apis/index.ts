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
  createOntologyObjectInterface,
  deleteOntologyObjectInterface,
  getOntologyObjectByCategoryIdInterface,
  updateOntologyObjectInterface,
} from "./ontologyObjectManageApi";

export {
  createOntologySpaceInterface,
  createOntologyObjectInterface,
  deleteOntologyCategoryTreeInterface,
  deleteOntologyObjectInterface,
  deleteOntologyRelationCategoryTreeInterface,
  deleteOntologySpaceInterface,
  getExampleInterface,
  getOntologyCategoryTreeInterface,
  getOntologyObjectByCategoryIdInterface,
  getOntologyRelationCategoryTreeInterface,
  getOntologySpaceListInterface,
  postCreateOntologyCategoryTreeInterface,
  postCreateOntologyRelationCategoryTreeInterface,
  postLoginInterface,
  putUpdateOntologyCategoryNameInterface,
  putUpdateOntologyRelationCategoryNameInterface,
  updateOntologySpaceInterface,
  updateOntologyObjectInterface,
};
