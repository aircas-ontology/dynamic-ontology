import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const readSource = (relativePath) => {
  const fileUrl = new URL(relativePath, import.meta.url);
  assert.equal(existsSync(fileUrl), true, `missing file: ${relativePath}`);
  return readFileSync(fileUrl, "utf8");
};

test("upload ontology thumbnail types expose file params and string data", () => {
  const typeSource = readSource("../src/types/apis/uploadOntologyThumbnailType.ts");
  const barrel = readSource("../src/types/index.ts");
  assert.match(typeSource, /export interface UploadOntologyThumbnailParams/);
  assert.match(typeSource, /image:\s*File/);
  assert.match(typeSource, /export type UploadOntologyThumbnailData = string/);
  assert.match(barrel, /export type \{ UploadOntologyThumbnailData, UploadOntologyThumbnailParams \} from "\.\/apis\/uploadOntologyThumbnailType";/);
});

test("upload ontology thumbnail api posts FormData image to the manage domain thumbnail uri", () => {
  const apiSource = readSource("../src/apis/ontologyManageApi.ts");
  assert.match(
    apiSource,
    /export function postUploadOntologyThumbnailInterface\(params: UploadOntologyThumbnailParams\): Promise<ApiResponse<UploadOntologyThumbnailData>>/,
  );
  assert.match(apiSource, /url:\s*DOMAIN_CONFIG\.ONTOLOGYMANAGE_URL \+ "\/ontology\/file\/thumbnail"/);
  assert.match(apiSource, /method:\s*"post"/);
  assert.match(apiSource, /FormData/);
  assert.match(apiSource, /append\(\s*"image"/);
  assert.doesNotMatch(apiSource, /timeout:/);
  assert.match(apiSource, /@description/);
});

test("apis barrel exports the thumbnail upload interface", () => {
  const barrel = readSource("../src/apis/index.ts");
  assert.match(barrel, /postUploadOntologyThumbnailInterface/);
});

test("upload ontology thumbnail mock mirrors the SUCCESS sample payload", () => {
  const mockSource = readSource("../src/mocks/uploadOntologyThumbnailMock/uploadOntologyThumbnailMock.ts");
  assert.match(mockSource, /export const uploadOntologyThumbnailMock: ApiResponse<UploadOntologyThumbnailData> = \{/);
  assert.match(mockSource, /code: 200,/);
  assert.match(mockSource, /message: "SUCCESS",/);
  assert.match(mockSource, /success: true,/);
  assert.match(mockSource, /data: "http:\/\/172\.16\.18\.58:9000\/ptr\/1789961861795_img\.png"/);
});
