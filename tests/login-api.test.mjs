import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('login api posts credentials to the configured login domain and uri', async () => {
  const source = await read('src/apis/loginApi.ts');

  assert.match(source, /export function postLoginInterface\(/);
  assert.match(
    source,
    /url:\s*DOMAIN_CONFIG\.LOGIN_URL\s*\+\s*["']\/ontology\/user\/login["']/,
  );
  assert.match(source, /method:\s*["']post["']/);
  assert.match(source, /data:\s*params/);
  assert.doesNotMatch(source, /^\s*params,\s*$/m);
  assert.match(source, /Promise<ApiResponse<LoginData>>/);
});

test('login domain is declared in the global runtime config type', async () => {
  const source = await read('src/types/global/runtimeConfigType.ts');

  assert.match(source, /readonly LOGIN_URL:\s*string/);
});

test('login params contract requires username and password strings', async () => {
  const source = await read('src/types/apis/loginType.ts');

  assert.match(
    source,
    /export interface LoginParams\s*{\s*username:\s*string;\s*password:\s*string;\s*}/,
  );
  assert.match(source, /export interface LoginData/);
});

test('login types and api are exposed through public barrels', async () => {
  const types = await read('src/types/index.ts');
  assert.match(
    types,
    /export type \{ LoginData, LoginParams \} from "\.\/apis\/loginType";/,
  );

  const apis = await read('src/apis/index.ts');
  assert.match(apis, /postLoginInterface/);
});

test('login page invokes the api, checks code 200, and routes to space management', async () => {
  const source = await read('src/views/LoginPage/index.vue');

  assert.match(source, /import \{ postLoginInterface \} from "@\/apis";/);
  assert.match(source, /const response = await postLoginInterface\(formData\.value\);/);
  assert.match(source, /if \(response\.code !== 200\)/);
  assert.match(source, /name: "OntologySpaceManagement"/);
});
