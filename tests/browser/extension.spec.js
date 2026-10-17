import { test, expect, chromium } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

let context;
let profile;
let page;
let extensionId;
const extensionPath = path.resolve("dist/chrome");

test.beforeAll(async () => {
  profile = await mkdtemp(path.join(tmpdir(), "entgendert-browser-"));
  context = await chromium.launchPersistentContext(profile, {
    executablePath: process.env.CHROMIUM_PATH || undefined,
    channel: process.env.CHROMIUM_PATH ? undefined : "chromium",
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });
  page = await context.newPage();
  const session = await context.newCDPSession(page);
  session.on("Runtime.executionContextCreated", ({ context: execution }) => {
    if (execution.origin.startsWith("chrome-extension://")) extensionId = execution.origin.replace("chrome-extension://", "");
  });
  await session.send("Runtime.enable");
  await page.goto("http://127.0.0.1:4173");
  await expect(page.locator("#regular")).toHaveText("Lehrer treffen Studenten und Studenten.");
});
test.afterAll(async () => {
  await context?.close();
  if (profile) await rm(profile, { recursive: true, force: true });
});
test.beforeEach(async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.evaluate(async () => { await chrome.storage.local.clear(); });
  await popup.close();
  await page.goto("http://127.0.0.1:4173");
  await expect(page.locator("#regular")).toHaveText("Lehrer treffen Studenten und Studenten.");
});

test("Echte Erweiterung: Wörterbuch, Paarformen, DOM-Struktur und geschützte Bereiche", async () => {
  await expect(page.locator("#pair")).toHaveText("Ärzte helfen.");
  await expect(page.locator("#dative")).toHaveText("Mit den Bürgern sprechen.");
  await expect(page.locator("#articles")).toHaveText("Ihr Ansprechpartner ist der Vorsitzende; die Mitarbeiter helfen.");
  await expect(page.locator("#lexicon")).toHaveText("Vorsitzender Meier begrüßt Zahnärzte und Stammkunden auf Seite(n) 3.");
  await expect(page.locator("#unmarked")).toHaveText("Lehrerinnen und Schüler sprechen über Berlin.");
  await expect(page.locator("#structure strong")).toHaveText("Lehrer");
  await expect(page.locator("#structure a")).toHaveAttribute("href", "/Lehrer:innen");
  await expect(page.locator("#structure a")).toHaveAttribute("title", "Lehrer:innen");
  for (const id of ["editor", "textbox", "code", "ignored", "translation", "english"]) {
    await expect(page.locator(`#${id}`)).toHaveText("Lehrer:innen");
  }
  await expect(page.locator("#textarea")).toHaveValue("Lehrer:innen");
  await expect(page.locator("#input")).toHaveValue("Lehrer:innen");
});
test("Nachgeladene und vom Framework geänderte Textknoten", async () => {
  await page.evaluate(() => {
    const p = document.createElement("p");
    p.textContent = "Kolleg:innen";
    document.getElementById("dynamic").append(p);
  });
  await expect(page.locator("#dynamic p")).toHaveText("Kollegen");
  await page.locator("#dynamic p").evaluate((node) => { node.firstChild.data = "Ärzt:innen"; });
  await expect(page.locator("#dynamic p")).toHaveText("Ärzte");
});
test("Originale wiederherstellen; Seitenänderungen erhalten; erneut einschalten", async () => {
  await page.locator("#pair").evaluate((node) => { node.firstChild.data = "Neue Website-Inhalte"; });
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.locator("#enabled").uncheck();
  await expect(page.locator("#regular")).toHaveText("Lehrer:innen treffen Student*innen und Studierende.");
  await expect(page.locator("#pair")).toHaveText("Neue Website-Inhalte");
  await popup.locator("#enabled").check();
  await expect(page.locator("#regular")).toHaveText("Lehrer treffen Studenten und Studenten.");
  await popup.close();
});
test("Popup: gesperrte Einstellungen im ausgeschalteten Zustand", async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(popup.locator("#details")).toBeEnabled();
  await popup.locator("#enabled").uncheck();
  await expect(popup.locator("body")).toHaveAttribute("data-state", "off");
  await expect(popup.locator("#count")).toHaveText("–");
  await expect(popup.locator("#count-label")).toHaveText("Leseansicht ist ausgeschaltet");
  for (const id of ["site", "pairs", "participles"]) await expect(popup.locator(`#${id}`)).toBeDisabled();
  // Clicking a locked option must not change the setting.
  await popup.locator("#pairs").click({ force: true });
  await expect(popup.locator("#pairs")).toBeChecked();
  await popup.locator("#enabled").check();
  for (const id of ["pairs", "participles"]) await expect(popup.locator(`#${id}`)).toBeEnabled();
  await popup.close();
});
test("Zähler: ersetzte Wörter der Seite, live aktualisiert", async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  // Opened as a tab, the popup has no activeTab grant; listen to every tab instead.
  await popup.evaluate(async () => {
    globalThis.counts = [];
    for (const tab of await chrome.tabs.query({})) {
      const port = chrome.tabs.connect(tab.id, { name: "entgendert:status" });
      port.onMessage.addListener((message) => globalThis.counts.push(message.replaced));
      port.onDisconnect.addListener(() => void chrome.runtime.lastError);
    }
  });
  const latest = () => popup.evaluate(() => globalThis.counts.at(-1));
  // 3 regular + 2 pair + 1 dative + 4 articles + 3 lexicon + 2 structure + 2 neutral
  await expect.poll(latest).toBe(17);
  await popup.locator("#pairs").uncheck();
  await expect.poll(latest).toBe(15);
  await page.locator("#dynamic").evaluate((node) => { node.textContent = "Neue Kolleg*innen und Expert:innen"; });
  await expect.poll(latest).toBe(17);
  await popup.locator("#enabled").uncheck();
  await expect.poll(latest).toBe(0);
  await popup.close();
});
test("Optionen und persistente Website-Ausnahme", async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.locator("#participles").uncheck();
  await expect(page.locator("#neutral")).toHaveText("Studierende treffen Teilnehmende.");
  await popup.locator("#pairs").uncheck();
  await expect(page.locator("#pair")).toHaveText("Ärztinnen und Ärzte helfen.");
  await popup.evaluate(async () => {
    const { settings } = await chrome.storage.local.get("settings");
    await chrome.storage.local.set({ settings: { ...settings, disabledHosts: ["127.0.0.1"] } });
  });
  await expect(page.locator("#regular")).toHaveText("Lehrer:innen treffen Student*innen und Studierende.");
  await page.reload();
  await expect(page.locator("#regular")).toHaveText("Lehrer:innen treffen Student*innen und Studierende.");
  await popup.close();
});
test("Nachträglich aktivierte Editoren erhalten ihre Originaltexte", async () => {
  await page.locator("#regular").evaluate((node) => { node.contentEditable = "true"; });
  await expect(page.locator("#regular")).toHaveText("Lehrer:innen treffen Student*innen und Studierende.");
  await page.locator("#regular").evaluate((node) => { node.contentEditable = "false"; });
  await expect(page.locator("#regular")).toHaveText("Lehrer treffen Studenten und Studenten.");
});
test("Große Mutation-Bursts und entfernte Teilbäume", async () => {
  await page.evaluate(() => {
    const root = document.getElementById("dynamic");
    for (let i = 0; i < 2500; i++) {
      const p = document.createElement("p");
      p.textContent = "Student:innen";
      root.append(p);
    }
    const removed = document.createElement("div");
    removed.textContent = "Ärzt:innen";
    root.append(removed);
    removed.remove();
  });
  await expect(page.locator("#dynamic p").last()).toHaveText("Studenten");
  expect(await page.locator("#dynamic p").evaluateAll((nodes) => nodes.every((node) => node.textContent === "Studenten"))).toBe(true);
});
test("Verschobene Texte in Editoren und übergroße Textknoten", async () => {
  await page.evaluate(() => {
    document.getElementById("editor").append(document.getElementById("regular"));
    document.getElementById("dynamic").textContent = "Lehrer:innen ".repeat(5000);
  });
  await expect(page.locator("#regular")).toHaveText("Lehrer:innen treffen Student*innen und Studierende.");
  await expect(page.locator("#dynamic")).toHaveText("Lehrer:innen ".repeat(5000).trim());
});
