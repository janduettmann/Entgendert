import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { unzipSync } from "fflate";

const root = new URL("../", import.meta.url);
const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const lock = JSON.parse(await readFile(new URL("package-lock.json", root), "utf8"));
assert.equal(pkg.version, lock.version);
assert.equal(pkg.version, lock.packages[""].version);
const checksums = [];

function assertPng(bytes, width, height, name) {
  const buffer = Buffer.from(bytes);
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${name}: PNG signature`);
  assert.equal(buffer.readUInt32BE(16), width, `${name}: width`);
  assert.equal(buffer.readUInt32BE(20), height, `${name}: height`);
}
for (const browser of ["chrome", "firefox"]) {
  const filename = `${browser}/entgendert-${pkg.version}-${browser}.zip`;
  const archive = await readFile(new URL(`artifacts/${filename}`, root));
  const files = unzipSync(archive);
  const manifest = JSON.parse(new TextDecoder().decode(files["manifest.json"]));
  assert.equal(manifest.version, pkg.version);
  assert.equal(manifest.name, "Entgendert");
  assert.equal(manifest.manifest_version, 3);
  assert.ok(files.LICENSE, "License must be included");
  assert.deepEqual(manifest.permissions, ["storage", "activeTab"]);
  for (const [size, file] of Object.entries(manifest.icons)) assertPng(files[file], Number(size), Number(size), file);
  for (const [size, file] of Object.entries(manifest.action.default_icon)) assertPng(files[file], Number(size), Number(size), file);
  for (const file of [manifest.action.default_popup, ...manifest.content_scripts.flatMap((entry) => entry.js)]) {
    assert.ok(files[file]?.length, `${browser}: missing ${file}`);
  }
  for (const file of ["dictionary.js", "engine.js", "content.js", "popup.js", "popup.html", "popup.css"]) {
    assert.deepEqual(Buffer.from(files[file]), await readFile(new URL(`extension/${file}`, root)), `${browser}: stale ${file}`);
  }
  if (browser === "chrome") assert.equal(manifest.browser_specific_settings, undefined);
  else {
    assert.equal(manifest.browser_specific_settings.gecko.id, "entgendert@jandu.github");
    assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required, ["none"]);
  }
  checksums.push(`${createHash("sha256").update(archive).digest("hex")}  ${filename}`);
  console.log(`PASS ${browser}: version, permissions, icons, resources, current source, license`);
}
for (const [file, width, height] of [
  ["promo-440x280.png", 440, 280], ["marquee-1400x560.png", 1400, 560],
  ["01-original-1280x800.png", 1280, 800], ["02-entgendert-1280x800.png", 1280, 800]
]) assertPng(await readFile(new URL(`store/images/${file}`, root)), width, height, file);
const sourceName = `entgendert-${pkg.version}-source.zip`;
const sourceArchive = await readFile(new URL(`artifacts/${sourceName}`, root));
const source = unzipSync(sourceArchive);
for (const file of ["package-lock.json", "LICENSE", "extension/engine.js", "extension/dictionary.js", "extension/icons/icon-128.png", "scripts/build.js", "scripts/build-dictionary.js", "store/reviewer-notes.md", "docs/privacy.html"]) {
  assert.ok(source[file]?.length, `Source package: missing ${file}`);
}
assert.ok(!Object.keys(source).some((file) => file.startsWith("node_modules/") || file.startsWith(".git/")));
checksums.push(`${createHash("sha256").update(sourceArchive).digest("hex")}  ${sourceName}`);
const kitName = `entgendert-${pkg.version}-store-kit.zip`;
const kitArchive = await readFile(new URL(`artifacts/${kitName}`, root));
const kit = unzipSync(kitArchive);
for (const file of ["store/listing-de.md", "store/images/promo-440x280.png", "privacy.html", "icons/icon-128.png", `chrome/entgendert-${pkg.version}-chrome.zip`, `firefox/entgendert-${pkg.version}-firefox.zip`]) {
  assert.ok(kit[file]?.length, `Store kit: missing ${file}`);
}
checksums.push(`${createHash("sha256").update(kitArchive).digest("hex")}  ${kitName}`);
await writeFile(new URL("artifacts/SHA256SUMS", root), checksums.join("\n") + "\n");
console.log("PASS store image dimensions, source archive and store kit; artifacts/SHA256SUMS written");
