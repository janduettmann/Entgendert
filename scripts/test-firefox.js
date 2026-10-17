import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { firefox } from "@playwright/test";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

// WebDriver installs the actual temporary add-on, without a mocked browser API.
// geckodriver manages and removes its own disposable Firefox profile.
const root = new URL("../", import.meta.url);
const fixture = await readFile(new URL("tests/fixtures/page.html", root));
const server = createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(fixture);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const pageUrl = `http://127.0.0.1:${server.address().port}/`;
const port = Number(process.env.GECKODRIVER_PORT || 4445);
const base = `http://127.0.0.1:${port}`;
const uuid = "40de2418-c3ce-42b7-9eac-792cad59c730";
const popup = `moz-extension://${uuid}/popup.html`;
let driver;
let sessionId;
let driverError;
let log = "";
const checks = [];

async function command(method, route, body) {
  const response = await fetch(base + route, {
    method, headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000)
  });
  const { value } = await response.json();
  if (!response.ok || value?.error) throw new Error(JSON.stringify(value));
  return value;
}
const session = (method, route, body) => command(method, `/session/${sessionId}${route}`, body);
const navigate = (url) => session("POST", "/url", { url });
const execute = (script, args = []) => session("POST", "/execute/sync", { script, args });
async function eventually(check, description) {
  const until = Date.now() + 10000;
  let lastError;
  while (Date.now() < until) {
    try { if (await check()) return; } catch (error) { lastError = error; }
    await delay(100);
  }
  throw new Error(`Timeout: ${description}. ${lastError?.message || ""}`);
}
async function expectText(id, expected) {
  await eventually(async () => (await execute("return document.getElementById(arguments[0])?.textContent", [id])) === expected, `${id}: ${expected}`);
}
async function check(name, run) {
  await run();
  checks.push(name);
  console.log(`PASS ${name}`);
}

try {
  driver = spawn(process.env.GECKODRIVER_PATH || "geckodriver", ["--host", "127.0.0.1", "--port", String(port), "--allow-system-access"], { stdio: ["ignore", "pipe", "pipe"] });
  driver.on("error", (error) => { driverError = error; });
  driver.stdout.on("data", (chunk) => { log = (log + chunk).slice(-16000); });
  driver.stderr.on("data", (chunk) => { log = (log + chunk).slice(-16000); });
  await eventually(async () => {
    if (driverError) throw driverError;
    return log.includes(`Listening on 127.0.0.1:${port}`);
  }, "geckodriver start");
  const created = await command("POST", "/session", { capabilities: { alwaysMatch: {
    browserName: "firefox",
    "moz:firefoxOptions": {
      binary: process.env.FIREFOX_PATH || firefox.executablePath(), args: ["-headless", "--remote-allow-system-access"],
      prefs: { "extensions.webextensions.uuids": JSON.stringify({ "entgendert@jandu.github": uuid }) }
    }
  } } });
  sessionId = created.sessionId;
  const id = await session("POST", "/moz/addon/install", {
    path: fileURLToPath(new URL("dist/firefox/", root)), temporary: true
  });
  assert.equal(id, "entgendert@jandu.github");
  console.log(`Installed Entgendert in Firefox ${created.capabilities.browserVersion}`);
  await navigate(pageUrl);
  await check("Initial text, word pairs and dative", async () => {
    await expectText("regular", "Lehrer treffen Studenten und Studenten.");
    await expectText("pair", "Ärzte helfen.");
    await expectText("dative", "Mit den Bürgern sprechen.");
  });
  await check("Editors, code, inputs and foreign language preserved", async () => {
    for (const id of ["editor", "textbox", "code", "ignored", "translation", "english"]) await expectText(id, "Lehrer:innen");
    assert.equal(await execute("return document.getElementById('textarea').value"), "Lehrer:innen");
  });
  await check("Dynamic text and separator variants", async () => {
    await execute("document.getElementById('dynamic').textContent = 'Paketzusteller/innen, Student_innen, Ärzt:innen, Kolleg,innen';");
    await expectText("dynamic", "Paketzusteller, Studenten, Ärzte, Kollegen");
  });
  // Keep the article tab open while using a real extension page in a second tab.
  const articleHandle = await session("GET", "/window");
  const extensionTab = await session("POST", "/window/new", { type: "tab" });
  const switchTo = (handle) => session("POST", "/window", { handle });
  await switchTo(extensionTab.handle);
  await navigate(popup);
  await eventually(() => execute("return document.getElementById('enabled') && !document.getElementById('enabled').disabled"), "Popup ready");
  await check("Popup disables and restores original text", async () => {
    await execute("document.getElementById('enabled').click()");
    await switchTo(articleHandle);
    await expectText("regular", "Lehrer:innen treffen Student*innen und Studierende.");
  });
  await check("Re-enable from popup", async () => {
    await switchTo(extensionTab.handle);
    await execute("document.getElementById('enabled').click()");
    await switchTo(articleHandle);
    await expectText("regular", "Lehrer treffen Studenten und Studenten.");
  });
  await check("Website exception persists through reload", async () => {
    await switchTo(extensionTab.handle);
    await execute("return browser.storage.local.set({ settings: { enabled: true, pairs: true, participles: true, disabledHosts: ['127.0.0.1'] } })");
    await switchTo(articleHandle);
    await expectText("regular", "Lehrer:innen treffen Student*innen und Studierende.");
    await navigate(pageUrl);
    await expectText("regular", "Lehrer:innen treffen Student*innen und Studierende.");
  });
  await mkdir(new URL("artifacts/", root), { recursive: true });
  await writeFile(new URL("artifacts/firefox-test-report.json", root), JSON.stringify({ browserVersion: created.capabilities.browserVersion, checks }, null, 2) + "\n");
  console.log(`${checks.length} Firefox checks passed.`);
} catch (error) {
  console.error(log);
  throw error;
} finally {
  if (sessionId) await command("DELETE", `/session/${sessionId}`).catch(() => {});
  driver?.kill();
  await new Promise((resolve) => server.close(resolve));
}
