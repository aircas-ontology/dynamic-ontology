import { request } from "@/utils/request";

/**
 * @description
 * @param
 * @returns
 */
export function getExample(params: any) {
  return request({
    url: "/example",
    method: "get",
    params,
  });
}
