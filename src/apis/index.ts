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
  deleteOntologySpaceInterface,
  deleteOntologyPropertyInterface,
  getExampleInterface,
  getOntologyCategoryTreeInterface,
  getOntologyObjectArrTypeTreeInterface,
  getOntologyObjectByCategoryIdInterface,
  getOntologyPropertyByCategoryIdInterface,
  getOntologyPropertyByOntologyIdInterface,
  getOntologySpaceListInterface,
  postCreateOntologyCategoryTreeInterface,
  postLoginInterface,
  putUpdateOntologyCategoryNameInterface,
  updateOntologySpaceInterface,
  updateOntologyObjectArrTypeTreeInterface,
  updateOntologyObjectInterface,
  updateOntologyPropertyInterface,
};
