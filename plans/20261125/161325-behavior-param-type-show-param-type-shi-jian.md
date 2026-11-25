# 参数类型列改展示 paramType

## 需求理解

行为测试/参数配置表「类型」列当前显示 `propertyType`（如 Double），应显示接口 `mappingIns.paramType`（如 List&lt;Double&gt;）。EXTERNAL 值转换仍用 `propertyType`，不改。

## 修改范围

详情 mapping 行类型与 `mapMappingToViewRow` 映射；表格已绑定 `prop="paramType"`。

## 新增、修改和删除文件

- 修改：`src/types/apis/getOntologyActionInfoType.ts`
- 修改：`src/utils/behaviorParameters/mapOntologyActionInfoToViewState.ts`
- 修改相关测试
- 新增：本 Plan
- 删除：无

## 核心实现方式

```ts
paramType: (item.paramType ?? "").trim() || (functionParam?.paramType ?? "").trim() || propertyType || "—",
```

## 新增依赖及必要性

- 无

## 验证方式

- 相关 `npm test`；`format:check`；`check:types-conventions`；`type-check` / `build:verify`
