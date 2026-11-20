# Plan: attribute-metadata-nested-save

## 需求理解

属性创建/编辑保存时，`metadata` 提交按选中叶子目录路径构造的嵌套 JSON，不再提交 `{ selectedRecords: [...] }`。

示例：

```json
{
  "元数据": {
    "aaa": {
      "rrr": "3",
      "ddddd": "1,2"
    },
    "枚举类": {
      "是否必填": "是,否"
    }
  }
}
```

叶值规则：

- 输入值：一律字符串
- 范围：`"min,max"`（英文逗号）
- 枚举：选中项用英文逗号 `,` 拼接

路径按 catalog `parentId` 回溯；已有根名「元数据」时不再二次包裹。草稿保留 `selectedRecords`（UI）+ `catalog` + `nested`（提交）。打开编辑若无 selectedRecords，标签可为空。

## 修改范围

- `src/views/OntologyObjectAttributePanel/utils/attributeMetadataSelection.ts`
- `src/views/OntologyObjectAttributePanel/components/AttributeMetadataSelectDialog.vue`
- `src/views/OntologyObjectAttributePanel/components/AttributePropertyFormDialog.vue`
- `src/views/OntologyObjectAttributePanel/composables/useAttributePropertyList.ts`
- `tests/ontology-object-attribute-panel.test.mjs`

## 新增、修改和删除文件

- 修改：上述文件
- 新增：本 Plan
- 删除：无

## 核心实现方式

1. 新增 `buildAttributeMetadataNestedJson`、`formatAttributeMetadataLeafValue`、`buildAttributeMetadataDraftState`、`resolveAttributeMetadataApiPayload`。
2. 弹窗确认时用 catalog 生成 draft state 并回传。
3. create/update 参数用 `resolveAttributeMetadataApiPayload(draft.metadata)` 得到 JSON 字符串。
4. 标签移除时按剩余 selectedRecords + 缓存 catalog 重建 nested。

## 新增依赖及必要性

无。

## 验证方式

1. TDD：先写嵌套生成与 payload 测试并确认失败。
2. 实现后跑相关测试。
3. 任务范围 `format:check`；按需 type-check / build:verify。
