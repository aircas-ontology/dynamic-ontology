import type {
  CreateOntologyFunctionApiConfig,
  CreateOntologyFunctionParameter,
  CreateOntologyFunctionQueryConfig,
  CreateOntologyFunctionType,
} from "./createOntologyFunctionType";
import type { OntologyCompositeConfig } from "./ontologyCompositeConfigType";

/** 修改函数算子请求参数（与 putFunApi 契约对齐，并允许与新建一致的 EXTERNAL / COMPOSITE 字段）。 */
export interface UpdateOntologyFunctionParams {
  functionApi: string;
  /** 版本号，格式 x.y.z。 */
  version: string;
  displayName: string;
  description: string;
  type: CreateOntologyFunctionType;
  ontologySpaceId: number;
  /** 脚本语言（仅 CUSTOMIZE 有效；创建后不可修改）。 */
  language?: string;
  /** 脚本源码（仅 CUSTOMIZE 有效）。 */
  code?: string;
  /** 脚本入出参定义（仅 CUSTOMIZE 有效）。 */
  parameters?: CreateOntologyFunctionParameter[];
  /** 是否基于旧版本；外部 API 编辑与新建请求保持一致。 */
  basedOnOldVersion?: boolean;
  queryConfig?: CreateOntologyFunctionQueryConfig;
  /** 外部 API 配置（仅 EXTERNAL 有效）。 */
  apiConfig?: CreateOntologyFunctionApiConfig;
  /** 函数编排配置（仅 COMPOSITE 有效）。 */
  compositeConfig?: OntologyCompositeConfig;
}

/** 修改函数算子响应 data（契约样例无业务载荷）。 */
export type UpdateOntologyFunctionData = null;
