import { expect, test } from 'vitest'
import { editorModules, isDeclarationOnly, missingTests } from './module-inventory'

test('every executable editor module has a neighboring test', () => {
  const modules = editorModules().filter(path => !isDeclarationOnly(path))
  expect(modules).toContain('src/editors/tiptap/types.ts')
  expect(missingTests([...modules, 'src/app/EditorHistoryActions.tsx'])).toEqual([])
})

test('inventory reports missing tests without reading Git or generating files', () => {
  expect(missingTests(['a.ts', 'b.tsx'], path => path === 'a.test.ts')).toEqual(['b.tsx'])
})
