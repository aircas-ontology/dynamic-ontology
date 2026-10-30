容器启停操作存在并发控制 Bug
P1 · 业务逻辑问题
文件：FunctionOperatorContainerRuntimePanel.vue

问题代码：
let actionSequence = 0;

async function startContainerRuntime(row) {
const currentAction = ++actionSequence;

setRuntimeActionSubmitting(row.containerKey, true);

try {
const response = await postOntologyFunctionContainerRuntimeStartInterface({
containerKey: row.containerKey
});

    if (currentAction !== actionSequence || !props.active) {
      return;
    }

    // 处理结果

} finally {
if (currentAction === actionSequence) {
setRuntimeActionSubmitting(row.containerKey, false);
}
}
}

问题在于：actionSequence 是全局变量，而不是针对每个容器独立管理。

将全局序号改为按 containerKey 独立管理：
const actionSequences = new Map<string, number>();

每个容器维护自己的请求序号。

同时，finally 应确保清理对应容器的提交状态，不能因为其他容器发起新请求而跳过清理。
