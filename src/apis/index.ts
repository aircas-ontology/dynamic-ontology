import { getExampleInterface } from "./exampleApi";
import { postLoginInterface } from "./loginApi";
import {
  createOntologySpaceInterface,
  deleteOntologyCategoryTreeInterface,
  deleteOntologySpaceInterface,
  getOntologyCategoryTreeInterface,
  getOntologySpaceListInterface,
  postCreateOntologyCategoryTreeInterface,
  putUpdateOntologyCategoryNameInterface,
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
  deleteOntologySpaceInterface,
  getExampleInterface,
  getOntologyCategoryTreeInterface,
  getOntologyObjectByCategoryIdInterface,
  getOntologySpaceListInterface,
  postCreateOntologyCategoryTreeInterface,
  postLoginInterface,
  putUpdateOntologyCategoryNameInterface,
  updateOntologySpaceInterface,
  updateOntologyObjectInterface,
};
