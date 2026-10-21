import type {
  CreateOntologyFunctionContainerParams,
  ProbeOntologyFunctionContainerInterfaceItem,
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
}

/**
 * @description 将容器算子表单字段组装为创建接口请求体（容器字段置于 containerConfig）。
 * @param input 表单已校验字段。
 * @returns 创建容器算子请求参数。
 */
export function buildCreateOntologyFunctionContainerParams(input: BuildCreateOntologyFunctionContainerParamsInput): CreateOntologyFunctionContainerParams {
  const description = input.description.trim();
  return {
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
      selectedInterfaces: input.selectedInterfaces,
    },
  };
}
