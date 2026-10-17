// Generates extension/dictionary.js from the german-nouns data set (German
// Wiktionary, CC BY-SA 4.0). The extension itself never downloads anything.
//
//   npm run dictionary                 download the pinned CSV into .cache/
//   npm run dictionary -- nouns.csv    use a local copy instead
//   npm run dictionary -- --report     also print ambiguous mappings
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const commit = "da71a2bc519b952b28c9b0b80971cff6efb508f6";
const checksum = "7b34ca76bb753fa5d3d2b683ecc987824ae874b375ac999a797074fafba2768e";
const sourceUrl = `https://raw.githubusercontent.com/gambolputty/german-nouns/${commit}/german_nouns/nouns.csv`;
// Keep in sync with extension/engine.js; the self-check below catches drift.
const minPrefix = 2;
const minHead = 4;
const minAdjectiveHead = 5;

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const report = args.includes("--report");
const output = path.join(root, "extension", "dictionary.js");

async function loadCsv() {
  let file = args.find((arg) => !arg.startsWith("--"));
  if (!file) {
    file = path.join(root, ".cache", `german-nouns-${commit.slice(0, 12)}.csv`);
    if (!existsSync(file)) {
      console.log(`Lade ${sourceUrl}`);
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`Download fehlgeschlagen: HTTP ${response.status}`);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, Buffer.from(await response.arrayBuffer()));
    }
  }
  const data = await readFile(file);
  const hash = createHash("sha256").update(data).digest("hex");
  if (hash !== checksum) throw new Error(`Unerwartete SHA-256 ${hash} für ${file}`);
  return data.toString("utf8");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') field += text[++i];
      else quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (char !== "\r") field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((values) => Object.fromEntries(header.map((name, index) => [name, values[index] ?? ""])));
}

const lower = (text) => text.toLocaleLowerCase("de");
const capitalize = (text) => text[0].toLocaleUpperCase("de") + lower(text.slice(1));
const variants = (row, name) => [name, `${name} 1`, `${name} 2`, `${name} 3`, `${name} 4`].map((key) => row[key]).find(Boolean) ?? "";
const genera = (row) => ["genus", "genus 1", "genus 2", "genus 3", "genus 4"].map((key) => row[key]).filter(Boolean);
const umlauts = { Äu: "Au", äu: "au", Ä: "A", ä: "a", Ö: "O", ö: "o", Ü: "U", ü: "u" };
function withoutUmlaut(stem) {
  const match = /^(.*)(Äu|äu|Ä|ä|Ö|ö|Ü|ü)([^ÄäÖöÜü]*)$/u.exec(stem);
  return match ? match[1] + umlauts[match[2]] + match[3] : null;
}

const rows = parseCsv(await loadCsv());

// Masculine nouns, keyed by lemma. The first row wins; Wiktionary lists the main sense first.
const masculine = new Map();
for (const row of rows) {
  if (!/^Substantiv(?:,adjektivische Deklination)?$/u.test(row.pos) || !genera(row).includes("m")) continue;
  const adjectival = row.pos.includes("adjektivisch");
  const forms = adjectival
    ? { singular: row["nominativ singular stark"], plural: row["nominativ plural stark"], dative: row["dativ plural stark"], adjectival }
    : { singular: row.lemma, plural: variants(row, "nominativ plural"), dative: variants(row, "dativ plural"), adjectival };
  if (forms.singular && forms.plural && forms.dative && !masculine.has(row.lemma)) masculine.set(row.lemma, forms);
}

// Feminine person nouns such as "Ärztin" → stem "Ärzt" → masculine "Arzt".
const persons = new Map();
const ambiguous = [];
const unmatched = [];
for (const row of rows) {
  if (row.pos !== "Substantiv" || !genera(row).includes("f")) continue;
  if (!/^\p{Lu}\p{Ll}+in$/u.test(row.lemma) || variants(row, "nominativ plural") !== `${row.lemma}nen`) continue;
  const stem = row.lemma.slice(0, -2);
  if (persons.has(stem)) continue;
  const plain = withoutUmlaut(stem);
  const candidates = [
    // "Zauberin" → "Zauberer", "Beamtin" → "Beamter"; never "Köchin" → "Köcher".
    (stem.endsWith("er") || masculine.get(`${stem}er`)?.adjectival) && `${stem}er`,
    `${stem}e`, stem, plain && `${plain}e`, plain
  ].filter((candidate) => candidate && masculine.has(candidate));
  if (!candidates.length) { unmatched.push(row.lemma); continue; }
  if (candidates.length > 1) ambiguous.push(`${row.lemma}: ${candidates.join(" / ")}`);
  persons.set(stem, masculine.get(candidates[0]));
}

// Nominalised adjectives such as "Vorsitzende" or "Angestellte". Words that are
// also ordinary nouns ("Alternative", "Weise") are skipped, because
// "Arbeitsweise(n)" marks an optional plural, not a gender form.
const ordinary = new Set(rows.filter((row) => row.pos === "Substantiv").map((row) => row.lemma));
const adjectives = new Set();
for (const row of rows) {
  if (!/^Substantiv,adjektivische Deklination$/u.test(row.pos) || !/^\p{Lu}\p{Ll}+$/u.test(row.lemma)) continue;
  const gender = genera(row);
  let base = null;
  if (gender.includes("f") && row.lemma.endsWith("e")) base = row.lemma;
  if (gender.includes("m") && row.lemma.endsWith("er")) base = row.lemma.slice(0, -1);
  if (base && !ordinary.has(base)) adjectives.add(base);
}

const isRegular = (stem, forms) => !forms.adjectival && stem.endsWith("er") &&
  forms.singular === stem && forms.plural === stem && forms.dative === `${stem}n`;
const same = (a, b) => a.singular === b.singular && a.plural === b.plural && a.dative === b.dative && a.adjectival === b.adjectival;
const byLength = (a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);

// Drop compounds whose last part already yields the same forms, e.g.
// "Zahnärzt" via "Ärzt". Shorter stems are decided first, so this mirrors the
// engine's lookup order (exact entry, then the longest known last part).
const keptIrregular = new Map();
const keptRegular = new Set();
function viaHead(stem) {
  for (let i = minPrefix; i <= stem.length - minHead; i++) {
    const head = capitalize(stem.slice(i));
    const prefix = stem.slice(0, i);
    const join = (form) => prefix + lower(form[0]) + form.slice(1);
    if (keptRegular.has(head)) return { singular: stem, plural: stem, dative: `${stem}n`, adjectival: false };
    const forms = keptIrregular.get(head);
    if (forms) return { singular: join(forms.singular), plural: join(forms.plural), dative: join(forms.dative), adjectival: forms.adjectival };
  }
  return null;
}
for (const stem of [...persons.keys()].sort(byLength)) {
  const forms = persons.get(stem);
  const derived = viaHead(stem);
  if (derived && same(derived, forms)) continue;
  if (isRegular(stem, forms)) keptRegular.add(stem);
  else keptIrregular.set(stem, forms);
}
const keptAdjectives = new Set();
for (const word of [...adjectives].sort(byLength)) {
  let derived = false;
  for (let i = minPrefix; i <= word.length - minAdjectiveHead && !derived; i++) derived = keptAdjectives.has(capitalize(word.slice(i)));
  if (!derived) keptAdjectives.add(word);
}

// Compact encoding: "+x" appends to the previous form, "" repeats it.
const encode = (base, form) => form === base ? "" : form.startsWith(base) ? `+${form.slice(base.length)}` : form;
const irregular = [...keptIrregular.keys()].sort().map((stem) => {
  const { singular, plural, dative, adjectival } = keptIrregular.get(stem);
  const fields = [stem, encode(stem, singular), encode(singular, plural), encode(plural, dative)];
  if (adjectival) fields.push("a");
  return fields.join(",").replace(/,+$/u, "");
});
const counts = { persons: persons.size, adjectives: adjectives.size };
const source = `/* Generated by scripts/build-dictionary.js. Do not edit by hand.
 * Word data: german-nouns by gambolputty (https://github.com/gambolputty/german-nouns,
 * commit ${commit.slice(0, 12)}), compiled from the German Wiktionary
 * (https://de.wiktionary.org). Licensed under CC BY-SA 4.0
 * (https://creativecommons.org/licenses/by-sa/4.0/). This file is an adapted
 * extract and is shared under the same license.
 *
 * irregular: feminine stem, masculine singular, plural, dative plural[, a = adjectival]
 * regular:   feminine stems whose masculine forms are stem, stem, stem + "n"
 * adjectival: nominalised adjectives such as "Vorsitzende"
 * Compounds are left out when their last part yields the same forms.
 */
globalThis.EntgendertDictionary = Object.freeze({
  counts: Object.freeze(${JSON.stringify(counts)}),
  irregular: ${JSON.stringify(irregular.join(";"))},
  regular: ${JSON.stringify([...keptRegular].sort().join(";"))},
  adjectival: ${JSON.stringify([...keptAdjectives].sort().join(";"))}
});
`;
await writeFile(output, source);
console.log(`${persons.size} weibliche Personenbezeichnungen (${keptIrregular.size} unregelmäßig + ${keptRegular.size} regelmäßig gespeichert),`);
console.log(`${adjectives.size} substantivierte Adjektive (${keptAdjectives.size} gespeichert), ${(source.length / 1024).toFixed(0)} KB → extension/dictionary.js`);
if (report) {
  console.log(`\nMehrdeutig (erste Variante gewählt):\n${ambiguous.join("\n")}`);
  console.log(`\nOhne männliche Form:\n${unmatched.join(", ")}`);
}

// Self-check with the real engine against every entry of the data set.
delete globalThis.EntgendertDictionary;
delete globalThis.Entgendert;
await import(`${pathToFileURL(output).href}?${Date.now()}`);
await import(`${pathToFileURL(path.join(root, "extension", "engine.js")).href}?${Date.now()}`);
const { transform } = globalThis.Entgendert;
const failures = [];
const expect = (input, expected) => {
  // Participle rewriting ("Studierenden" → "Studenten") is a separate rule.
  const actual = transform(input, { participles: false });
  if (actual !== expected) failures.push(`${input} → ${actual} (erwartet ${expected})`);
};
for (const [stem, forms] of persons) {
  expect(`${stem}:in`, forms.singular);
  expect(`${stem}*innen`, forms.plural);
  expect(`${stem},innen`, forms.plural);
  expect(`mit den ${stem}_innen`, `mit den ${forms.dative}`);
}
for (const word of adjectives) expect(`${word}(n)`, `${word}n`);
if (failures.length) {
  console.error(`\n${failures.length} Abweichungen:\n${failures.slice(0, 50).join("\n")}`);
  process.exit(1);
}
console.log("Selbsttest bestanden: alle Einträge werden von der Engine korrekt umgewandelt.");
