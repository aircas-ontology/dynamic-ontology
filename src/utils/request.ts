import axios from "axios";

/** 通用API响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
  success: boolean;
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

instance.interceptors.response.use(
  (response) => response.data,
  (error: unknown) => Promise.reject(normalizeRequestError(error)),
);

/** 类型化的 request，返回 ApiResponse<T> 而非 AxiosResponse */
export const request = instance as {
  <T = unknown>(config: Parameters<typeof instance.request>[0]): Promise<ApiResponse<T>>;
  get<T = unknown>(url: string, config?: Parameters<typeof instance.get>[1]): Promise<ApiResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof instance.post>[2]): Promise<ApiResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof instance.put>[2]): Promise<ApiResponse<T>>;
  delete<T = unknown>(url: string, config?: Parameters<typeof instance.delete>[1]): Promise<ApiResponse<T>>;
};
