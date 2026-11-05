# 对象空间继承层级树接口

## 接口信息

- 请求方式：`GET`
- 请求路径：`/ontology/meta/inheritance_tree`
- 查询参数：`spaceId`，对象空间 ID，必填，整数。
- 在线文档：[OntologyMetaController_getInheritanceTree](http://172.16.18.58:37002/ontology/doc.html#/ontology/%E5%AF%B9%E8%B1%A1%E7%AE%A1%E7%90%86/OntologyMetaController_getInheritanceTree/debug)

## 响应结构

标准响应的 `data` 为对象继承节点数组。接口返回数据不包含对象空间根节点，前端需创建当前对象空间作为根节点，并将返回的对象节点挂载到根节点下。

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "uniqueIdentifier": "object-1",
      "displayName": "对象一",
      "parentUniqueIdentifier": "",
      "childNodes": []
    }
  ]
}
```

## 页面处理

对象工作区加载分类树时并行请求本接口。前端将 `data` 递归展开为对象列表，使用 `parentUniqueIdentifier` 建立父子关系，并由继承层级树组件创建当前空间根节点；根节点名称使用对象空间名称，接口返回节点作为根节点的子节点。
