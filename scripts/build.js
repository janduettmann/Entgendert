import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(root, "extension");
const manifest = JSON.parse(await readFile(path.join(source, "manifest.json"), "utf8"));
const files = ["dictionary.js", "engine.js", "content.js", "popup.js", "popup.html", "popup.css"];
for (const browser of ["chrome", "firefox"]) {
  const destination = path.join(root, "dist", browser);
  await mkdir(destination, { recursive: true });
  for (const file of files) await cp(path.join(source, file), path.join(destination, file));
  await cp(path.join(root, "LICENSE"), path.join(destination, "LICENSE"));
  await cp(path.join(source, "icons"), path.join(destination, "icons"), { recursive: true });
  const config = structuredClone(manifest);
  if (browser === "chrome") {
    delete config.browser_specific_settings;
    config.minimum_chrome_version = "120";
  }
  await writeFile(path.join(destination, "manifest.json"), JSON.stringify(config, null, 2) + "\n");
  console.log(`Built dist/${browser}`);
}
