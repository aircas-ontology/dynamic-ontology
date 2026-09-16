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
  LOGIN_URL:"http://172.16.18.58:37002",//登录
  // ONTOLOGYMANAGE_URL:"http://172.16.18.58:37002",//本体管理
  ONTOLOGYMANAGE_URL:"/serviceApi",//本体管理

};
