import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    // Pure-logic unit tests run in Node. Component/integration tests opt into
    // jsdom per-file via `// @vitest-environment jsdom` at the top of the file.
    environment: "node",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Focus coverage on the testable domain/business logic, not UI shells,
      // server actions, or framework glue.
      include: [
        "src/lib/sbom/**",
        "src/lib/constants/cra-*.ts",
        "src/lib/constants/plans.ts",
        "src/lib/validations/**",
        "src/lib/time.ts",
      ],
    },
  },
});
