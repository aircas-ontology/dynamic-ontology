## 1 本体空间管理页面样式修改与原型保持一致

## 需求背景

参考原型项目本体空间管理页面： `E:\资料\h数字5模块\project\github-project\src\views\OntologySpaceManagement\index.vue`的样式实现方式，修改当前项目的本体空间管理页面:`src\views\OntologySpaceManagement\index.vue`的样式展示

## 功能要求

1.界面风格与原型保持一致2.页面样式优先用公共样式，公共样式不能满足的部分用页面内部样式覆盖，不修改公共样式3.需要注意细节样式问题，尽量保持样式一致，不一致的部分请说明4.要求页面内容与原型保持一致，不新增，减少5.页面数据进行mock数据模拟，mock数据存放位置与命名规则参照项目要求6.去掉原型中使用的渐变风格，范围：边框、按钮背景、卡片背景、弹窗背景等7.现有mock实现方式按照项目要求修改和存放

## 2 本体空间管理页面样式修改

## 功能要求

页面路径：`/src/views/OntologySpaceManagement/components/SpaceTable.vue`,修改内容：本体空间卡片的统计区域补充展示原型上的小图标，去掉创建人信息展示，创建时间与更新时间保持一行展示。小图标如果现有方式不能满足，在不修改公共文件的前提下，用页面内部方式实现

## 3 本体空间管理页面资源统计页面开发

在这个路由下`workspace/ontology-space-management/navy/overview`实现原型的`E:\资料\h数字5模块\project\github-project\src\views\OntologySpaceManagementDetail\components\SpaceOverviewPanel.vue`这个页面的页面布局，按照项目规范生成mock数据，样式及颜色按照原型页面实现，不能用公共样式实现的采用页面私有方式实现

## 4 本体空间管理页面-对象页面开发

在这个路由下`/workspace/ontology-space-management/navy/object`制作一个新页面，页面为左右布局，分别引入私有内部组件实现，左侧为概念层级树，概念层级树组件页面按照原型的`E:\资料\h数字5模块\project\github-project\src\views\OntologySpaceManagementDetail\components\SidePanel.vue`页面展示实现；右侧为对象展示列表，展示方式分为列表和卡片两种，原型页面位置：`E:\资料\h数字5模块\project\github-project\src\views\OntologySpaceManagementDetail\components\OntologySectionList.vue`。实现要求：样式一致，公共样式不能满足就用页面私有样式，页面内左右布局方式按照规范。左侧概念层级树选择分类后右侧通过锚点定位。
