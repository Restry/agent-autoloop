// A browser page for the owner: answers it may read from another origin, and the rules file read and saved over HTTP.
// Both are off until config.json says so. Saving rules is this machine's alone unless hub.ui.remoteRules is set.
import { copyFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { readConfig } from "./config.ts";
import { RULES_FILE } from "./home.ts";
import { RulesError } from "../protocol/rules.ts";

export const PEER_HEADER = "x-autoloop-peer";
const MAX_RULES = 1024 * 1024;
const LOOPBACK = /^(127\.\d+\.\d+\.\d+|::1|::ffff:127\.\d+\.\d+\.\d+)$/;

type Hub = {
  whose(kind: string, key: string): string | null;
  parseRules(json: string): unknown;
  reload(): void;
};
type Handle = (request: Request) => Promise<Response>;

function settings() {
  try {
    const ui = (readConfig().hub as { ui?: { origins?: unknown; remoteRules?: unknown } } | undefined)?.ui;
    const origins = Array.isArray(ui?.origins) ? ui.origins.filter((origin) => typeof origin === "string") : [];
    return { origins: origins as string[], remoteRules: ui?.remoteRules === true };
  } catch {
    return { origins: [] as string[], remoteRules: false };
  }
}

function corsHeaders(request: Request, origins: string[]): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !origins.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, last-event-id",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "cache-control": "no-store" } });

/** Whether this request came from this machine itself, and not through a proxy standing in front of the hub. */
function local(request: Request) {
  const forwarded = ["x-forwarded-for", "forwarded", "x-real-ip"].some((header) => request.headers.has(header));
  return !forwarded && LOOPBACK.test(request.headers.get(PEER_HEADER) ?? "");
}

function problemOf(hub: Hub, text: string): string | null {
  try {
    hub.parseRules(text);
    return null;
  } catch (error) {
    if (error instanceof RulesError || error instanceof SyntaxError) return (error as Error).message;
    throw error;
  }
}

async function rulesFile(hub: Hub, request: Request, path: string, remoteRules: boolean) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!hub.whose("owner", token)) return json({ error: "要本人自己的密钥" }, 401);
  if (!remoteRules && !local(request)) {
    return json({ error: "规则只能在装中台的这台电脑上读写；要远程读写，在 config.json 写 hub.ui.remoteRules: true" }, 403);
  }
  if (request.method === "GET" && path === "/v1/rules-file") {
    if (!existsSync(RULES_FILE)) return json({ error: "找不到规则文件" }, 404);
    const text = readFileSync(RULES_FILE, "utf8");
    return json({ text, problem: problemOf(hub, text) });
  }
  const check = request.method === "POST" && path === "/v1/rules-file/check";
  if (!check && !(request.method === "PUT" && path === "/v1/rules-file")) return json({ error: "没有这个地址" }, 404);
  const body = await request.text();
  if (body.length > MAX_RULES) return json({ error: "规则文件最多 1024 KB" }, 413);
  let text: unknown;
  try {
    text = JSON.parse(body)?.text;
  } catch {
    return json({ error: "不是 JSON" }, 400);
  }
  if (typeof text !== "string" || !text.trim()) return json({ error: "要有 text：规则文件的全文" }, 400);
  const problem = problemOf(hub, text);
  if (problem) return json({ error: problem }, 400);
  if (check) return json({ ok: true });
  if (existsSync(RULES_FILE)) copyFileSync(RULES_FILE, `${RULES_FILE}.bak`);
  writeFileSync(`${RULES_FILE}.tmp`, text.endsWith("\n") ? text : `${text}\n`, { mode: 0o600 });
  renameSync(`${RULES_FILE}.tmp`, RULES_FILE);
  hub.reload();
  return json({ ok: true, backup: `${RULES_FILE}.bak` });
}

export function withUi(handle: Handle, hub: Hub): Handle {
  return async (request) => {
    const { origins, remoteRules } = settings();
    const cors = corsHeaders(request, origins);
    if (request.method === "OPTIONS" && request.headers.has("access-control-request-method")) {
      return new Response(null, { status: Object.keys(cors).length ? 204 : 403, headers: cors });
    }
    const path = new URL(request.url).pathname;
    const answer = path.startsWith("/v1/rules-file")
      ? await rulesFile(hub, request, path, remoteRules)
      : await handle(request);
    if (!Object.keys(cors).length) return answer;
    const headers = new Headers(answer.headers);
    for (const [name, value] of Object.entries(cors)) headers.set(name, value);
    return new Response(answer.body, { status: answer.status, headers });
  };
}
