// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { createEditor } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'
import { getBlockTypeIcon, getBlockTypeLabel, getSelectedBlockType } from './blockTypes'

test('identifies single and mixed selected types', () => {
  const editor = createEditor(doc(block('a', 'text'), block('b', 'title', 'heading')))
  expect(getSelectedBlockType(editor)).toBe('paragraph')
  editor.commands.setTextSelection({ from: 2, to: 12 })
  expect(getSelectedBlockType(editor)).toBe('mixed')
  expect(getBlockTypeLabel('mixed')).toBe('Несколько типов')
  expect(getBlockTypeLabel('heading-3')).toBe('Заголовок 3')
  expect(getBlockTypeLabel('quote')).toBe('Цитата')
  expect(getBlockTypeIcon('quote')).toBeTruthy()
})

