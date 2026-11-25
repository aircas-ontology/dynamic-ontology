import test from "node:test";
import assert from "node:assert/strict";
import { intelligenceEventThemes } from "../src/mocks/intelligenceEventThemesMock/intelligenceEventThemesMock.ts";
import { summarizeEventThemes } from "../src/views/IntelligenceEventThemes/utils/eventThemeSummary.ts";
import { validateEventThemeDraft } from "../src/views/IntelligenceEventThemes/utils/eventThemeDraft.ts";

test("event theme mock keeps prototype category distribution", () => {
  assert.equal(intelligenceEventThemes.length, 13);
  assert.deepEqual(summarizeEventThemes(intelligenceEventThemes), [
    { category: "装备部署", count: 4, percent: 31 },
    { category: "冲突战争", count: 5, percent: 38 },
    { category: "演习训练", count: 4, percent: 31 },
  ]);
});

test("event theme summary returns zero percentages for empty list", () => {
  assert.deepEqual(summarizeEventThemes([]), [
    { category: "装备部署", count: 0, percent: 0 },
    { category: "冲突战争", count: 0, percent: 0 },
    { category: "演习训练", count: 0, percent: 0 },
  ]);
});

test("event theme mock exposes update time for card view", () => {
  assert.ok(intelligenceEventThemes.every((theme) => theme.updatedAt.length > 0));
});

test("event theme mock exposes two pages for the prototype footer", () => {
  const pageSize = 10;
  assert.equal(intelligenceEventThemes.slice(0, pageSize).length, 10);
  assert.equal(intelligenceEventThemes.slice(pageSize, pageSize * 2).length, 3);
});

const validDraft = {
  name: "联合演训事件",
  category: "冲突战争",
  region: "西太平洋",
  startTime: "2026-11-25 12:00:00",
  endTime: "2026-11-26 12:00:00",
  points: [
    [140.5, 29.7],
    [141.9, 28.9],
    [144.6, 29.8],
  ],
  description: "跟踪联合演训相关海空活动。",
  spaceId: 1,
};

test("event theme draft validates a complete form", () => {
  assert.equal(validateEventThemeDraft(validDraft), "");
});

test("event theme draft reports the first missing or invalid field", () => {
  assert.equal(validateEventThemeDraft({ ...validDraft, name: " " }), "请输入事件主题名称");
  assert.equal(validateEventThemeDraft({ ...validDraft, category: "" }), "请选择事件主题类别");
  assert.equal(validateEventThemeDraft({ ...validDraft, startTime: "" }), "请选择有效的时间窗口");
  assert.equal(validateEventThemeDraft({ ...validDraft, endTime: "2026-11-25 11:00:00" }), "请选择有效的时间窗口");
  assert.equal(validateEventThemeDraft({ ...validDraft, region: "" }), "请选择地理区域");
  assert.equal(validateEventThemeDraft({ ...validDraft, points: [[140.5, 29.7]] }), "请至少选择 3 个区域点位");
  assert.equal(validateEventThemeDraft({ ...validDraft, description: "" }), "请输入事件主题描述");
  assert.equal(validateEventThemeDraft({ ...validDraft, spaceId: null }), "请选择关联本体空间");
});
