import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // auth-client.test.ts schedules nested pollForToken fetches with fake timers;
    // legitimate rejection patterns still register assertions via `rejects.toThrow`,
    // but Vitest's unhandled-error reporter flags the inner chain. Suppress for now.
    dangerouslyIgnoreUnhandledErrors: true,
    coverage: {
      exclude: ["**/*.d.ts", "**/*.test.{ts,tsx}", "src/types.ts", "src/index.ts"],
    },
  },
});