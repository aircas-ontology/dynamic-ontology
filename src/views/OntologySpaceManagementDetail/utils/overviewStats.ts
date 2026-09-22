export function formatOverviewStat(count: number | undefined, loading: boolean) {
  if (count === undefined || count === null) return { value: "—", note: loading ? "正在统计" : "暂无统计数据" };
  return { value: count.toLocaleString("zh-CN"), note: "当前空间总量" };
}
