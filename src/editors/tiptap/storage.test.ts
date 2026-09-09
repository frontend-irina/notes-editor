// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'
import { loadTiptapContent, saveTiptapContent } from './storage'

const key = 'editor-playground:tiptap-blocks'

test('loads a default paragraph for absent, malformed or unavailable storage', () => {
  for (const value of [null, '{', '{}']) {
    localStorage.clear()
    if (value) localStorage.setItem(key, value)
    const content = loadTiptapContent()
    expect(content.content).toHaveLength(1)
    expect(content.content?.[0].content?.[0].type).toBe('paragraph')
    expect(content.content?.[0].attrs?.id).toMatch(/^[\da-f-]{14}7/)
  }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
  expect(loadTiptapContent().content).toHaveLength(1)
})

test('persists public blocks and restores stable IDs and text', () => {
  saveTiptapContent({ type: 'doc', content: [{
    type: 'blockContainer', attrs: { id: 'saved-id' },
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'saved' }] }],
  }] })
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([{
    id: 'saved-id', type: 'paragraph',
    props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
    content: [{ type: 'text', text: 'saved', styles: {} }], children: [],
  }])
  expect(loadTiptapContent().content?.[0].attrs?.id).toBe('saved-id')
  expect(loadTiptapContent().content?.[0].content?.[0].content?.[0].text).toBe('saved')
})

test('empty content saves an empty public array and quota failures do not escape', () => {
  saveTiptapContent({ type: 'doc' })
  expect(localStorage.getItem(key)).toBe('[]')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  expect(() => saveTiptapContent({ type: 'doc' })).not.toThrow()
})
