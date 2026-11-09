# 测试后按 dataPrimaryKey 恢复数据行选中

## 需求理解

属性值-修改单次测试成功后，实例数据弹框内属性值编辑框变为只读；关闭再进入才可编辑。根因是刷新「选择数据行」后 rowKey（含行下标）变化导致选中清空。

## 修改范围

- BehaviorTestDialog.vue
- tests/ontology-space-behavior.test.mjs

## 新增、修改和删除文件

- 仅修改上述文件

## 核心实现方式

loadEntityGroupDataRows 映射新列表后：主分组仍走锁定选中；否则按刷新前选中行的 dataPrimaryKey 在新列表中匹配并写回 rowKey；匹配不到再清空。

## 新增依赖

无

## 验证方式

相关测试断言、format:check、type-check、build:verify
