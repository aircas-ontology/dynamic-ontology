/** 上传容器算子镜像的请求参数。 */
export interface UploadOntologyFunctionContainerImageParams {
  /** 镜像包文件（.tar / .tar.gz / .tgz）。 */
  file: File;
}

/** 上传容器算子镜像成功后的响应 data。 */
export interface UploadOntologyFunctionContainerImageData {
  /** 原始文件名。 */
  fileName: string;
  /** 服务端存储路径。 */
  path: string;
  /** 文件大小（字节）。 */
  size: number;
  /** 架构标识（如 arm64 / unknown）。 */
  architecture: string;
  /** 镜像仓库标签列表。 */
  repoTags: string[];
}
