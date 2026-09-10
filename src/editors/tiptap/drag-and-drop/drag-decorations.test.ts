// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { dragDecorations } from './drag-decorations'

test('creates draggable handles and an optional cursor', () => {
  const editor = createEditor()
  const handle = editor.view.dom.querySelector<HTMLButtonElement>('.tiptap-drag-handle')!
  expect(handle.draggable).toBe(true)
  expect(handle.dataset.blockId).toBe('a')
  expect(handle.getAttribute('aria-label')).toBe('Перетащить блок')
  expect(dragDecorations(editor.state, null).find()).toHaveLength(1)
  expect(dragDecorations(editor.state, 0).find().map(d => d.spec.key)).toContain('block-drop-cursor')
})

