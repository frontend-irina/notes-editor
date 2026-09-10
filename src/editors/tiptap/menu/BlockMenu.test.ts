// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { blockMenuKey } from './menu-state'
import { openMenuForBlock } from './menu-commands'

test('wires state, DOM decorations and blur cleanup into the editor', () => {
  const editor = createEditor()
  expect(blockMenuKey.getState(editor.state)?.open).toBe(false)
  expect(editor.view.dom.querySelector('.tiptap-add-block-button')).not.toBeNull()
  openMenuForBlock(editor.view, 'a')
  editor.view.dispatchEvent(new FocusEvent('blur'))
  expect(blockMenuKey.getState(editor.state)?.open).toBe(false)
  expect(editor.view.dom.hasAttribute('aria-controls')).toBe(false)
})

