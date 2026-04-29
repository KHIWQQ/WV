import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/e2e/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/lib/**/*.{ts,tsx}",
    "src/stores/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/lib/openapi/**",
  ],
  // Ratchet — don't go backwards from current baseline.
  // Raise these as more tests land. Last bumped 2026-04-30 after adding
  // findMissingRates + thai-gold provider tests (88 tests total).
  coverageThreshold: {
    global: { lines: 18, functions: 28, branches: 12, statements: 18 },
  },
};

export default createJestConfig(config);
