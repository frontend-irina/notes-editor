import { Fragment, Slice } from '@tiptap/pm/model'
import { expect, test } from 'vitest'
import { schema } from '../../../test/create-editor'
import { block } from '../../../test/fixtures'
import { normalizePastedSlice } from './PasteDepthLimit'

test('keeps inline slices unchanged', () => {
  const text = schema.text('plain')
  const slice = new Slice(Fragment.from(text), 0, 0)
  expect(normalizePastedSlice(slice, schema, 5)).toBe(slice)
})

test('flattens descendants that would exceed the fifth level', () => {
  const pasted = schema.nodeFromJSON(block('a', '', 'paragraph', [
    block('b', '', 'paragraph', [block('c', 'text')]),
  ]))
  const normalized = normalizePastedSlice(new Slice(Fragment.from(pasted), 0, 0), schema, 4)
  const root = normalized.content.firstChild
  const children = root?.lastChild
  expect(children?.childCount).toBe(2)
  expect(children?.child(0).attrs.id).toBe('b')
  expect(children?.child(1).attrs.id).toBe('c')
})

test('normalizes an open structural clipboard slice', () => {
  const pasted = schema.nodeFromJSON(block('a', '', 'paragraph', [block('b', 'text')]))
  const normalized = normalizePastedSlice(new Slice(Fragment.from(pasted), 1, 1), schema, 5)
  expect(normalized.openStart).toBe(0)
  expect(normalized.openEnd).toBe(0)
  expect(normalized.content.childCount).toBe(2)
})
