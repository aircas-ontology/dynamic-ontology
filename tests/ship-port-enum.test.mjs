import assert from "node:assert/strict";
import test from "node:test";
import { civilTransportShipAssetStandardProperties } from "../src/mocks/assetModelBuilderMock/civilTransportShipAssetStandardMock.ts";
import {
  buildAssetModelConfiguration,
  buildAssetOntologyRequest,
  buildAssetPropertyDrafts,
} from "../src/views/ObjectWorkspacePanel/utils/buildAssetModelConfiguration.ts";

test("ship registration port no longer supplies the removed enum values", () => {
  const property = civilTransportShipAssetStandardProperties.find((item) => item.id === "D0005A0000");
  assert.ok(property);
  assert.equal(property.enumValues, undefined);
  const drafts = buildAssetPropertyDrafts([{ key: property.id, property }], []);
  drafts[0].apiName = "registration_port";
  drafts[0].isPrimary = true;
  const config = buildAssetModelConfiguration(
    { id: "ship", properties: [property] },
    { apiName: "ship", displayName: "船舶", description: "", iconUrl: "", categoryId: "1" },
    drafts,
  );
  const request = buildAssetOntologyRequest(config, "1");
  assert.deepEqual(request.properties[0].metadata, { 元数据: Object.fromEntries(property.metaList.map(({ label, value }) => [label, value])) });
});
