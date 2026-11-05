# 测试参数按 propertyType 转换提交值

## 需求理解

行为测试提交 `params` 时，按详情返回的属性类型转换取值：数值类型传 number，布尔传 boolean，字符串保持 string；解析失败拦截提交。

## 修改范围

- 新增参数值转换工具与测试
- 测试弹窗组装 payload 时调用转换

## 新增、修改和删除文件

### 新增

- `src/views/SpaceBehaviorWorkspace/utils/coerceBehaviorTestParamValue.ts`
- `plans/20261105/151147-behavior-test-param-value-coerce-shi-jian.md`

### 修改

- `src/views/SpaceBehaviorWorkspace/components/BehaviorTestDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

### 删除

无

## 核心实现方式

按 `propertyType`（忽略大小写）映射：Int/Integer/Long/Short/Byte → 整数；Double/Float/Number/Decimal → number；Bool/Boolean → boolean；其余 → trim 后的 string。失败返回错误文案，弹窗拦截提交。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <任务文件>`
