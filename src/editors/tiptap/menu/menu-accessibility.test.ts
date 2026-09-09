// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { openMenuForBlock, closeMenu } from './menu-commands'
import { blockMenuKey } from './menu-state'
import { menuAccessibility } from './menu-accessibility'

test('updates expanded and active item attributes and removes them on close/destroy', () => {
  const editor = createEditor()
  const view = editor.view
  openMenuForBlock(view, 'a')
  expect(view.dom.getAttribute('aria-expanded')).toBe('true')
  editor.view.dispatch(editor.state.tr.setMeta(blockMenuKey, { kind: 'select', selectedIndex: 2 }))
  expect(view.dom.getAttribute('aria-activedescendant')).toBe('tiptap-block-menu-item-2')
  closeMenu(view)
  expect(view.dom.hasAttribute('aria-controls')).toBe(false)
  openMenuForBlock(view, 'a')
  menuAccessibility(view).destroy?.()
  expect(view.dom.hasAttribute('aria-expanded')).toBe(false)
})

