import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

import type { ApiResponse } from "@/types";
import { clearLoginToken, getAccessTokenHeader } from "./authToken.ts";

declare module "axios" {
  interface AxiosRequestConfig {
    /** 为 true 时响应拦截器返回完整 AxiosResponse（含响应头），默认仅返回响应体。 */
    resolveFullResponse?: boolean;
  }
}

export class RequestError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "RequestError";
    this.status = status;
  }
}

const instance = axios.create({
  timeout: 1000 * 60 * 10,
});

instance.defaults.headers.get["Content-Type"] = "application/x-www-form-urlencoded";
instance.defaults.headers.post["Content-Type"] = "application/json";
instance.defaults.headers.put["Content-Type"] = "application/json";
instance.defaults.headers.delete["Content-Type"] = "application/json";

const httpCode: Record<number, string> = {
  400: "请求参数错误",
  401: "权限不足，请重新登录",
  403: "服务器拒绝本次访问",
  404: "请求资源未找到",
  405: "请求方法错误",
  500: "内部服务器错误",
  501: "服务器不支持该请求中使用的方法",
  502: "网关错误",
  503: "服务器不可用",
  504: "网关超时",
};

export function normalizeRequestError(error: unknown): RequestError {
  if (!axios.isAxiosError(error)) {
    return new RequestError("请求失败，请稍后重试。");
  }

  const status = error.response?.status ?? null;
  if (status !== null) {
    return new RequestError(httpCode[status] ?? "请求失败，请稍后重试。", status);
  }

  if (error.code === "ECONNABORTED") {
    return new RequestError("请求超时，请稍后重试。");
  }

  return new RequestError("网络连接失败，请检查网络后重试。");
}

/**
 * @description 请求拦截器：已登录时为每个业务请求统一注入 `access-token: Bearer <token>`，未登录不写入该头。
 * @param config axios 内部请求配置。
 * @returns 补充鉴权头后的请求配置。
 */
export function authorizeRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const accessToken = getAccessTokenHeader();
  if (accessToken) {
    config.headers.set("access-token", accessToken);
  }
  return config;
}

/**
 * @description 成功响应拦截器：默认返回响应体 ApiResponse；标记 resolveFullResponse 时返回完整响应以读取响应头。
 * @param response axios 响应对象。
 * @returns 响应体或完整响应对象（响应体经拦截器链改写，类型上仍声明为 AxiosResponse）。
 */
export function resolveResponseData(response: AxiosResponse): AxiosResponse {
  return response.config.resolveFullResponse ? response : response.data;
}

/**
 * @description 失败响应拦截器：401 时清除会话令牌，并将错误归一化为不含服务端细节的 RequestError 后抛出。
 * @param error 原始请求错误。
 */
export function rejectResponse(error: unknown): never {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    clearLoginToken();
  }
  throw normalizeRequestError(error);
}

instance.interceptors.request.use(authorizeRequest);
instance.interceptors.response.use(resolveResponseData, rejectResponse);

/** 需要同时读取响应体与响应头的请求结果（如登录响应头下发令牌）。 */
export interface FullApiResponse<T> {
  data: ApiResponse<T>;
  headers: AxiosResponse["headers"];
}

/**
 * @description 发起需要读取响应头的请求，返回响应体与响应头；其余行为与默认 request 一致。
 * @param config axios 请求配置。
 * @returns 响应体与响应头组成的对象。
 */
export async function requestFull<T = unknown>(config: Parameters<typeof instance.request>[0]): Promise<FullApiResponse<T>> {
  const response = await instance.request<ApiResponse<T>, AxiosResponse<ApiResponse<T>>>({
    ...config,
    resolveFullResponse: true,
  });
  return { data: response.data, headers: response.headers };
}

/** 类型化的 request，返回 ApiResponse<T> 而非 AxiosResponse */
export const request = instance as {
  <T = unknown>(config: Parameters<typeof instance.request>[0]): Promise<ApiResponse<T>>;
  get<T = unknown>(url: string, config?: Parameters<typeof instance.get>[1]): Promise<ApiResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof instance.post>[2]): Promise<ApiResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof instance.put>[2]): Promise<ApiResponse<T>>;
  delete<T = unknown>(url: string, config?: Parameters<typeof instance.delete>[1]): Promise<ApiResponse<T>>;
};
