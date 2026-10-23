import type { ApiResponse, ProbeOntologyFunctionContainerInterfacesData } from "@/types";

/** 探查容器算子接口文档成功样例。 */
export const probeOntologyFunctionContainerInterfacesMock: ApiResponse<ProbeOntologyFunctionContainerInterfacesData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: [
    {
      name: "getEcho",
      api: "GET /get",
      method: "GET",
      path: "/get",
      description: "GET 回显查询参数",
      inputParameters: [
        {
          name: "name",
          in: "query",
          required: false,
          type: "string",
          description: "要回显的名字",
        },
      ],
      outputParameters: [
        {
          name: "args",
          in: "body",
          required: false,
          type: "object",
          description: "回显的查询参数",
          fields: [
            {
              name: "name",
              in: "body",
              required: false,
              type: "string",
              description: "回显的名字",
            },
          ],
        },
        {
          name: "origin",
          in: "body",
          required: false,
          type: "string",
          description: "调用方地址",
        },
        {
          name: "url",
          in: "body",
          required: false,
          type: "string",
          description: "完整请求 URL",
        },
      ],
    },
    {
      name: "postEcho",
      api: "POST /post",
      method: "POST",
      path: "/post",
      description: "POST 回显请求体",
      inputParameters: [
        {
          name: "title",
          in: "body",
          required: false,
          type: "string",
          description: "标题",
        },
        {
          name: "content",
          in: "body",
          required: false,
          type: "string",
          description: "内容",
        },
      ],
      outputParameters: [
        {
          name: "json",
          in: "body",
          required: false,
          type: "object",
          description: "回显的请求体",
          fields: [
            {
              name: "title",
              in: "body",
              required: false,
              type: "string",
              description: "标题",
            },
            {
              name: "content",
              in: "body",
              required: false,
              type: "string",
              description: "内容",
            },
          ],
        },
      ],
    },
  ],
};
