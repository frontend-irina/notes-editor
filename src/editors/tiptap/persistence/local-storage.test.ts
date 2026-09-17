// @vitest-environment jsdom
import { beforeEach, expect, test } from 'vitest'
import type { Block } from '../types'
import {
  BlockStorageError,
  parseBlockTree,
  readBlockTree,
  writeBlockTree,
} from './local-storage'

const blocks: Block[] = [{
  id: 'a',
  type: 'paragraph',
  props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
  content: [{ type: 'text', text: 'text', styles: {} }],
  children: [],
}]

beforeEach(() => localStorage.clear())

test('stores and restores the public nested block tree', () => {
  writeBlockTree(localStorage, 'document', blocks)
  expect(readBlockTree(localStorage, 'document')).toEqual(blocks)
  expect(readBlockTree(localStorage, 'missing')).toBeNull()
})

test('rejects malformed and structurally invalid stored values', () => {
  expect(() => parseBlockTree('{broken')).toThrow(BlockStorageError)
  expect(() => parseBlockTree('[]')).toThrow(BlockStorageError)
  expect(() => parseBlockTree('[{"id":"a"}]')).toThrow(BlockStorageError)
})
