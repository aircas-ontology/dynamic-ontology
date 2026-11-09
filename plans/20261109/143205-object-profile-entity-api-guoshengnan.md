# 对象画像与实体列表

## 需求理解

去掉对象画像仅允许两个演示对象的限制，按照来源页面的默认样例回退展示任意对象；实体列表接入现有分页接口。按用户此前要求恢复来源页面的固定内网实体详情嵌入地址。用户已确认。

## 范围与文件

- 修改 `src/views/EntityBrowsingObjectProfile/index.vue`、`components/ObjectProfileEntityList.vue`、`composables/useObjectProfileEntityList.ts` 和需要的页面私有数据映射文件。
- 修改画像样例 `src/mocks/entityBrowsingObjectProfileMock/entityBrowsingObjectProfileMock.ts`，恢复未命中对象的来源页面默认数据。
- 修改 `src/types/apis/getOntologyEntitiesType.ts`、`src/types/index.ts`，使实体属性兼容对象与属性数组；保留现有 API 实现与 Mock 请求路由。
- 修改 `src/utils/entityBrowseConstants.ts` 恢复来源固定地址，新增针对画像和实体列表的测试及本 Plan；不删除文件。
- 保留已有工作区改动，不修改 public、html、其他接口或依赖。

## 实现方式

取消对象 id 的画像展示限制；未知对象使用来源页面的默认演示画像并保留当前对象名称，不将其描述为真实画像。通过现有 `getOntologyEntitiesInterface` 按对象标识、页码及大小请求真实数据，沿用项目的 HTTP Mock 切换；处理 loading、success、empty、error、重试、相同请求去重、分页及对象切换时的过期响应、卸载清理。兼容属性键值对象及属性数组。保留现有过滤与列设置。详情使用来源项目的固定 iframe 地址。

## 依赖

不新增依赖。

## 验证

先测试任意对象画像渲染、属性数组映射、列表请求参数、空数据、错误重试、分页、重复请求、过期响应与销毁，并确认目标行为未实现而失败。完成后运行相关测试、npm test、npm run test:coverage、npm run check:types-conventions、npm run type-check、npm run build:verify、任务文件格式检查、git diff --check；尝试浏览器验证并记录缺口及已有失败。
