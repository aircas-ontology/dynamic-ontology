import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { assetModelDetailMock, assetModelTreeMock } from "../src/mocks/assetModelBuilderMock/assetModelBuilderMock.ts";
import { aviationMaterialAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/aviationMaterialAssetStandardMock.ts";
import { civilTransportShipAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/civilTransportShipAssetStandardMock.ts";
import { facilityAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/facilityAssetStandardMock.ts";
import { medicalEquipmentAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/medicalEquipmentAssetStandardMock.ts";
import { oilAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/oilAssetStandardMock.ts";
import { personnelAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/personnelAssetStandardMock.ts";

/**
 * @description 收集资产模型树中全部可点选叶子的 modelId。
 * @param {import("../src/types/pages/assetModelBuilderType.ts").AssetModelTreeNode[]} nodes 树节点。
 * @returns {string[]} modelId 列表。
 */
function collectModelIds(nodes) {
  /** @type {string[]} */
  const ids = [];
  for (const node of nodes) {
    if (typeof node.modelId === "string" && node.modelId) ids.push(node.modelId);
    if (Array.isArray(node.children) && node.children.length) ids.push(...collectModelIds(node.children));
  }
  return ids;
}

test("asset model tree uses civil-military root with six selectable leaves", () => {
  assert.equal(assetModelTreeMock.length, 1);
  assert.equal(assetModelTreeMock[0].label, "军民通用资源");
  assert.equal(assetModelTreeMock[0].modelId, undefined);

  const children = assetModelTreeMock[0].children ?? [];
  assert.deepEqual(
    children.map((node) => node.label),
    ["物资类", "设备类", "器材类", "人员类", "设施类"],
  );

  const material = children.find((node) => node.label === "物资类");
  const equipment = children.find((node) => node.label === "设备类");
  const device = children.find((node) => node.label === "器材类");
  const personnel = children.find((node) => node.label === "人员类");
  const facility = children.find((node) => node.label === "设施类");

  assert.deepEqual(
    (material?.children ?? []).map((node) => node.label),
    ["油品"],
  );
  assert.deepEqual(
    (equipment?.children ?? []).map((node) => node.label),
    ["民用运输船舶"],
  );
  assert.deepEqual(
    (device?.children ?? []).map((node) => node.label),
    ["航材", "卫生器材"],
  );
  assert.equal(personnel?.modelId, "personnel");
  assert.equal(facility?.modelId, "facility");
  assert.equal(personnel?.children, undefined);
  assert.equal(facility?.children, undefined);

  const modelIds = collectModelIds(assetModelTreeMock);
  assert.deepEqual(modelIds.sort(), ["device-aviation-material", "device-medical", "equipment-civil-transport-ship", "facility", "material-oil", "personnel"]);
  assert.equal(modelIds.length, 6);

  const detailIds = new Set(assetModelDetailMock.map((item) => item.id));
  modelIds.forEach((modelId) => {
    assert.ok(detailIds.has(modelId), `missing detail for ${modelId}`);
  });
  assert.equal(assetModelDetailMock.length, 6);
});

test("asset entry switches panel before opening dialog", () => {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/OntologyObjectCreateDialog.vue", import.meta.url), "utf8");
  assert.match(source, /@click="openAssetBuild"/);
  const switchMode = source.slice(source.indexOf("function selectCreateMode"), source.indexOf("function openDatasourceBuild"));
  assert.doesNotMatch(switchMode, /assetVisible.value = true/);
  assert.match(source, /function openAssetBuild/);
  assert.match(source, /:category-tree="categoryTreeOptions"/);
  assert.match(source, /:initial-category-id="draft.categoryId"/);
});

test("oil asset standard mock matches data-element table headers and identifiers", () => {
  assert.equal(oilAssetStandardProperties.length, 79);
  assert.equal(oilAssetStandardProperties[0].id, "Z0001G0000");
  assert.equal(oilAssetStandardProperties[0].name, "军民通用资源品种标识代码");
  assert.equal(oilAssetStandardProperties[0].shortName, "品种标识代码");
  assert.equal(oilAssetStandardProperties[0].representation, "普通文本");
  assert.equal(oilAssetStandardProperties.at(-1)?.id, "W0075A0000");
  assert.equal(oilAssetStandardProperties.at(-1)?.name, "船用燃料油硫含量");

  const oilDetail = assetModelDetailMock.find((item) => item.id === "material-oil");
  assert.ok(oilDetail);
  assert.equal(oilDetail.propertyCount, 79);
  assert.equal(oilDetail.properties.length, 79);
  assert.ok(oilDetail.properties.every((item) => item.representation && item.dataType && typeof item.shortName === "string"));
});

test("civil transport ship asset standard mock matches data-element table", () => {
  assert.equal(civilTransportShipAssetStandardProperties.length, 108);
  assert.equal(civilTransportShipAssetStandardProperties[0].id, "Z0001G0000");
  assert.equal(civilTransportShipAssetStandardProperties[1].id, "D0001A0000");
  assert.equal(civilTransportShipAssetStandardProperties[1].name, "中文船名");
  assert.equal(civilTransportShipAssetStandardProperties.at(-1)?.id, "D0103A0000");
  assert.equal(civilTransportShipAssetStandardProperties.at(-1)?.name, "顶推功率");

  const shipDetail = assetModelDetailMock.find((item) => item.id === "equipment-civil-transport-ship");
  assert.ok(shipDetail);
  assert.equal(shipDetail.propertyCount, 108);
  assert.equal(shipDetail.properties.length, 108);
  assert.ok(shipDetail.properties.every((item) => item.representation && item.dataType && typeof item.shortName === "string"));
});

test("aviation material asset standard mock matches data-element table", () => {
  assert.equal(aviationMaterialAssetStandardProperties.length, 212);
  assert.equal(aviationMaterialAssetStandardProperties[0].id, "Z0001G0000");
  assert.equal(aviationMaterialAssetStandardProperties[7].id, "H0001A0000");
  assert.equal(aviationMaterialAssetStandardProperties[7].name, "型号");
  assert.equal(aviationMaterialAssetStandardProperties.at(-1)?.id, "H0205A0000");
  assert.equal(aviationMaterialAssetStandardProperties.at(-1)?.name, "最大转速");

  const aviationDetail = assetModelDetailMock.find((item) => item.id === "device-aviation-material");
  assert.ok(aviationDetail);
  assert.equal(aviationDetail.propertyCount, 212);
  assert.equal(aviationDetail.properties.length, 212);
  assert.ok(aviationDetail.properties.every((item) => item.representation && item.dataType && typeof item.shortName === "string"));
});

test("medical equipment asset standard mock matches data-element table", () => {
  assert.equal(medicalEquipmentAssetStandardProperties.length, 285);
  assert.equal(medicalEquipmentAssetStandardProperties[0].id, "Z0001G0000");
  assert.equal(medicalEquipmentAssetStandardProperties[0].name, "军民通用资源品种标识代码");
  assert.equal(medicalEquipmentAssetStandardProperties[2].id, "H1000A0000");
  assert.equal(medicalEquipmentAssetStandardProperties[2].name, "规格");
  assert.equal(medicalEquipmentAssetStandardProperties.at(-1)?.id, "H1282A0000");
  assert.equal(medicalEquipmentAssetStandardProperties.at(-1)?.name, "是否具备条码识别功能");
  assert.equal(medicalEquipmentAssetStandardProperties.at(-1)?.representation, "布尔值");
  assert.ok(medicalEquipmentAssetStandardProperties.some((item) => item.id === "H1139A0000"));

  const medicalDetail = assetModelDetailMock.find((item) => item.id === "device-medical");
  assert.ok(medicalDetail);
  assert.equal(medicalDetail.propertyCount, 285);
  assert.equal(medicalDetail.properties.length, 285);
  assert.ok(medicalDetail.properties.every((item) => item.representation && item.dataType && typeof item.shortName === "string"));
});

test("personnel asset standard mock matches data-element table", () => {
  assert.equal(personnelAssetStandardProperties.length, 57);
  assert.equal(personnelAssetStandardProperties[0].id, "R0001A0000");
  assert.equal(personnelAssetStandardProperties[0].name, "姓名");
  assert.equal(personnelAssetStandardProperties[1].id, "Z0005G0000");
  assert.equal(personnelAssetStandardProperties[3].id, "R0002A0000");
  assert.equal(personnelAssetStandardProperties[3].shortName, "性别");
  assert.equal(personnelAssetStandardProperties.at(-1)?.id, "R0082A0000");
  assert.equal(personnelAssetStandardProperties.at(-1)?.name, "其他领域人员专业技术经历");
  assert.ok(!personnelAssetStandardProperties.some((item) => item.id === "R0043A0000"));

  const personnelDetail = assetModelDetailMock.find((item) => item.id === "personnel");
  assert.ok(personnelDetail);
  assert.equal(personnelDetail.propertyCount, 57);
  assert.equal(personnelDetail.properties.length, 57);
  assert.ok(personnelDetail.properties.every((item) => item.representation && item.dataType && typeof item.shortName === "string"));
});

test("facility asset standard mock matches data-element table", () => {
  assert.equal(facilityAssetStandardProperties.length, 79);
  assert.equal(facilityAssetStandardProperties[0].id, "E0001A0000");
  assert.equal(facilityAssetStandardProperties[0].name, "设施中文名称");
  assert.equal(facilityAssetStandardProperties[0].shortName, "设施名称");
  assert.equal(facilityAssetStandardProperties[1].id, "Z0005G0000");
  assert.equal(facilityAssetStandardProperties.at(-1)?.id, "E0120A0000");
  assert.equal(facilityAssetStandardProperties.at(-1)?.name, "仓库收发作业能力描述");
  assert.equal(facilityAssetStandardProperties.filter((item) => item.id === "E0117A0000").length, 2);
  assert.ok(!facilityAssetStandardProperties.some((item) => item.id === "E0013A0000"));

  const facilityDetail = assetModelDetailMock.find((item) => item.id === "facility");
  assert.ok(facilityDetail);
  assert.equal(facilityDetail.propertyCount, 79);
  assert.equal(facilityDetail.properties.length, 79);
  assert.ok(facilityDetail.properties.every((item) => item.representation && item.dataType && typeof item.shortName === "string"));
});

test("asset build dialog exposes two steps and confirm create without manual submit", () => {
  const source = readFileSync(new URL("../src/views/ObjectWorkspacePanel/components/AssetModelBuildDialog.vue", import.meta.url), "utf8");
  assert.match(source, /title="资产标准"/);
  assert.match(source, /title="对象信息"/);
  assert.match(source, /goToObjectInfoStep/);
  assert.match(source, /confirmAssetCreate/);
  assert.match(source, />确认创建</);
  assert.match(source, /属性列表/);
  assert.match(source, /objectPropertyList/);
  assert.match(source, /buildAssetPropertyDrafts/);
  assert.match(source, /if \(buildStep\.value !== 1 \|\| selectionRestoring\.value\) return/);
  assert.match(source, /label="数据元标识符"/);
  assert.match(source, /label="数据元名称"/);
  assert.match(source, /label="数据元简称"/);
  assert.match(source, /label="数据元定义"/);
  assert.match(source, /label="数据元值的数据类型"/);
  assert.match(source, /label="数据元值的表示形式"/);
  assert.match(source, /objectDraft\.apiName/);
  assert.doesNotMatch(source, /objectDraft\.iconUrl/);
  assert.doesNotMatch(source, /objectDraft\.parentId/);
  assert.match(source, /objectDraft\.categoryId/);
  assert.doesNotMatch(source, /submit-manual|createOntologyObject/);
});

test("asset configuration validates standard selection and object draft separately", async () => {
  const { assertAssetStandardSelection, buildAssetModelConfiguration, buildAssetPropertyDrafts, pickAssetStandardProperties } =
    await import("../src/views/ObjectWorkspacePanel/utils/buildAssetModelConfiguration.ts");
  const detail = {
    id: "ship",
    properties: [
      { id: "name", name: "名称", dataType: "字符串型", description: "名称", metaList: [{ label: "必填", value: "是" }] },
      { id: "dup", name: "重复甲", metaList: [] },
      { id: "dup", name: "重复乙", metaList: [] },
      { id: "speed", name: "航速", metaList: [] },
    ],
  };
  const draft = {
    displayName: " 舰船 ",
    apiName: "ship",
    description: " 描述 ",
    iconUrl: "",
    categoryId: "cat-1",
    parentId: undefined,
  };

  assert.throws(() => assertAssetStandardSelection([]));
  assertAssetStandardSelection(["name"]);

  const picked = pickAssetStandardProperties(detail.properties, ["name", "dup", "dup"]);
  assert.equal(picked.length, 3);
  assert.equal(picked[0].name, "名称");
  assert.equal(picked[1].name, "重复甲");
  assert.equal(picked[2].name, "重复乙");

  const properties = buildAssetPropertyDrafts([{ key: "0", property: detail.properties[0] }], []);
  properties[0].apiName = "name";
  properties[0].isPrimary = true;
  const result = buildAssetModelConfiguration(detail, draft, properties);
  assert.equal(result.draft.displayName, "舰船");
  assert.equal(result.draft.categoryId, "cat-1");
  assert.equal(result.properties.length, 1);
  result.properties[0].metaList[0].value = "否";
  assert.equal(detail.properties[0].metaList[0].value, "是");

  assert.throws(() => buildAssetModelConfiguration(detail, { ...draft, apiName: "123" }, properties));
  assert.throws(() => buildAssetModelConfiguration(detail, { ...draft, displayName: " " }, properties));
  assert.throws(() => buildAssetModelConfiguration(detail, { ...draft, categoryId: "" }, properties));
  assert.throws(() => buildAssetModelConfiguration(detail, draft, []));
});
