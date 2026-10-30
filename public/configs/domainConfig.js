/**
 * @description 当前文件定义的是本项目的后端服务接口地址【domain】
 * 当前文件已经在 `index.html` 文件中引入到项目中，可以直接通过`DOMAIN_CONFIG.**`使用
 * */
const DOMAIN_CONFIG = {
  ontology_server: "http://101.32.194.190:38002",
  // MAP_SERVER_WMTS_URL: "http://192.168.2.201:8310",
  MAP_SERVER_WMTS_URL: "http://localhost:3000",
  MAP_SERVER_TMS_URL: "http://192.168.2.201:8310",
  OCEAN_SERVER_URL: "http://192.168.53.45:5000", // 南海先导
  OCEAN_ANALYSIS_SERVER_URL: "http://192.168.53.42:16411", // 南海先导-软件所分析模型

  //接口地址
  // LOGIN_URL: "http://172.16.29.255:37002", //登录
  // LOGIN_URL: "http://172.16.28.61:37002", //对象管理
  // LOGIN_URL: "http://localhost:37002", //对象管理（本地联调）
  LOGIN_URL: "http://172.16.18.58:37002", //对象管理
  // LOGIN_URL: "http://172.16.36.247:37002", //登录
  // ONTOLOGYMANAGE_URL: "http://172.16.29.255:37002", //对象管理
  // ONTOLOGYMANAGE_URL: "http://172.16.28.61:37002", //对象管理
  // ONTOLOGYMANAGE_URL: "http://localhost:37002", //对象管理（本地联调）
  ONTOLOGYMANAGE_URL: "http://172.16.18.58:37002", //对象管理
  // ONTOLOGYMANAGE_URL: "http://172.16.36.247:37002", //对象管理

  AGENT_URL: "http://localhost:37003/agent", //Agent对话（本地联调）
  // AGENT_URL: "http://172.16.18.58:37003/agent", //Agent对话
  // AGENT_URL: "http://172.16.36.247:37003/agent", //Agent对话

  MOCK_SERVER_URL: "http://127.0.0.1:37003", // Mock HTTP 服务，与 npm run dev 一起启动
  USE_MOCK: false, // true=走 Mock；false=走上面的真实 LOGIN / ONTOLOGY 地址
};
