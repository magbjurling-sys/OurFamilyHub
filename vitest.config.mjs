import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The dc-runtime parse helpers use DOMParser/document, so the suite runs
    // in a jsdom environment.
    environment: "jsdom",
    include: ["test/**/*.test.mjs"],
  },
});
