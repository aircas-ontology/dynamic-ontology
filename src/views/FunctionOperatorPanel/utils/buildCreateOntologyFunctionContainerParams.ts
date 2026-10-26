import type {
  CreateOntologyFunctionContainerParams,
  ProbeOntologyFunctionContainerInterfaceItem,
  ProbeOntologyFunctionContainerInterfaceParameter,
  UploadOntologyFunctionContainerDocData,
  UploadOntologyFunctionContainerImageData,
} from "@/types";

/** 组装创建容器算子请求的输入。 */
export interface BuildCreateOntologyFunctionContainerParamsInput {
  functionApi: string;
  version: string;
  displayName: string;
  description: string;
  ontologySpaceId: number;
  image: UploadOntologyFunctionContainerImageData;
  interfaceDoc: UploadOntologyFunctionContainerDocData | null;
  runCommand: string;
  selectedInterfaces: ProbeOntologyFunctionContainerInterfaceItem[];
  /** 限流配置模板 ID；有值才写入请求体。 */
  rateLimitTemplateId?: number;
}

/**
 * @description 递归剥离探查参数上的展示字段 _rowKey，保留契约 fields。
 * @param params 参数树。
 * @returns 可提交的参数树。
 */
function stripProbeContainerParamDisplayKeys(params: ProbeOntologyFunctionContainerInterfaceParameter[]): ProbeOntologyFunctionContainerInterfaceParameter[] {
  return params.map((param) => {
    const { _rowKey: _ignored, ...rest } = param as ProbeOntologyFunctionContainerInterfaceParameter & { _rowKey?: string };
    const next: ProbeOntologyFunctionContainerInterfaceParameter = {
      name: rest.name,
      in: rest.in,
      required: rest.required,
      type: rest.type,
      description: rest.description,
    };
    if (Array.isArray(rest.fields) && rest.fields.length > 0) {
      next.fields = stripProbeContainerParamDisplayKeys(rest.fields);
    }
    return next;
  });
}

/**
 * @description 剥离已选接口上的展示字段，保留探查契约结构。
 * @param items 已选接口。
 * @returns 可提交的接口列表。
 */
function stripProbeContainerInterfaceDisplayKeys(items: ProbeOntologyFunctionContainerInterfaceItem[]): ProbeOntologyFunctionContainerInterfaceItem[] {
  return items.map((item) => ({
    ...item,
    inputParameters: stripProbeContainerParamDisplayKeys(item.inputParameters ?? []),
    outputParameters: stripProbeContainerParamDisplayKeys(item.outputParameters ?? []),
  }));
}

/**
 * @description 将容器算子表单字段组装为创建接口请求体（容器字段置于 containerConfig）。
 * @param input 表单已校验字段。
 * @returns 创建容器算子请求参数。
 */
export function buildCreateOntologyFunctionContainerParams(input: BuildCreateOntologyFunctionContainerParamsInput): CreateOntologyFunctionContainerParams {
  const description = input.description.trim();
  const params: CreateOntologyFunctionContainerParams = {
    functionApi: input.functionApi.trim(),
    version: input.version.trim(),
    displayName: input.displayName.trim(),
    ...(description ? { description } : {}),
    type: "CONTAINER",
    ontologySpaceId: input.ontologySpaceId,
    containerConfig: {
      image: input.image,
      ...(input.interfaceDoc ? { interfaceDoc: input.interfaceDoc } : {}),
      runCommand: input.runCommand.trim(),
      selectedInterfaces: stripProbeContainerInterfaceDisplayKeys(input.selectedInterfaces),
    },
  };
  if (typeof input.rateLimitTemplateId === "number" && Number.isFinite(input.rateLimitTemplateId)) {
    params.rateLimitTemplateId = input.rateLimitTemplateId;
  }
  return params;
}
