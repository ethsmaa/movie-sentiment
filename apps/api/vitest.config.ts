import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      // Tests don't run the real FastAPI sidecar. Allow the simulator
      // fallback so unit tests stay deterministic and offline.
      BERT_STRICT: 'false',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/services/**', 'src/lib/**'],
      exclude: ['src/lib/prisma.ts', 'src/lib/constants.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
