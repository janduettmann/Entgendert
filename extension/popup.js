/* global Entgendert */
(() => {
  "use strict";
  const api = globalThis.browser ?? globalThis.chrome;
  const element = (id) => document.getElementById(id);
  const controls = Object.fromEntries(["enabled", "site", "pairs", "participles"].map((id) => [id, element(id)]));
  const details = element("details");
  const status = element("status");
  const count = element("count");
  // Badge, status line and counter label per state.
  const texts = {
    off: ["Aus", "Ausgeschaltet. Originaltexte werden wiederhergestellt.", "Leseansicht ist ausgeschaltet"],
    unavailable: ["Nicht verfügbar", "Hier nicht verfügbar. Nach der Installation offene Webseiten neu laden.", "Auf dieser Seite nicht verfügbar"],
    paused: ["Hier pausiert", "Auf dieser Website pausiert. Originaltexte werden angezeigt.", "Auf dieser Website pausiert"],
    active: ["Aktiv", "Aktiv. Auch nachgeladene Texte werden verarbeitet."]
  };
  let hostname = null;
  let available = false;
  let replaced = null;
  let settings;
  let shown = 0;
  let frame = 0;

  // Count up to the new number; jump directly when motion is reduced.
  function showCount(value) {
    cancelAnimationFrame(frame);
    const from = shown;
    const format = (number) => number.toLocaleString("de-DE");
    if (from === value || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown = value;
      count.textContent = format(value);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / 450);
      shown = Math.round(from + (value - from) * (1 - (1 - progress) ** 3));
      count.textContent = format(shown);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  }
  function renderCount(state) {
    const label = element("count-label");
    if (state !== "active" || replaced === null) {
      cancelAnimationFrame(frame);
      shown = 0;
      count.textContent = "–";
      label.textContent = texts[state]?.[2] ?? "Wird gezählt …";
      return;
    }
    showCount(replaced);
    label.textContent = replaced === 0 ? "Keine Genderformen auf dieser Seite gefunden"
      : replaced === 1 ? "Wort auf dieser Seite ersetzt" : "Wörter auf dieser Seite ersetzt";
  }

  function render() {
    for (const key of ["enabled", "pairs", "participles"]) {
      controls[key].checked = settings[key];
      controls[key].disabled = false;
    }
    const siteActive = Boolean(hostname && !settings.disabledHosts.includes(hostname));
    controls.site.checked = siteActive;
    controls.site.disabled = !hostname;
    // Site and rule options only matter while the reading view is on.
    details.disabled = !settings.enabled;
    element("hostname").textContent = hostname ?? "Keine normale Webseite";
    element("summary").textContent = settings.enabled ? "Auf allen Websites eingeschaltet" : "Überall ausgeschaltet";
    const state = !settings.enabled ? "off" : !available ? "unavailable" : !siteActive ? "paused" : "active";
    document.body.dataset.state = state;
    [element("badge").textContent, status.textContent] = texts[state];
    renderCount(state);
  }

  async function save(event) {
    const previous = settings;
    const key = event.target.id;
    settings = { ...settings };
    if (key === "site") {
      const hosts = new Set(settings.disabledHosts);
      if (controls.site.checked) hosts.delete(hostname);
      else hosts.add(hostname);
      settings.disabledHosts = [...hosts];
    } else settings[key] = controls[key].checked;
    for (const input of Object.values(controls)) input.disabled = true;
    try {
      await api.storage.local.set({ settings });
      render();
    } catch {
      settings = previous;
      render();
      status.textContent = "Speichern fehlgeschlagen. Bitte erneut versuchen.";
    }
  }

  // The page reports its count while the popup is open, e.g. after an option changes.
  function listen(tabId) {
    const port = api.tabs.connect(tabId, { name: "entgendert:status" });
    port.onMessage.addListener((message) => {
      replaced = message.replaced;
      if (settings) render();
    });
    port.onDisconnect.addListener(() => void api.runtime.lastError);
  }

  async function init() {
    element("version").textContent = `v${api.runtime.getManifest().version}`;
    const [{ settings: stored }, tabs] = await Promise.all([
      api.storage.local.get("settings"), api.tabs.query({ active: true, currentWindow: true })
    ]);
    settings = { ...Entgendert.defaults, ...stored };
    const tab = tabs[0];
    try {
      const url = new URL(tab?.url);
      if (url.protocol === "https:" || url.protocol === "http:") hostname = url.hostname;
      if (hostname) {
        const response = await api.tabs.sendMessage(tab.id, { type: "entgendert:status" });
        available = Boolean(response);
        replaced = response?.replaced ?? null;
        if (available) listen(tab.id);
      }
    } catch { /* Restricted browser pages have no content script. */ }
    render();
    for (const input of Object.values(controls)) input.addEventListener("change", save);
  }
  init().catch(() => { status.textContent = "Einstellungen konnten nicht geladen werden."; });
})();
