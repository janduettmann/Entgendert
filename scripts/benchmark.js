import { performance } from "node:perf_hooks";
import "../extension/dictionary.js";
import "../extension/engine.js";

const scenarios = {
  "Normaler Text": "Diese Webseite enthält Informationen über Reisen, Geschichte und Technik. ".repeat(12000),
  "Langes Wort ohne Treffer": "a".repeat(49000),
  "Gemischte Formen": "Lehrer:innen und Schüler*innen treffen Studierende. Mit den Bürger*innen sprechen Ärzte. ".repeat(10000),
  "Wörterbuchformen": "Zahnärzt:innen, Stammkund*innen und Vorsitzende*r treffen Beamt*innen. Seite(n) bleibt. ".repeat(10000)
};
for (const [name, text] of Object.entries(scenarios)) {
  Entgendert.transform(text);
  const times = [];
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    Entgendert.transform(text);
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  console.log(`${name}: ${text.length.toLocaleString("de-DE")} Zeichen, Median ${times[5].toFixed(1)} ms (Node ${process.version}; nur Text-Engine, kein DOM)`);
}
