import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ModuleKind, transpileModule } from "typescript";

test("entity links adapter posts raw instance key to single-instance endpoint", async () => {
  const source = readFileSync(new URL("../src/apis/ontologyEntityApi.ts", import.meta.url), "utf8");
  const { outputText } = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } });
  const calls = [];
  const exports = {};
  new Function("require", "exports", "DOMAIN_CONFIG", outputText)(
    (id) => {
      assert.equal(id, "@/utils/request");
      return {
        request: async (config) => {
          calls.push(config);
          return { code: 200, data: [] };
        },
      };
    },
    exports,
    { ONTOLOGYMANAGE_URL: "http://example.test" },
  );
  for (const key of [0, false, "001", { id: 0 }]) {
    const params = { ontologyUniqueIdentifier: "object-a", entityPrimaryKey: key };
    assert.deepEqual(await exports.postOntologyEntityLinksInterface(params), { code: 200, data: [] });
    assert.deepEqual(calls.at(-1), { url: "http://example.test/ontology/entity/link", method: "post", data: params });
  }
});
