import type { ApiResponse, UploadOntologyThumbnailData } from "@/types";

export const uploadOntologyThumbnailMock: ApiResponse<UploadOntologyThumbnailData> = {
  code: 200,
  message: "SUCCESS",
  success: true,
  data: "http://172.16.18.58:9000/ptr/1789961861795_img.png",
};
