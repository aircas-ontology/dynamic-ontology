import axios from "axios";
import { setStorage, getStorage, removeStorage } from "@/utils/storage";

/** 通用API响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
  success: boolean;
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

instance.interceptors.request.use(
  (config) => {
    const userId = getStorage("userId");
    const token = getStorage("token");

    if (userId) config.headers.userId = userId;
    if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => {
    console.error("请求错误：", error);
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      return response.data;
    }
  },
  (error) => {
    console.log(error.response?.status);

    if (error && error.response) {
      const status: number = error.response.status;
      const tips =
        status in httpCode
          ? httpCode[status]
          : error.response.data.message;

      console.log(tips);

      return Promise.reject(error.response.data);
    } else {
      console.log("请求超时，请刷新重试");
      return Promise.reject(new Error("请求超时，连接服务器失败"));
    }
  },
);

/** 类型化的 request，返回 ApiResponse<T> 而非 AxiosResponse */
export const request = instance as {
  <T = unknown>(config: Parameters<typeof instance.request>[0]): Promise<ApiResponse<T>>;
  get<T = unknown>(url: string, config?: Parameters<typeof instance.get>[1]): Promise<ApiResponse<T>>;
  post<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof instance.post>[2]): Promise<ApiResponse<T>>;
  put<T = unknown>(url: string, data?: unknown, config?: Parameters<typeof instance.put>[2]): Promise<ApiResponse<T>>;
  delete<T = unknown>(url: string, config?: Parameters<typeof instance.delete>[1]): Promise<ApiResponse<T>>;
};
