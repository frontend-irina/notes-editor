// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'
import StarterKit from '@tiptap/starter-kit'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { dragEvent } from '../../../test/drag-event'
import { endDrag, startDrag } from './drag-session'
import { dropPosition, handleDrop } from './drop-handler'

test('moves a block across editors and deletes only its source range', () => {
  const source = createEditor(doc(block('a', 'A'), block('b', 'B')))
  const target = createEditor(doc(block('c', 'C')))
  const { event } = dragEvent()
  startDrag(source.view, event, 'a')
  vi.spyOn(target.view, 'posAtCoords').mockReturnValue({ pos: 5, inside: -1 })
  expect(handleDrop(target.view, event, endDrag)).toBe(true)
  expect(source.state.doc.textContent).toBe('B')
  expect(target.state.doc.textContent).toBe('CA')
  expect(target.state.doc.child(1).attrs.id).toBe('a')
  expect(event.defaultPrevented).toBe(true)
  expect(source.commands.undo()).toBe(true)
  expect(source.state.doc.textContent).toBe('AB')
  expect(target.commands.undo()).toBe(true)
  expect(target.state.doc.textContent).toBe('C')
})
test('moves inside an editor and ignores drops within the dragged range', () => {
  const editor = createEditor(doc(block('a', 'A'), block('b', 'B')))
  startDrag(editor.view, dragEvent().event, 'a')
  vi.spyOn(editor.view, 'posAtCoords').mockReturnValue({ pos: 10, inside: -1 })
  expect(handleDrop(editor.view, dragEvent().event, endDrag)).toBe(true)
  expect(editor.state.doc.textContent).toBe('BA')
  startDrag(editor.view, dragEvent().event, 'b')
  vi.mocked(editor.view.posAtCoords).mockReturnValue({ pos: 0, inside: -1 })
  expect(handleDrop(editor.view, dragEvent().event, endDrag)).toBe(true)
  expect(editor.state.doc.textContent).toBe('BA')
  expect(dropPosition(editor.view, dragEvent().event)).toBeNull()
})

test('rejects readonly, missing coordinates and incompatible schemas without deleting the source', () => {
  const source = createEditor(doc(block('a', 'kept')))
  const target = createEditor()
  const before = source.getJSON()
  startDrag(source.view, dragEvent().event, 'a')
  target.setEditable(false)
  expect(handleDrop(target.view, dragEvent().event, endDrag)).toBe(false)
  target.setEditable(true)
  vi.spyOn(target.view, 'posAtCoords').mockReturnValue(null)
  expect(handleDrop(target.view, dragEvent().event, endDrag)).toBe(false)
  const incompatible = createEditor({ type: 'doc', content: [{ type: 'paragraph' }] }, 1, { extensions: [StarterKit] })
  expect(handleDrop(incompatible.view, dragEvent().event, endDrag)).toBe(false)
  expect(source.getJSON()).toEqual(before)
})

test('recreates a complete subtree in the target schema without losing props or marks', () => {
  const parent = block('parent', 'styled', 'paragraph', [block('child', 'nested')])
  parent.attrs = { id: 'parent', textColor: 'red', textAlignment: 'center' }
  parent.content![0].content![0].marks = [{ type: 'bold' }]
  const source = createEditor(doc(parent, block('stay', 'stay')))
  const target = createEditor(doc(block('target', 'target')))
  const expected = source.state.doc.firstChild!.toJSON()
  startDrag(source.view, dragEvent().event, 'parent')
  vi.spyOn(target.view, 'posAtCoords').mockReturnValue({ pos: target.state.doc.content.size, inside: -1 })
  expect(handleDrop(target.view, dragEvent().event, endDrag)).toBe(true)
  expect(target.state.doc.child(1).toJSON()).toEqual(expected)
  expect(target.state.doc.child(1).type).toBe(target.schema.nodes.blockContainer)
  expect(source.state.doc.textContent).toBe('stay')
})
