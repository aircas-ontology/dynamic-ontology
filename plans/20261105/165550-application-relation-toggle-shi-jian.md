# 应用行为绑定关系支持取消单选

## 需求理解

应用行为「绑定关系」支持单选，再次点击已选项可取消；保存时仍要求必须选择一条关系。

## 修改范围

- `BehaviorFormDialog.vue` 应用关系选择切换逻辑与提示文案
- 相关测试断言

## 新增、修改和删除文件

### 新增

- `plans/20261105/165550-application-relation-toggle-shi-jian.md`

### 修改

- `src/views/SpaceBehaviorWorkspace/components/BehaviorFormDialog.vue`
- `tests/ontology-space-behavior.test.mjs`

### 删除

无

## 核心实现方式

`selectApplicationRelationRow`：若点击当前已选 id 则清空，否则选中该 id。提示文案补充可取消。保存校验不变。

## 新增依赖及必要性

无。

## 验证方式

- `node --test tests/ontology-space-behavior.test.mjs`
- `npm run format:check -- <任务文件>`
