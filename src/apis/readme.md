# apis文件夹内的要求

- 文件命名全部采用小驼峰，以`**Api.ts`结尾
- 内部接口定义参考`exampleApi.ts`中的示例
  - 例如：`get****Interface`、`post****Interface`、`put****Interface``delete****Interface`
- 每个接口需要有`JSDoc`标准注释
- 接口的类型定义统一放在`src/types/apis文件夹中，统一命名规范
- 接口类型定义统一从`@/types/index.ts`导入
- 整个`apis`文件夹定义的接口统一从`index.ts`文件导出
- `index.ts`文件内容需要先导入、后导出，导入、导出的顺序需要按照文件名、接口名称进行顺序排序
-
