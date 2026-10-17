import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { zipSync } from "fflate";

async function collect(folder, prefix = "", files = {}) {
  for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) await collect(new URL(`${entry.name}/`, folder), `${name}/`, files);
    else if (entry.isFile()) {
      files[name] = [new Uint8Array(await readFile(new URL(entry.name, folder))), { mtime: new Date(2026, 0, 1, 0, 0, 0) }];
    }
  }
  return files;
}

for (const browser of ["chrome", "firefox"]) {
  const folder = new URL(`../dist/${browser}/`, import.meta.url);
  const manifest = JSON.parse(await readFile(new URL("manifest.json", folder), "utf8"));
  const files = await collect(folder);
  const output = new URL(`../artifacts/${browser}/`, import.meta.url);
  await mkdir(output, { recursive: true });
  const name = `entgendert-${manifest.version}-${browser}.zip`;
  await writeFile(new URL(name, output), zipSync(files, { level: 9 }));
  console.log(`Packaged artifacts/${browser}/${name}`);
}

const root = new URL("../", import.meta.url);
const source = {};
for (const directory of ["extension", "assets", "scripts", "tests", "store", "docs"]) {
  await collect(new URL(`${directory}/`, root), `${directory}/`, source);
}
for (const file of ["package.json", "package-lock.json", "playwright.config.js", "README.md", "CONTRIBUTING.md", "PRIVACY.md", "LICENSE"]) {
  source[file] = [new Uint8Array(await readFile(new URL(file, root))), { mtime: new Date(2026, 0, 1, 0, 0, 0) }];
}
const { version } = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
await writeFile(new URL(`artifacts/entgendert-${version}-source.zip`, root), zipSync(source, { level: 9 }));
console.log(`Packaged artifacts/entgendert-${version}-source.zip`);

const kit = await collect(new URL("store/", root), "store/");
await collect(new URL("extension/icons/", root), "icons/", kit);
for (const file of [
  `chrome/entgendert-${version}-chrome.zip`,
  `firefox/entgendert-${version}-firefox.zip`,
  `entgendert-${version}-source.zip`
]) {
  kit[file] = [new Uint8Array(await readFile(new URL(`artifacts/${file}`, root))), { mtime: new Date(2026, 0, 1, 0, 0, 0) }];
}
kit["privacy.html"] = [new Uint8Array(await readFile(new URL("docs/privacy.html", root))), { mtime: new Date(2026, 0, 1, 0, 0, 0) }];
await writeFile(new URL(`artifacts/entgendert-${version}-store-kit.zip`, root), zipSync(kit, { level: 9 }));
console.log(`Packaged artifacts/entgendert-${version}-store-kit.zip (unpack first; not an extension upload)`);
