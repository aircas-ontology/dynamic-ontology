import type { AssetModelDetail, AssetModelTreeNode } from "@/types";
import { aviationMaterialAssetStandardProperties } from "./aviationMaterialAssetStandardMock.ts";
import { civilTransportShipAssetStandardProperties } from "./civilTransportShipAssetStandardMock.ts";
import { facilityAssetStandardProperties } from "./facilityAssetStandardMock.ts";
import { medicalEquipmentAssetStandardProperties } from "./medicalEquipmentAssetStandardMock.ts";
import { oilAssetStandardProperties } from "./oilAssetStandardMock.ts";
import { personnelAssetStandardProperties } from "./personnelAssetStandardMock.ts";

/** 资产模型树：军民通用资源 → 分类分组 / 可点选叶子模型。 */
export const assetModelTreeMock: AssetModelTreeNode[] = [
  {
    id: "root-civil-military",
    label: "军民通用资源",
    children: [
      {
        id: "domain-material",
        label: "物资类",
        children: [{ id: "model-oil", label: "油品", modelId: "material-oil" }],
      },
      {
        id: "domain-equipment",
        label: "设备类",
        children: [{ id: "model-civil-transport-ship", label: "民用运输船舶", modelId: "equipment-civil-transport-ship" }],
      },
      {
        id: "domain-device",
        label: "器材类",
        children: [
          { id: "model-aviation-material", label: "航材", modelId: "device-aviation-material" },
          { id: "model-medical-device", label: "卫生器材", modelId: "device-medical" },
        ],
      },
      { id: "model-personnel", label: "人员类", modelId: "personnel" },
      { id: "model-facility", label: "设施类", modelId: "facility" },
    ],
  },
];

export const assetModelDetailMock: AssetModelDetail[] = [
  {
    id: "material-oil",
    name: "油品",
    apiName: "asset_model_material_oil",
    description: "军民通用物资类油品资产模型，资产标准对齐数据元规范表。",
    domain: "物资类",
    version: "V1.0",
    updatedAt: "2026-11-04 10:00:00",
    propertyCount: oilAssetStandardProperties.length,
    properties: oilAssetStandardProperties,
  },
  {
    id: "equipment-civil-transport-ship",
    name: "民用运输船舶",
    apiName: "asset_model_civil_transport_ship",
    description: "军民通用设备类民用运输船舶资产模型，资产标准对齐数据元规范表。",
    domain: "设备类",
    version: "V1.0",
    updatedAt: "2026-11-04 10:00:00",
    propertyCount: civilTransportShipAssetStandardProperties.length,
    properties: civilTransportShipAssetStandardProperties,
  },
  {
    id: "device-aviation-material",
    name: "航材",
    apiName: "asset_model_aviation_material",
    description: "军民通用器材类航材资产模型，资产标准对齐数据元规范表。",
    domain: "器材类",
    version: "V1.0",
    updatedAt: "2026-11-04 10:00:00",
    propertyCount: aviationMaterialAssetStandardProperties.length,
    properties: aviationMaterialAssetStandardProperties,
  },
  {
    id: "device-medical",
    name: "卫生器材",
    apiName: "asset_model_medical_device",
    description: "军民通用器材类卫生器材资产模型，资产标准对齐数据元规范表。",
    domain: "器材类",
    version: "V1.0",
    updatedAt: "2026-11-04 10:00:00",
    propertyCount: medicalEquipmentAssetStandardProperties.length,
    properties: medicalEquipmentAssetStandardProperties,
  },
  {
    id: "personnel",
    name: "人员类",
    apiName: "asset_model_personnel",
    description: "军民通用人员类资产模型，资产标准对齐数据元规范表。",
    domain: "人员类",
    version: "V1.0",
    updatedAt: "2026-11-04 10:00:00",
    propertyCount: personnelAssetStandardProperties.length,
    properties: personnelAssetStandardProperties,
  },
  {
    id: "facility",
    name: "设施类",
    apiName: "asset_model_facility",
    description: "军民通用设施类资产模型，资产标准对齐数据元规范表。",
    domain: "设施类",
    version: "V1.0",
    updatedAt: "2026-11-04 10:00:00",
    propertyCount: facilityAssetStandardProperties.length,
    properties: facilityAssetStandardProperties,
  },
];
