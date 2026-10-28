# 数据格式转换：确定旁增加解析按钮

## 需求理解

在数据格式转换配置抽屉确定旁增加「解析」，单独调用解析接口展示 INPUT/OUTPUT，不关闭抽屉；确定仍先解析再写回。

## 修改范围

- `src/views/FunctionOperatorPanel/components/FunctionOperatorCompositeTransformNodeDialog.vue`
- `tests/composite-workflow-transform.test.mjs`

## 新增、修改和删除文件

### 修改

- 上述抽屉与测试

### 新增 / 删除

- 无源码新增或删除（仅本 Plan 历史文件）

## 核心实现方式

Footer 增加解析按钮，复用 `parseTransformScript`；成功提示且保持打开；更新空状态提示文案。

## 新增依赖及必要性

无。

## 验证方式

相关 test 与 format:check。
