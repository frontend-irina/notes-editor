// @vitest-environment jsdom
import type { MouseEvent } from 'react'
import { expect, test } from 'vitest'
import { act, renderHook } from '../../../test/react'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { useBlockTypeSelect } from './use-block-type-select'

test('restores saved selection, resets quote alignment and closes the menu', () => {
  const editor = createEditor(doc(block('a', 'text')))
  editor.commands.setTextSelection({ from: 2, to: 6 })
  editor.commands.updateAttributes('blockContainer', { textAlignment: 'right' })
  const { result } = renderHook(() => useBlockTypeSelect(editor, 'paragraph'))
  const anchor = document.createElement('button')
  act(() => result.current.openMenu({ currentTarget: anchor } as MouseEvent<HTMLButtonElement>))
  expect(result.current.anchor).toBe(anchor)
  editor.commands.setTextSelection(2)
  act(() => result.current.setBlockType('quote'))
  expect(editor.state.selection.to).toBe(6)
  expect(editor.state.doc.firstChild?.attrs.textAlignment).toBe('left')
  expect(result.current.anchor).toBeNull()
  act(() => result.current.closeMenu())
  expect(result.current.anchor).toBeNull()
})
test('choosing the current type only closes the menu', () => {
  const editor = createEditor()
  const before = editor.getJSON()
  const { result } = renderHook(() => useBlockTypeSelect(editor, 'paragraph'))
  act(() => result.current.setBlockType('paragraph'))
  expect(editor.getJSON()).toEqual(before)
})
