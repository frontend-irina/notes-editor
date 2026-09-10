import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'
import { editorModules, isDeclarationOnly } from './src/test/module-inventory.ts'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'node',
    globals: false,
    allowOnly: false,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/editors/**/*.{ts,tsx}', 'src/app/EditorHistoryActions.tsx'],
      exclude: ['**/*.test.*', ...editorModules().filter(isDeclarationOnly)],
    },
  },
}))
