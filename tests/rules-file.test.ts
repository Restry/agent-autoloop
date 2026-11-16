// Existing owner keys must not gain rules-file access without explicit local configuration. Once enabled,
// all three operations still require the owner key and a local, non-forwarded connection; invalid text is not saved.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { setup } from "./helpers.ts";

const home = setup("rules-file");
const file = join(home, "rules.json");
writeFileSync(file, readFileSync(join(import.meta.dirname, "rules.fixture.json")));
process.env.AGENT_AUTOLOOP_RULES = file;
const configure = (ui?: object) =>
  writeFileSync(
    join(home, "config.json"),
    JSON.stringify({ url: "http://127.0.0.1", hub: { listen: "127.0.0.1:0", ...(ui && { ui }) } }),
  );
configure();
const { serve } = await import("../host/http.ts");
const { addKey } = await import("./hub.ts");
const owner = addKey("owner", "test-owner");
const server = serve(0, "127.0.0.1");
let base = "";
before(async () => {
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => {
  server.closeAllConnections();
  server.close();
});
const request = (method: string, text?: string, key = owner, headers: Record<string, string> = {}) =>
  fetch(base + (method === "POST" ? "/v1/rules-file/check" : "/v1/rules-file"), {
    method,
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json", ...headers },
    ...(text === undefined ? {} : { body: JSON.stringify({ text }) }),
  });

test("legacy configuration keeps read, check and save closed even to a local owner", async () => {
  const original = readFileSync(file, "utf8");
  for (const ui of [undefined, { origins: ["http://localhost"] }, { rulesFile: false }, { rulesFile: "true" }]) {
    configure(ui);
    for (const method of ["GET", "POST", "PUT"])
      assert.equal((await request(method, method === "GET" ? undefined : original)).status, 404);
  }
  assert.equal(readFileSync(file, "utf8"), original);
});

test("explicit opt-in permits validated owner saves but rejects bad keys and forwarded requests", async () => {
  configure({ rulesFile: true });
  const original = readFileSync(file, "utf8");
  assert.equal((await request("GET", undefined, "wrong")).status, 401);
  assert.equal(
    (await request("PUT", original, owner, { "x-forwarded-for": "203.0.113.1", "x-autoloop-peer": "127.0.0.1" }))
      .status,
    403,
  );
  assert.equal((await request("PUT", "{invalid")).status, 400);
  assert.equal(readFileSync(file, "utf8"), original);
  const next = JSON.parse(original);
  next.askFirst = ["rules-file-test"];
  const text = JSON.stringify(next);
  assert.equal((await request("POST", text)).status, 200);
  assert.equal(readFileSync(file, "utf8"), original);
  assert.equal((await request("PUT", text)).status, 200);
  assert.equal((await (await request("GET")).json()).text, text + "\n");
  assert.equal(readFileSync(file + ".bak", "utf8"), original);
});
