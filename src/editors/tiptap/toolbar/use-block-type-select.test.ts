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
  const container = document.createElement('div')
  const layer = document.createElement('div')
  layer.className = 'tiptap-toolbar-layer'
  const anchor = document.createElement('button')
  container.append(layer)
  layer.append(anchor)
  anchor.getBoundingClientRect = () => ({ bottom: 48, left: 24 } as DOMRect)
  act(() => result.current.openMenu({ currentTarget: anchor } as MouseEvent<HTMLButtonElement>))
  expect(result.current.anchorPosition).toEqual({ top: 48, left: 24 })
  expect(result.current.menuContainer).toBe(container)
  editor.commands.setTextSelection(2)
  act(() => result.current.setBlockType('quote'))
  expect(editor.state.selection.to).toBe(6)
  expect(editor.state.doc.firstChild?.attrs.textAlignment).toBe('left')
  expect(result.current.anchorPosition).toBeNull()
  expect(result.current.menuContainer).toBeNull()
  act(() => result.current.closeMenu())
  expect(result.current.anchorPosition).toBeNull()
})
test('choosing the current type only closes the menu', () => {
  const editor = createEditor()
  const before = editor.getJSON()
  const { result } = renderHook(() => useBlockTypeSelect(editor, 'paragraph'))
  act(() => result.current.setBlockType('paragraph'))
  expect(editor.getJSON()).toEqual(before)
})
