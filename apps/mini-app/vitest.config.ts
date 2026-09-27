import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
    coverage: {
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "src/app.config.ts",
        "src/app.tsx",
        "src/app.scss",
        "src/styles.d.ts",
        "src/pages/**",
        "src/components/**",
        "src/hooks/use-auth.ts",
        "src/services/client.ts",
        "src/lib/auth-client.ts",
      ],
      thresholds: {
        branches: 30,
        functions: 30,
        lines: 30,
        statements: 30,
      },
    },
  },
});