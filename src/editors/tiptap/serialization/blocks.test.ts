import { expect, test } from 'vitest'
import { blockToTiptap, tiptapToBlock } from './blocks'
import { defaultBlockProps, type Block } from '../types'

test.each(['paragraph', 'heading', 'quote', 'bulletListItem', 'numberedListItem', 'checkListItem'] as const)(
  'converts %s in both directions using public expected values', (type) => {
    const props = type === 'quote' ? { textColor: 'red', backgroundColor: 'default' }
      : { ...defaultBlockProps, textColor: 'red', ...(type === 'heading' ? { level: 3 } : {}),
        ...(type === 'numberedListItem' ? { start: 4 } : {}), ...(type === 'checkListItem' ? { checked: true } : {}) }
    const attrs = type === 'heading' ? { level: 3 } : type === 'numberedListItem' ? { start: 4 }
      : type === 'checkListItem' ? { checked: true } : undefined
    const publicBlock = { id: 'parent', type, props,
      content: [{ type: 'text', text: 'hello', styles: { bold: true } }], children: [] } as Block
    const internal = { type: 'blockContainer', attrs: { ...defaultBlockProps, ...props, id: 'parent' },
      content: [{ type, attrs, content: [{ type: 'text', text: 'hello', marks: [{ type: 'bold' }] }] }] }
    expect(blockToTiptap(publicBlock)).toEqual(internal)
    expect(tiptapToBlock(internal)).toEqual(publicBlock)
  },
)

test('preserves nested blocks and generates missing IDs', () => {
  const child: Block = { id: 'child', type: 'paragraph', props: defaultBlockProps, content: [], children: [] }
  const parent: Block = { ...child, id: '', children: [child] }
  const result = blockToTiptap(parent)
  expect(result.attrs?.id).toMatch(/^[\da-f-]{14}7/)
  expect(result.content?.[1]).toEqual({ type: 'blockGroup', content: [{
    type: 'blockContainer', attrs: { ...defaultBlockProps, id: 'child' },
    content: [{ type: 'paragraph', attrs: undefined, content: [] }],
  }] })
  expect(tiptapToBlock(result).children).toEqual([child])
})

test('uses documented defaults for missing content and invalid heading levels', () => {
  expect(tiptapToBlock({ attrs: { id: 'empty' } })).toEqual({
    id: 'empty', type: 'paragraph', props: defaultBlockProps, content: [], children: [],
  })
  expect(tiptapToBlock({ content: [{ type: 'heading', attrs: { level: 99 } }] }).props)
    .toEqual({ ...defaultBlockProps, level: 1 })
  expect(tiptapToBlock({ content: [{ type: 'numberedListItem' }] }).props).toEqual(defaultBlockProps)
})
