// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { blockMenuKey } from './menu-state'
import { openMenuForBlock } from './menu-commands'
import { menuInput } from './menu-input'

test('slash input, query, keyboard and composition interact through the plugin', () => {
  const editor = createEditor()
  editor.view.someProp('handleTextInput', handler => handler(editor.view, 2, 2, '/', () => editor.state.tr))
  expect(blockMenuKey.getState(editor.state)?.open).toBe(true)
  editor.commands.insertContent('h3')
  expect(blockMenuKey.getState(editor.state)?.query).toBe('h3')
  // A synthetic key alone does not start a ProseMirror IME session in jsdom.
  expect(menuInput.handleKeyDown?.call(null, editor.view,
    new KeyboardEvent('keydown', { key: 'Enter', isComposing: true }))).toBe(false)
  expect(blockMenuKey.getState(editor.state)?.open).toBe(true)
  editor.view.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
  expect(editor.state.doc.firstChild?.firstChild?.attrs.level).toBe(3)
  expect(editor.state.doc.textContent).toBe('')
})
test('arrows wrap, pages select endpoints and Escape closes', () => {
  const editor = createEditor()
  openMenuForBlock(editor.view, 'a')
  for (const [key, index] of [['ArrowUp', 10], ['ArrowDown', 0], ['PageDown', 10], ['PageUp', 0]] as const) {
    editor.view.dispatchEvent(new KeyboardEvent('keydown', { key }))
    expect(blockMenuKey.getState(editor.state)?.selectedIndex).toBe(index)
  }
  editor.view.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(blockMenuKey.getState(editor.state)?.open).toBe(false)
})

test('empty results consume navigation and Enter without changing type', () => {
  const editor = createEditor()
  openMenuForBlock(editor.view, 'a')
  editor.commands.insertContent('no-such-command')
  for (const key of ['ArrowDown', 'PageDown', 'Enter']) {
    expect(menuInput.handleKeyDown?.call(null, editor.view, new KeyboardEvent('keydown', { key }))).toBe(true)
  }
  expect(editor.state.doc.firstChild?.firstChild?.type.name).toBe('paragraph')
  menuInput.handleClick?.call(null, editor.view, 2, new MouseEvent('click'))
  expect(blockMenuKey.getState(editor.state)?.open).toBe(false)
  editor.setEditable(false)
  expect(menuInput.handleTextInput?.call(null, editor.view, 2, 2, '/', () => editor.state.tr)).toBe(false)
})
