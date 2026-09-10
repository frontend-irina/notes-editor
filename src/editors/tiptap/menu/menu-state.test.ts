// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { blockMenuKey } from './menu-state'
import { block, doc } from '../../../test/fixtures'
import { openMenuForBlock } from './menu-commands'

test('maps slash anchors left, updates query and resets selection', () => {
  const editor = createEditor()
  editor.view.dispatch(editor.state.tr.insertText('/').setMeta(blockMenuKey,
    { kind: 'open', triggerFrom: 2, queryFrom: 3, deleteTrigger: true }))
  editor.view.dispatch(editor.state.tr.setMeta(blockMenuKey, { kind: 'select', selectedIndex: 4 }))
  editor.view.dispatch(editor.state.tr.insertText('h'))
  expect(blockMenuKey.getState(editor.state)).toMatchObject({
    open: true, triggerFrom: 2, queryFrom: 3, query: 'h', selectedIndex: 0,
  })
  editor.view.dispatch(editor.state.tr.delete(2, 3))
  expect(blockMenuKey.getState(editor.state)?.open).toBe(false)
})
test.each(['pointer', 'focus', 'blur'])('closes on %s metadata', key => {
  const editor = createEditor()
  editor.view.dispatch(editor.state.tr.setMeta(blockMenuKey,
    { kind: 'open', triggerFrom: 2, queryFrom: 2, deleteTrigger: false }))
  editor.view.dispatch(editor.state.tr.setMeta(key, true))
  expect(blockMenuKey.getState(editor.state)?.open).toBe(false)
})

test('closes on range selections or movement into a different parent', () => {
  const editor = createEditor(doc(block('a', 'abc'), block('b', 'def')))
  editor.view.dispatch(editor.state.tr.setMeta(blockMenuKey,
    { kind: 'open', triggerFrom: 2, queryFrom: 2, deleteTrigger: false }))
  editor.commands.setTextSelection({ from: 2, to: 3 })
  expect(blockMenuKey.getState(editor.state)?.open).toBe(false)
  openMenuForBlock(editor.view, 'a')
  editor.commands.setTextSelection(10)
  expect(blockMenuKey.getState(editor.state)?.open).toBe(false)
})
