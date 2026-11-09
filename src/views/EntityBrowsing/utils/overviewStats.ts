/**
 * @description 格式化空间资源统计展示值。
 * @param count 计数值；缺失时显示占位符。
 * @param loading 是否仍在加载。
 * @returns 展示值与备注。
 */
export function formatOverviewStat(count: number | undefined, loading: boolean) {
  if (count === undefined || count === null) return { value: "—", note: loading ? "正在统计" : "暂无统计数据" };
  return { value: count.toLocaleString("zh-CN"), note: "当前空间总量" };
}
