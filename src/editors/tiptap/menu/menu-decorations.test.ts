// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { blockMenuKey } from './menu-state'

test('renders one accessible add button per container and prevents mousedown selection', () => {
  const editor = createEditor(doc(block('a'), block('b')))
  const buttons = editor.view.dom.querySelectorAll<HTMLButtonElement>('button[aria-label="Добавить блок"]')
  expect(buttons).toHaveLength(2)
  const event = new MouseEvent('mousedown', { cancelable: true, bubbles: true })
  buttons[1].dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  buttons[1].click()
  expect(blockMenuKey.getState(editor.state)?.open).toBe(true)
  expect(editor.state.selection.from).toBe(6)
})

