// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { BLOCK_MENU_ITEMS } from './items'
import { closeMenu, executeBlockMenuItem, openMenuForBlock } from './menu-commands'
import { blockMenuKey } from './menu-state'

test.each(BLOCK_MENU_ITEMS)('applies $type preserving ID and children', item => {
  const editor = createEditor(doc(block('a', '', 'paragraph', [block('child')])))
  openMenuForBlock(editor.view, 'a')
  expect(executeBlockMenuItem(editor.view, item)).toBe(true)
  const container = editor.state.doc.firstChild!
  expect(container.attrs.id).toBe('a')
  expect(container.lastChild?.firstChild?.attrs.id).toBe('child')
  expect(container.firstChild?.type.name).toBe(item.type.startsWith('heading-') ? 'heading' : item.type)
  expect(blockMenuKey.getState(editor.state)?.open).toBe(false)
})
test('adds a paragraph after nonempty blocks, ignores missing and readonly targets', () => {
  const editor = createEditor(doc(block('a', 'kept')))
  openMenuForBlock(editor.view, 'missing')
  expect(editor.state.doc.childCount).toBe(1)
  editor.setEditable(false)
  openMenuForBlock(editor.view, 'a')
  expect(editor.state.doc.childCount).toBe(1)
  editor.setEditable(true)
  openMenuForBlock(editor.view, 'a')
  expect(editor.state.doc.childCount).toBe(2)
  expect(editor.state.doc.child(0).textContent).toBe('kept')
  closeMenu(editor.view)
  expect(executeBlockMenuItem(editor.view, BLOCK_MENU_ITEMS[0])).toBe(false)
})

