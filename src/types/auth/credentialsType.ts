export interface LoginCredentials {
  /** 用户输入的登录账号；当前仅用于安全占位表单校验。 */
  username: string;
  /** 用户输入的明文密码；不得持久化或写入日志。 */
  password: string;
}
