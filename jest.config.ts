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
  coverageThreshold: {
    global: { lines: 40, functions: 40, branches: 30, statements: 40 },
  },
};

export default createJestConfig(config);
