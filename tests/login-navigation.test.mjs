import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/views/LoginPage/index.vue', import.meta.url), 'utf8');
const handler = source.match(/async function onSubmit\(\) \{[\s\S]*?(?=\n<\/script>)/)[0];

test('empty credentials enter workspace and duplicate submissions are ignored', async () => {
  let calls = 0;
  let finish;
  const state = {
    formData: { value: { username: '', password: '' } },
    loginStatus: { value: 'idle' }, loginError: { value: '' },
    ElMessage: { warning() {}, error() {} },
    router: { push(target) { assert.equal(target.name, 'Workspace'); calls++; return new Promise(resolve => { finish = resolve; }); } },
  };
  vm.createContext(state);
  vm.runInContext(handler, state);
  const pending = state.onSubmit();
  await state.onSubmit();
  assert.equal(calls, 1);
  finish();
  await pending;
  assert.equal(state.loginStatus.value, 'success');
});

test('navigation errors are visible and allow retry', async () => {
  const state = {
    formData: { value: { username: '', password: '' } },
    loginStatus: { value: 'idle' }, loginError: { value: '' },
    ElMessage: { warning() {}, error() {} },
    router: { async push() { throw new Error('unavailable'); } },
  };
  vm.createContext(state);
  vm.runInContext(handler, state);
  await state.onSubmit();
  assert.equal(state.loginStatus.value, 'error');
  assert.match(state.loginError.value, /进入系统失败/);
});
