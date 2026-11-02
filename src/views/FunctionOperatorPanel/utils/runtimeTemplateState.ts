import type { CreateFunctionRateLimitTemplateData, CreateFunctionRateLimitTemplateParams } from "@/types";

type TemplateResponse = { code: number; message?: string; data?: CreateFunctionRateLimitTemplateData };
type TemplateCommand = (params: CreateFunctionRateLimitTemplateParams) => Promise<TemplateResponse>;
type TemplateIdCommand = (params: { id: number }) => Promise<{ code: number; message?: string; data?: unknown }>;
type TemplateQuery = () => Promise<{ code: number; message?: string; data?: CreateFunctionRateLimitTemplateData[] }>;

/** @description 将服务端模板转为表格行，拒绝缺失或非法配置。 @param data 服务端模板。 @returns 表格行。 */
function mapTemplateRecord(data: CreateFunctionRateLimitTemplateData) {
  if (
    !data ||
    !Number.isSafeInteger(data.id) ||
    (data.id ?? 0) <= 0 ||
    typeof data.name !== "string" ||
    !data.name.trim() ||
    typeof data.id !== "number" ||
    typeof data.timeoutMs !== "number" ||
    typeof data.retryCount !== "number" ||
    typeof data.retryIntervalMs !== "number" ||
    typeof data.tpsLimit !== "number" ||
    typeof data.maxConcurrency !== "number" ||
    (data.enabled !== 0 && data.enabled !== 1)
  )
    throw new Error("响应缺少有效的模板数据");
  if (
    [data.timeoutMs, data.retryCount, data.retryIntervalMs, data.tpsLimit, data.maxConcurrency].some(
      (value) => !Number.isSafeInteger(value) || value < 0 || value > 2147483647,
    ) ||
    data.timeoutMs === 0 ||
    data.maxConcurrency === 0
  )
    throw new Error("响应包含无效配置整数");
  return {
    id: data.id,
    name: data.name,
    timeout: data.timeoutMs,
    retries: data.retryCount,
    retryInterval: data.retryIntervalMs,
    tps: data.tpsLimit,
    concurrency: data.maxConcurrency,
    enabled: data.enabled === 1,
  };
}

/** @description 创建运行配置模板的内存记录及独立编辑草稿。 @returns 行内编辑状态。 */
export function createRuntimeTemplateState() {
  const initial = { id: 0, name: "", timeout: 5000, retries: 2, retryInterval: 300, tps: 600, concurrency: 80, enabled: true };
  const state = {
    records: [] as (typeof initial)[],
    draft: { ...initial },
    editing: false,
    submitting: false,
    nextId: 1,
    loading: false,
    queryError: "",
    queryVersion: 0,
    /** @description 关闭或卸载时令未完成的查询失效。 */
    invalidateQuery() {
      this.queryVersion++;
      this.loading = false;
    },
    /** @description 查询全部配置，重复调用忽略，过期结果不写入。 @param queryTemplates 列表接口。 */
    async queryRemoteTemplates(queryTemplates: TemplateQuery) {
      if (this.loading) return;
      const version = ++this.queryVersion;
      this.loading = true;
      this.queryError = "";
      try {
        const response = await queryTemplates();
        if (version !== this.queryVersion) return;
        if (response.code !== 200) throw new Error(response.message || "模板列表查询失败");
        if (!Array.isArray(response.data)) throw new Error("模板列表响应格式错误");
        const records = response.data.map(mapTemplateRecord);
        if (new Set(records.map((item) => item.id)).size !== records.length) throw new Error("模板列表包含重复ID");
        this.records = records;
      } catch (cause) {
        if (version !== this.queryVersion) return;
        this.queryError = cause instanceof Error ? cause.message : "模板列表查询失败";
        throw cause;
      } finally {
        if (version === this.queryVersion) this.loading = false;
      }
    },
    /** @description 保存远程模板后重新查询；查询失败单独展示，避免重复保存。 @param createTemplate 创建接口。 @param updateTemplate 更新接口。 @param queryTemplates 列表接口。 */
    async saveRemoteTemplate(createTemplate: TemplateCommand, updateTemplate: TemplateCommand, queryTemplates: TemplateQuery) {
      if (this.submitting || this.loading || !this.editing) return;
      if (this.draft.id === 0) await this.createRemoteTemplate(createTemplate);
      else {
        const draft = this.draft;
        if (!draft.name.trim() || draft.name.trim().length > 80) throw new Error("请输入不超过80字的模板名称");
        if (
          [draft.timeout, draft.retries, draft.retryInterval, draft.tps, draft.concurrency].some(
            (value) => !Number.isSafeInteger(value) || value < 0 || value > 2147483647,
          ) ||
          !draft.timeout ||
          !draft.concurrency
        )
          throw new Error("请输入有效的配置整数");
        this.submitting = true;
        try {
          const response = await updateTemplate({
            id: draft.id,
            name: draft.name.trim(),
            timeoutMs: draft.timeout,
            retryCount: draft.retries,
            retryIntervalMs: draft.retryInterval,
            tpsLimit: draft.tps,
            maxConcurrency: draft.concurrency,
            enabled: draft.enabled ? 1 : 0,
          });
          if (response.code !== 200) throw new Error(response.message || "模板更新失败");
          this.editing = false;
        } finally {
          this.submitting = false;
        }
      }
      try {
        await this.queryRemoteTemplates(queryTemplates);
      } catch {
        /* 查询错误由 queryError 展示，保存已成功。 */
      }
    },
    /** @description 执行删除或启停命令，成功后刷新，失败保留原数据。 @param id 模板ID。 @param command 后端命令。 @param queryTemplates 列表接口。 @returns 是否已执行成功。 */
    async executeRemoteCommand(id: number, command: TemplateIdCommand, queryTemplates: TemplateQuery): Promise<boolean> {
      if (this.submitting || this.loading || this.editing) return false;
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error("模板ID无效");
      const version = this.queryVersion;
      this.submitting = true;
      try {
        const response = await command({ id });
        if (response.code !== 200) throw new Error(response.message || "模板操作失败");
        if (version === this.queryVersion) {
          try {
            await this.queryRemoteTemplates(queryTemplates);
          } catch {
            /* 刷新失败由列表展示，命令已经成功。 */
          }
        }
        return true;
      } finally {
        this.submitting = false;
      }
    },
    /** @description 按滑块目标状态选择启用或停用接口，不提前修改状态。 @param id 模板ID。 @param enabled 目标启用状态。 @param enableTemplate 启用接口。 @param disableTemplate 停用接口。 @param queryTemplates 列表接口。 @returns 是否已执行成功。 */
    async changeRemoteEnabled(
      id: number,
      enabled: boolean,
      enableTemplate: TemplateIdCommand,
      disableTemplate: TemplateIdCommand,
      queryTemplates: TemplateQuery,
    ): Promise<boolean> {
      const record = this.records.find((item) => item.id === id);
      if (!record || record.enabled === enabled) return false;
      return this.executeRemoteCommand(id, enabled ? enableTemplate : disableTemplate, queryTemplates);
    },
    /** @description 插入新增草稿，已有草稿时保持不变。 */
    beginCreate() {
      if (this.editing || this.loading || this.submitting) return;
      this.draft = { ...initial };
      this.editing = true;
    },
    /** @description 复制指定记录以便编辑。 @param id 模板标识。 */
    beginEdit(id: number) {
      if (this.editing || this.loading || this.submitting) return;
      const record = this.records.find((item) => item.id === id);
      if (!record) return;
      this.draft = { ...record };
      this.editing = true;
    },
    /** @description 丢弃编辑草稿，不改变已保存记录。 */
    cancelEdit() {
      if (this.submitting) return;
      this.editing = false;
    },
    /**
     * @description 提交新增模板，失败保留草稿，成功使用服务端返回数据。
     * @param createTemplate 创建接口。
     */
    async createRemoteTemplate(
      createTemplate: (
        params: CreateFunctionRateLimitTemplateParams,
      ) => Promise<{ code: number; message?: string; data?: CreateFunctionRateLimitTemplateData }>,
    ) {
      if (this.submitting || !this.editing || this.draft.id !== 0) return;
      const draft = this.draft;
      if (!draft.name.trim() || draft.name.trim().length > 80) throw new Error("请输入不超过80字的模板名称");
      const numbers = [draft.timeout, draft.retries, draft.retryInterval, draft.tps, draft.concurrency];
      if (numbers.some((value) => !Number.isSafeInteger(value) || value < 0 || value > 2147483647) || !draft.timeout || !draft.concurrency)
        throw new Error("请输入有效的配置整数");
      this.submitting = true;
      try {
        const response = await createTemplate({
          name: draft.name.trim(),
          timeoutMs: draft.timeout,
          retryCount: draft.retries,
          retryIntervalMs: draft.retryInterval,
          tpsLimit: draft.tps,
          maxConcurrency: draft.concurrency,
          enabled: draft.enabled ? 1 : 0,
        });
        if (response.code !== 200) throw new Error(response.message || "模板创建失败");
        const data = response.data;
        if (
          !data ||
          typeof data.id !== "number" ||
          !Number.isSafeInteger(data.id) ||
          data.id <= 0 ||
          typeof data.name !== "string" ||
          !data.name.trim() ||
          typeof data.timeoutMs !== "number" ||
          typeof data.retryCount !== "number" ||
          typeof data.retryIntervalMs !== "number" ||
          typeof data.tpsLimit !== "number" ||
          typeof data.maxConcurrency !== "number" ||
          (data.enabled !== 0 && data.enabled !== 1)
        )
          throw new Error("创建响应缺少有效的模板数据，请刷新后确认创建结果");
        if (this.records.some((item) => item.id === data.id)) throw new Error("创建响应模板ID已存在，请刷新后确认创建结果");
        this.records.push({
          id: data.id,
          name: data.name,
          timeout: data.timeoutMs,
          retries: data.retryCount,
          retryInterval: data.retryIntervalMs,
          tps: data.tpsLimit,
          concurrency: data.maxConcurrency,
          enabled: data.enabled === 1,
        });
        this.nextId = Math.max(this.nextId, data.id + 1);
        this.editing = false;
      } finally {
        this.submitting = false;
      }
    },
    /** @description 校验名称和整数配置并提交草稿。 */
    commitDraft() {
      if (!this.editing) return;
      const draft = this.draft;
      if (!draft.name.trim() || draft.name.trim().length > 80) throw new Error("请输入不超过80字的模板名称");
      const values = [draft.timeout, draft.retries, draft.retryInterval, draft.tps, draft.concurrency];
      if (values.some((value) => !Number.isSafeInteger(value) || value < 0) || draft.timeout === 0 || draft.concurrency === 0)
        throw new Error("配置必须为非负整数，超时和最大并发必须大于0");
      const record = { ...draft, name: draft.name.trim(), id: draft.id || this.nextId++ };
      const index = this.records.findIndex((item) => item.id === record.id);
      if (index < 0) this.records.push(record);
      else this.records[index] = record;
      this.editing = false;
    },
    /**
     * @description 非编辑状态下直接设置模板启停，编辑期间保留原记录以支持取消恢复。
     * @param id 模板标识。
     * @param enabled 是否启用。
     */
    setRecordEnabled(id: number, enabled: boolean) {
      if (this.editing || this.loading || this.submitting) return;
      const record = this.records.find((item) => item.id === id);
      if (record) record.enabled = enabled;
    },
    /** @description 移除指定模板。 @param id 模板标识。 */
    removeRecord(id: number) {
      this.records = this.records.filter((item) => item.id !== id);
    },
  };
  return state;
}
