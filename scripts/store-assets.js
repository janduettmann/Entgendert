import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../", import.meta.url));
const images = path.join(root, "store/images");
const icons = path.join(root, "extension/icons");
const launchOptions = { executablePath: process.env.CHROMIUM_PATH || undefined, headless: true };
const routes = new Map([
  ["/assets/logo.svg", ["assets/logo.svg", "image/svg+xml"]],
  ["/promo", ["store/promo.html", "text/html; charset=utf-8"]],
  ["/demo", ["store/demo.html", "text/html; charset=utf-8"]]
]);
const server = createServer(async (request, response) => {
  const route = routes.get(new URL(request.url, "http://localhost").pathname);
  if (!route) { response.writeHead(404).end(); return; }
  try {
    response.writeHead(200, { "Content-Type": route[1] });
    response.end(await readFile(path.join(root, route[0])));
  } catch { response.writeHead(500).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
let context;
let profile;
try {
  await mkdir(images, { recursive: true });
  await mkdir(icons, { recursive: true });
  browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const svg = await readFile(path.join(root, "assets/logo.svg"), "utf8");
  for (const size of [16, 32, 48, 64, 96, 128, 256]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<style>html,body{margin:0;width:100%;height:100%;background:transparent}svg{width:100%;height:100%;display:block}</style>${svg}`);
    await page.screenshot({ path: path.join(icons, `icon-${size}.png`), omitBackground: true });
  }
  for (const [width, height, filename] of [[440, 280, "promo-440x280.png"], [1400, 560, "marquee-1400x560.png"]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${base}/promo`);
    await page.screenshot({ path: path.join(images, filename) });
  }
  await browser.close();
  browser = null;

  // Build now that the generated icons exist; then install the real package.
  await import("./build.js");
  profile = await mkdtemp(path.join(tmpdir(), "entgendert-store-"));
  const extension = path.join(root, "dist/chrome");
  context = await chromium.launchPersistentContext(profile, {
    ...launchOptions, channel: process.env.CHROMIUM_PATH ? undefined : "chromium",
    viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
  });
  const demo = await context.newPage();
  const session = await context.newCDPSession(demo);
  let extensionId;
  session.on("Runtime.executionContextCreated", ({ context: execution }) => {
    if (execution.origin.startsWith("chrome-extension://")) extensionId = execution.origin.slice("chrome-extension://".length);
  });
  await session.send("Runtime.enable");
  await demo.goto(`${base}/demo`);
  await demo.waitForFunction(() => document.querySelector("#lead").textContent.startsWith("Bürger, Lehrer und Studenten"));
  assert.ok(extensionId, "The real extension must have loaded");
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.locator("#enabled").uncheck();
  await demo.waitForFunction(() => document.querySelector("#lead").textContent.includes("Bürger*innen"));
  await demo.screenshot({ path: path.join(images, "01-original-1280x800.png") });
  await popup.locator("#enabled").check();
  await demo.waitForFunction(() => document.querySelector("#lead").textContent.startsWith("Bürger, Lehrer und Studenten"));
  assert.equal(await demo.locator("#note").inputValue(), "Notiz für Kolleg*innen");
  await demo.screenshot({ path: path.join(images, "02-entgendert-1280x800.png") });
  // Capture the actual popup DOM. This crop is an additional support asset,
  // not a full-size store screenshot. No fake API or reconstructed controls.
  await demo.bringToFront();
  await popup.reload();
  await popup.waitForFunction(() => !document.querySelector("#enabled").disabled);
  await popup.locator("body").screenshot({ path: path.join(images, "popup.png") });
  await writeFile(path.join(images, "capture-info.json"), JSON.stringify({
    browser: context.browser().version(),
    extensionVersion: JSON.parse(await readFile(path.join(extension, "manifest.json"), "utf8")).version,
    viewport: { width: 1280, height: 800 },
    source: "store/demo.html",
    description: "Actual extension loaded in an isolated Chromium profile. Original captured via popup disable; reading view via popup enable. Input protection asserted."
  }, null, 2) + "\n");
  console.log("Created extension/icons/*.png and store/images/*.png");
} finally {
  await context?.close();
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  if (profile) await rm(profile, { recursive: true, force: true });
}
