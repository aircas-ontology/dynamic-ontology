<template>
  <section class="ontology-llm-builder" aria-label="大模型构建本体流程">
    <div class="ontology-llm-builder__heading">
      <div>
        <p class="ontology-llm-builder__eyebrow">ONTOLOGY COPILOT</p>
        <h1>大模型构建本体流程 <span>OntoPilot</span></h1>
      </div>
      <el-button class="aircas-button" @click="goBack">返回空间</el-button>
    </div>

    <div class="ontology-llm-builder__layout">
      <aside class="ontology-llm-builder__steps" aria-label="构建步骤">
        <button
          v-for="(step, index) in steps"
          :key="step.title"
          type="button"
          class="ontology-llm-builder__step"
          :class="{ 'is-active': currentStep === index, 'is-complete': currentStep > index }"
          :aria-current="currentStep === index ? 'step' : undefined"
          @click="selectStep(index)"
        >
          <span class="ontology-llm-builder__step-index">{{ index + 1 }}</span>
          <span
            ><strong>{{ step.title }}</strong
            ><small>{{ step.description }}</small></span
          >
        </button>
      </aside>

      <main class="ontology-llm-builder__content">
        <template v-if="currentStep === 0">
          <header class="ontology-llm-builder__content-header">
            <div>
              <p class="ontology-llm-builder__eyebrow">STEP 01</p>
              <h2>定义本体对象</h2>
              <p>用自然语言明确对象目标与边界</p>
            </div>
            <el-button class="aircas-button" @click="goBack">返回空间</el-button>
          </header>
          <el-form class="aircas-form ontology-llm-builder__form" label-position="top">
            <el-form-item label="建模任务描述（自然语言）" required>
              <el-input v-model="draft.description" class="aircas-input" type="textarea" :rows="5" maxlength="1000" show-word-limit />
            </el-form-item>
            <el-form-item label="建模范围">
              <el-select
                v-model="draft.scope"
                class="aircas-input"
                popper-class="aircas-select-popper"
                multiple
                filterable
                allow-create
                default-first-option
                ariaLabel="建模范围"
              >
                <el-option v-for="item in scopeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label="输出目标">
              <el-select v-model="draft.targets" class="aircas-input" popper-class="aircas-select-popper" multiple ariaLabel="输出目标">
                <el-option v-for="item in targetOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <div class="ontology-llm-builder__form-grid">
              <el-form-item label="目标粒度">
                <el-radio-group :model-value="draft.granularity" class="aircas-radio-group" @update:model-value="setGranularity">
                  <el-radio value="class">类级</el-radio><el-radio value="subclass">子类级</el-radio><el-radio value="instance">实例级</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="语言">
                <el-select v-model="draft.language" class="aircas-input" popper-class="aircas-select-popper" ariaLabel="语言"
                  ><el-option label="中文" value="中文" /><el-option label="English" value="English"
                /></el-select>
              </el-form-item>
            </div>
          </el-form>
          <section class="ontology-llm-builder__recommendations">
            <div class="ontology-llm-builder__recommendation-block">
              <h3>Copilot 建议</h3>
              <div class="ontology-llm-builder__chips">
                <button v-for="item in suggestions" :key="item" type="button" @click="addScope(item)">{{ item }}</button>
              </div>
            </div>
            <div class="ontology-llm-builder__recommendation-block">
              <h3>推荐资料</h3>
              <ul>
                <li v-for="item in references" :key="item.name">
                  <span>{{ item.name }}</span
                  ><em>{{ item.score }}% 相关</em>
                </li>
              </ul>
            </div>
          </section>
        </template>
        <section v-else class="ontology-llm-builder__placeholder" aria-live="polite">
          <span class="ontology-llm-builder__placeholder-number">{{ currentStep + 1 }}</span>
          <h2>{{ currentStepInfo.title }}</h2>
          <p>{{ currentStepInfo.description }}。完成第一步后可继续配置此阶段。</p>
          <el-button class="aircas-button" type="primary" @click="goNext">继续下一步</el-button>
        </section>

        <footer class="ontology-llm-builder__footer">
          <el-button class="aircas-button" :disabled="currentStep === 0" @click="goPrevious">上一步</el-button>
          <el-button class="aircas-button" type="primary" @click="goNext">{{ currentStep === steps.length - 1 ? "完成构建" : "下一步" }}</el-button>
        </footer>
      </main>
    </div>
    <button class="ontology-llm-builder__assistant" type="button" aria-label="打开 AI 助手" @click="openAssistant">✦<span>AI 助手</span></button>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";

interface LlmStep {
  title: string;
  description: string;
}
interface LlmDraft {
  description: string;
  scope: string[];
  targets: string[];
  granularity: "class" | "subclass" | "instance";
  language: string;
}

const router = useRouter();
const currentStep = ref(0);
const draft = reactive<LlmDraft>({
  description: "构建阿利·伯克级驱逐舰本体，覆盖船体结构、武器、传感器、动力与指控子系统，输出概念模型、属性模板、关系约束与能力规则。",
  scope: ["军事装备", "海军装备", "驱逐舰"],
  targets: ["概念模型", "属性模板", "关系约束", "能力函数", "规则"],
  granularity: "class",
  language: "中文",
});
const steps: LlmStep[] = [
  { title: "定义本体对象", description: "用自然语言明确对象目标与边界" },
  { title: "导入资料", description: "上传或关联领域资料" },
  { title: "构建对象", description: "生成对象基本信息" },
  { title: "构建属性", description: "配置对象属性与字段，可跳过" },
  { title: "构建关系", description: "推测对象与其他目标之间的关系，可跳过" },
  { title: "构建函数", description: "生成对象函数算子，可跳过" },
  { title: "构建行为", description: "输出行为，可跳过" },
  { title: "构建行为树", description: "输出可组成行为树的行为步骤，可跳过" },
  { title: "构建行为调度规则", description: "配置行为触发与调度规则，可跳过" },
  { title: "评估", description: "评估构建结果与质量" },
  { title: "完成", description: "确认写入并结束流程" },
];
const scopeOptions = ["军事装备", "海军装备", "驱逐舰", "航空母舰", "传感器系统"];
const targetOptions = ["概念模型", "属性模板", "关系约束", "能力函数", "规则"];
const currentStepInfo = computed(() => steps[currentStep.value] ?? { title: "", description: "" });
const suggestions = ["船体结构", "武器系统", "传感器系统", "动力系统", "指控系统", "人员编制"];
const references = [
  { name: "MIL-STD-961E 舰船控制系统规范.pdf", score: 98 },
  { name: "DDG-51 作战系统手册.docx", score: 95 },
  { name: "宙斯盾传感器接口表.xlsx", score: 91 },
];

/** @description 返回空间管理页面。 */
function goBack() {
  void router.push({ name: "OntologySpaceManagement" });
}

/** @description 切换当前构建步骤。 @param index 目标步骤索引。 */
function selectStep(index: number) {
  currentStep.value = Math.max(0, Math.min(index, steps.length - 1));
}

/** @description 更新目标粒度，过滤 Element Plus 可能发出的非字符串值。 @param value 新的粒度值。 */
function setGranularity(value: string | number | boolean | undefined) {
  if (value === "class" || value === "subclass" || value === "instance") draft.granularity = value;
}

/** @description 前进到下一步或完成构建流程。 */
function goNext() {
  if (!draft.description.trim()) {
    ElMessage.warning("请填写建模任务描述");
    return;
  }
  if (currentStep.value < steps.length - 1) {
    currentStep.value += 1;
    return;
  }
  ElMessage.success("本体大模型构建流程已完成");
}

/** @description 返回上一个构建步骤。 */
function goPrevious() {
  if (currentStep.value > 0) currentStep.value -= 1;
}

/** @description 将 Copilot 建议添加到建模范围。 @param value 建议名称。 */
function addScope(value: string) {
  if (!draft.scope.includes(value)) draft.scope.push(value);
}

/** @description 打开 AI 助手提示。 */
function openAssistant() {
  ElMessage.info("AI 助手将在后续步骤中提供构建建议");
}
</script>

<style scoped lang="scss">
.ontology-llm-builder {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-page-background);
}
.ontology-llm-builder__heading,
.ontology-llm-builder__content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.ontology-llm-builder__heading h1 {
  margin: 4px 0 0;
  font-size: 20px;
}
.ontology-llm-builder__heading h1 span {
  margin-left: 8px;
  color: var(--aircas-color-accent-cyan);
  font-size: 13px;
  font-weight: 500;
}
.ontology-llm-builder__eyebrow {
  margin: 0;
  color: var(--aircas-color-accent-cyan);
  font-size: 11px;
  letter-spacing: 0.12em;
}
.ontology-llm-builder__layout {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 12px;
}
.ontology-llm-builder__steps,
.ontology-llm-builder__content {
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 8px;
  background: linear-gradient(135deg, var(--aircas-color-overlay), var(--aircas-color-overlay-deep));
  box-shadow: inset 0 0 20px var(--aircas-color-page-glow);
}

:root[theme="light"] .ontology-llm-builder__steps,
:root[theme="light"] .ontology-llm-builder__content {
  background: linear-gradient(135deg, var(--aircas-color-card-background), var(--aircas-color-panel-background-deep));
}
.ontology-llm-builder__steps {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
}
.ontology-llm-builder__step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 8px;
  border: 1px solid var(--aircas-color-transparent);
  border-radius: 7px;
  color: var(--aircas-color-text-secondary);
  background: var(--aircas-color-transparent);
  text-align: left;
  cursor: pointer;
}
.ontology-llm-builder__step:hover,
.ontology-llm-builder__step:focus-visible {
  border-color: var(--aircas-color-border-soft);
  background: var(--aircas-color-hover-background);
  outline: none;
}
.ontology-llm-builder__step.is-active {
  border-color: var(--aircas-color-accent-cyan);
  color: var(--aircas-color-text-primary);
  background: var(--aircas-color-accent-cyan-soft);
}
.ontology-llm-builder__step.is-complete .ontology-llm-builder__step-index {
  color: var(--aircas-color-success);
}
.ontology-llm-builder__step-index {
  display: grid;
  width: 22px;
  height: 22px;
  flex: none;
  place-items: center;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 50%;
  color: var(--aircas-color-accent-cyan);
  font-size: 11px;
}
.ontology-llm-builder__step strong,
.ontology-llm-builder__step small {
  display: block;
}
.ontology-llm-builder__step strong {
  font-size: 13px;
}
.ontology-llm-builder__step small {
  margin-top: 3px;
  color: var(--aircas-color-text-muted);
  font-size: 11px;
  line-height: 1.4;
}
.ontology-llm-builder__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 16px;
  overflow: auto;
}
.ontology-llm-builder__content-header h2 {
  margin: 4px 0;
  font-size: 18px;
}
.ontology-llm-builder__content-header p:last-child {
  margin: 0;
  color: var(--aircas-color-text-secondary);
  font-size: 13px;
}
.ontology-llm-builder__form {
  max-width: 920px;
  margin-top: 20px;
}
.ontology-llm-builder__form-grid {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;
}
.ontology-llm-builder__recommendations {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  margin-top: auto;
  padding-top: 12px;
}
.ontology-llm-builder__recommendation-block h3 {
  margin: 0 0 10px;
  font-size: 14px;
}
.ontology-llm-builder__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ontology-llm-builder__chips button {
  padding: 6px 10px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 14px;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-accent-cyan-soft);
  cursor: pointer;
}
.ontology-llm-builder__chips button:hover {
  background: var(--aircas-color-accent-cyan-fill);
}
.ontology-llm-builder__recommendation-block ul {
  display: grid;
  gap: 7px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.ontology-llm-builder__recommendation-block li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--aircas-color-border-soft);
  border-radius: 6px;
  color: var(--aircas-color-text-secondary);
  font-size: 12px;
}
.ontology-llm-builder__recommendation-block em {
  color: var(--aircas-color-success);
  font-style: normal;
  white-space: nowrap;
}
.ontology-llm-builder__placeholder {
  display: grid;
  min-height: 360px;
  place-content: center;
  justify-items: center;
  text-align: center;
}
.ontology-llm-builder__placeholder-number {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border: 1px solid var(--aircas-color-accent-cyan);
  border-radius: 50%;
  color: var(--aircas-color-accent-cyan);
  font-size: 20px;
}
.ontology-llm-builder__placeholder h2 {
  margin: 16px 0 8px;
}
.ontology-llm-builder__placeholder p {
  max-width: 420px;
  margin: 0 0 18px;
  color: var(--aircas-color-text-secondary);
}
.ontology-llm-builder__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--aircas-color-divider);
}
.ontology-llm-builder__assistant {
  position: fixed;
  right: 26px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--aircas-color-accent-cyan-border);
  border-radius: 20px;
  color: var(--aircas-color-accent-cyan);
  background: var(--aircas-color-panel-background);
  box-shadow: 0 8px 20px var(--aircas-color-divider);
  cursor: pointer;
}
@media (max-width: 900px) {
  .ontology-llm-builder__layout {
    grid-template-columns: 1fr;
  }
  .ontology-llm-builder__steps {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ontology-llm-builder__recommendations,
  .ontology-llm-builder__form-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .ontology-llm-builder {
    padding: 12px;
  }
  .ontology-llm-builder__heading,
  .ontology-llm-builder__content-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .ontology-llm-builder__steps {
    display: flex;
  }
}
</style>
