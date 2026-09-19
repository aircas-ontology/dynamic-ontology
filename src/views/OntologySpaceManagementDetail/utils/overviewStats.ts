export function formatOverviewStat(count: number | undefined, allowed: boolean, loading: boolean) {
  if (!allowed) return { value: "—", note: "无查看权限" };
  if (count === undefined) return { value: "—", note: loading ? "正在统计" : "暂无统计数据" };
  return { value: count.toLocaleString("zh-CN"), note: "当前空间总量" };
}
