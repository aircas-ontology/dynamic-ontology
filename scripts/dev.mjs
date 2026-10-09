import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @description 在仓库根目录启动并继承标准流的子进程。
 * @param {string} command 可执行文件。
 * @param {string[]} args 启动参数。
 * @returns {import("node:child_process").ChildProcess} 子进程。
 */
function spawnInheritedProcess(command, args) {
  return spawn(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    windowsHide: true,
  });
}

const mockServerProcess = spawnInheritedProcess(process.execPath, [path.join(repoRoot, "scripts", "mock-server.mjs")]);
const viteProcess = spawnInheritedProcess(process.execPath, [path.join(repoRoot, "node_modules", "vite", "bin", "vite.js"), "--host", "0.0.0.0", "--open"]);

/**
 * @description 结束 Mock 服务与 Vite 子进程后退出当前开发入口。
 * @param {number | null | undefined} exitCode 退出码。
 */
function stopDevProcesses(exitCode) {
  if (!mockServerProcess.killed) {
    mockServerProcess.kill();
  }
  if (!viteProcess.killed) {
    viteProcess.kill();
  }
  process.exit(exitCode ?? 0);
}

viteProcess.on("exit", (exitCode) => {
  stopDevProcesses(exitCode);
});

process.on("SIGINT", () => {
  stopDevProcesses(0);
});
process.on("SIGTERM", () => {
  stopDevProcesses(0);
});
