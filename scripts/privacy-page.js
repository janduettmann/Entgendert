import { readFile, mkdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const markdown = await readFile(new URL("PRIVACY.md", root), "utf8");
const escape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const paragraphs = markdown.trim().split(/\n\s*\n/).slice(1).map((paragraph) =>
  `<p>${escape(paragraph.replace(/\n/g, " ")).replace(/`([^`]+)`/g, "<code>$1</code>")}</p>`
).join("\n");
const html = `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Datenschutzhinweise zur Browser-Erweiterung Entgendert: lokale Verarbeitung ohne Telemetrie oder Datenübertragung durch die Erweiterung.">
  <title>Entgendert – Datenschutz</title>
  <style>
    :root { color-scheme: light; font: 17px/1.75 system-ui, sans-serif; color: #243b30; background: #f5f3ec; }
    body { max-width: 760px; margin: 0 auto; padding: 48px 24px 70px; }
    .brand { font-weight: 750; letter-spacing: -.7px; font-size: 24px; }
    h1 { font-size: clamp(30px, 7vw, 44px); line-height: 1.2; margin: 32px 0 28px; letter-spacing: -1px; }
    p { margin: 0 0 22px; } code { background: #e6eadc; border-radius: 4px; padding: 2px 5px; font-size: .88em; }
    a { color: #225f47; text-underline-offset: 3px; } footer { border-top: 1px solid #ccd6c6; margin-top: 35px; padding-top: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="brand">Entgendert</div>
  <main><h1>Datenschutzhinweise</h1>
${paragraphs}
  <p>Kontakt zum Projekt: <a href="https://github.com/janduettmann/Entgendert/issues">GitHub Issues</a>. Bitte dort keine vertraulichen Seitentexte oder personenbezogenen Daten veröffentlichen.</p>
  <p>Diese Hinweise betreffen die Erweiterung. Beim Aufruf dieser auf GitHub Pages gehosteten Informationsseite verarbeitet GitHub technische Zugriffsdaten nach seiner <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement">Datenschutzerklärung</a>.</p>
  </main>
  <footer>Quellcode und Dokumentation: <a href="https://github.com/janduettmann/Entgendert">Entgendert auf GitHub</a><br>Keine externen Schriften, Analyse-Skripte oder eingebetteten Dienste auf dieser Seite.</footer>
</body>
</html>
`;
await mkdir(new URL("docs/", root), { recursive: true });
await writeFile(new URL("docs/privacy.html", root), html);
console.log("Built docs/privacy.html from PRIVACY.md");
