import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30000,
  workers: 1,
  reporter: "list",
  use: { headless: true },
  webServer: { command: "node tests/server.js", port: 4173, reuseExistingServer: false }
});
