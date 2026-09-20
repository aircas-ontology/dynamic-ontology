## 1 本体空间概念模型构建

## 需求背景

空间概念模型构建页面开发

## 功能要求

按照原型页面空间概念模型构建页面内容：(http://localhost:36001/#/layout/ontology-space-management/conceptual-model-create)，构建本项目空间概念模型构建页面。页面样式要求与原型保持一致，优先用公共样式实现，不能实现的用页面私有样式。本项目的新建本体空间弹窗的基于概念模型创建部分修改为原型样式，本项目空间概念模型入口在http://localhost:36000/#/workspace/ontology-space-management这个路由页面下的新建本体空间弹窗内选择基于概念模型创建后点击进入概念建模画布跳转到空间概念模型构建页面开发

## 2 本体对象属性页面构建

## 需求背景

本体对象属性页面构建

## 功能要求

按照原型页面本体对象属性页面内容：(http://localhost:36001/#/layout/ontology-space-management/navy/carrier-ford)的属性tab页面，构建本项目本体对象属性页面。页面样式要求与原型保持一致，优先用公共样式实现，不能实现的用页面私有样式。本项目本体对象属性页面路由为(http://localhost:36000/#/workspace/ontology-object/ae6cca59ced9432189da4af315554957/attribute?spaceId=11&spaceName=%E6%B5%8B%E8%AF%95%E7%A9%BA%E9%97%B4001-%E4%BF%AE%E6%94%B9&objectName=%E6%B5%8B%E8%AF%95%E6%9C%AC%E4%BD%93%E5%AF%B9%E8%B1%A1-%E4%BF%AE%E6%94%B9)

## 3 本体对象属性接口文档生成

## 需求背景

本体对象属性接口md说明生成

## 功能要求

本体对象属性新增在线接口文档地址：http://172.16.18.58:37002/ontology/doc.html#/ontology/%E6%9C%AC%E4%BD%93%E5%B1%9E%E6%80%A7%E7%AE%A1%E7%90%86/OntologyPropertyController_createProperty/doc
本体对象属性删除在线接口文档地址：http://172.16.18.58:37002/ontology/doc.html#/ontology/%E6%9C%AC%E4%BD%93%E5%B1%9E%E6%80%A7%E7%AE%A1%E7%90%86/OntologyPropertyController_deleteProperty/doc
本体对象属性修改在线接口文档地址：http://172.16.18.58:37002/ontology/doc.html#/ontology/%E6%9C%AC%E4%BD%93%E5%B1%9E%E6%80%A7%E7%AE%A1%E7%90%86/OntologyPropertyController_updateProperty/doc
本体对象属性查询在线接口文档地址：（查全部的时候）http://172.16.18.58:37002/ontology/doc.html#/ontology/%E6%9C%AC%E4%BD%93%E5%B1%9E%E6%80%A7%E7%AE%A1%E7%90%86/OntologyPropertyController_getPropertyInfoByOntologyId/doc
（查某个分类下的属性的时候）http://172.16.18.58:37002/ontology/doc.html#/ontology/%E6%9C%AC%E4%BD%93%E5%B1%9E%E6%80%A7%E7%AE%A1%E7%90%86/OntologyPropertyController_getByCategoryId/doc
按规范生成md文档，命名规则参照docs/0920/下的API说明，接口路径需要增加前缀/ontology，每一个接口生成一个文档
