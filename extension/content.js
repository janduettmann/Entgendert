(() => {
  "use strict";
  const api = globalThis.browser ?? globalThis.chrome;
  const { transform, defaults } = globalThis.Entgendert;
  const ignored = "script,style,noscript,textarea,input,select,option,pre,code,kbd,samp,svg,math,[contenteditable]:not([contenteditable='false']),[role='textbox'],[data-entgendert-ignore],[translate='no']";
  const originals = new WeakMap();
  const pending = new Set();
  let settings = { ...defaults };
  let active = false;
  let scheduled = false;
  let walker = null;
  let root = null;
  let notifyTimer = 0;
  const ports = new Set();

  function isProtected(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(ignored) || parent.isContentEditable) return true;
    const language = parent.closest("[lang]")?.getAttribute("lang")?.trim().toLowerCase();
    return Boolean(language && language !== "de" && !language.startsWith("de-"));
  }

  function process(node) {
    if (!node.isConnected) return;
    const previous = originals.get(node);
    const current = node.data;
    const source = previous && current === previous.rendered ? previous.source : current;
    // Huge single text nodes can monopolize the main thread. Leave them intact.
    const rendered = active && source.length <= 50000 && !isProtected(node) ? transform(source, settings) : source;
    if (rendered !== current) node.data = rendered;
    if (rendered !== source) originals.set(node, { source, rendered });
    else originals.delete(node);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    // A bounded timer guarantees progress in background tabs too; no polling.
    setTimeout(flush, 0);
  }

  function enqueue(node) {
    if (!node.isConnected || (node.nodeType !== 1 && node.nodeType !== 3)) return;
    pending.add(node);
    // Bound bookkeeping during large mutation bursts.
    if (pending.size > 300) {
      pending.clear();
      if (document.body) pending.add(document.body);
    }
    schedule();
  }

  function flush() {
    scheduled = false;
    const start = performance.now();
    let visited = 0;
    while (visited < 500 && performance.now() - start < 6) {
      if (!walker) {
        root = pending.values().next().value;
        if (!root) break;
        pending.delete(root);
        if (!root.isConnected) continue;
        if (root.nodeType === 3) {
          process(root);
          visited++;
          continue;
        }
        walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      }
      const node = walker.nextNode();
      if (!node || !root.isConnected) {
        walker = null;
        root = null;
        continue;
      }
      // Skip a duplicate queued text node already visited through an ancestor.
      pending.delete(node);
      process(node);
      visited++;
    }
    if (walker || pending.size) schedule();
    else {
      if (!active) observer.disconnect();
      notify();
    }
  }

  // Number of original words that were changed or removed in one text node:
  // "Lehrer:innen treffen Ärzt*innen" → "Lehrer treffen Ärzte" counts 2.
  function countWords(source, rendered) {
    const before = source.split(/\s+/u).filter(Boolean);
    const after = rendered.split(/\s+/u).filter(Boolean);
    let start = 0;
    while (start < before.length && start < after.length && before[start] === after[start]) start++;
    let endBefore = before.length;
    let endAfter = after.length;
    while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) { endBefore--; endAfter--; }
    const removed = before.slice(start, endBefore);
    const added = after.slice(start, endAfter);
    if (!added.length || removed.length * added.length > 200000) return removed.length;
    // Longest common subsequence of the changed middle, two rows at a time.
    let previous = new Array(added.length + 1).fill(0);
    for (const word of removed) {
      const row = [0];
      for (let j = 1; j <= added.length; j++) row[j] = word === added[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], row[j - 1]);
      previous = row;
    }
    return removed.length - previous[added.length];
  }

  // Counted on request only, so normal browsing does not pay for it.
  function countReplaced() {
    let total = 0;
    if (!document.body) return total;
    const nodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node; (node = nodes.nextNode());) {
      const entry = originals.get(node);
      if (!entry || entry.rendered !== node.data) continue;
      entry.count ??= countWords(entry.source, entry.rendered);
      total += entry.count;
    }
    return total;
  }
  const status = () => ({ active, replaced: countReplaced(), hostname: location.hostname });

  // Live updates for an open popup, batched while the page is still changing.
  function notify() {
    if (!ports.size || notifyTimer) return;
    notifyTimer = setTimeout(() => {
      notifyTimer = 0;
      const current = status();
      for (const port of ports) port.postMessage(current);
    }, 150);
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") {
        if (originals.get(record.target)?.rendered !== record.target.data) enqueue(record.target);
      } else if (record.type === "attributes") {
        enqueue(record.target);
      } else {
        for (const node of record.addedNodes) enqueue(node);
      }
    }
  });

  function applySettings(next) {
    settings = { ...defaults, ...next };
    active = settings.enabled && !settings.disabledHosts.includes(location.hostname);
    pending.clear();
    walker = null;
    observer.disconnect();
    // Stay attached while restoring; our own writes are filtered above.
    observer.observe(document.documentElement, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ["contenteditable", "role", "data-entgendert-ignore", "translate", "lang"]
    });
    if (document.body) enqueue(document.body);
  }

  api.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.settings) applySettings(changes.settings.newValue);
  });
  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "entgendert:status") sendResponse(status());
  });
  api.runtime.onConnect.addListener((port) => {
    if (port.name !== "entgendert:status") return;
    ports.add(port);
    port.onDisconnect.addListener(() => ports.delete(port));
    port.postMessage(status());
  });
  api.storage.local.get("settings").then(({ settings: stored }) => applySettings(stored)).catch(() => {
    // Fail closed if settings cannot be read.
  });
})();
