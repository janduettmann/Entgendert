/* global Entgendert */
(() => {
  "use strict";
  const api = globalThis.browser ?? globalThis.chrome;
  const controls = Object.fromEntries(["enabled", "site", "pairs", "participles"].map((id) => [id, document.getElementById(id)]));
  const status = document.getElementById("status");
  let hostname = null;
  let available = false;
  let settings;

  function render() {
    for (const key of ["enabled", "pairs", "participles"]) {
      controls[key].checked = settings[key];
      controls[key].disabled = false;
    }
    controls.site.checked = Boolean(hostname && !settings.disabledHosts.includes(hostname));
    controls.site.disabled = !hostname;
    document.getElementById("hostname").textContent = hostname ?? "Keine normale Webseite";
    status.textContent = !available ? "Hier nicht verfügbar. Nach der Installation offene Webseiten neu laden." :
      !settings.enabled || !controls.site.checked ? "Pausiert. Originaltexte werden wiederhergestellt." : "Aktiv. Auch nachgeladene Texte werden verarbeitet.";
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

  async function init() {
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
      }
    } catch { /* Restricted browser pages have no content script. */ }
    render();
    for (const input of Object.values(controls)) input.addEventListener("change", save);
  }
  init().catch(() => { status.textContent = "Einstellungen konnten nicht geladen werden."; });
})();
