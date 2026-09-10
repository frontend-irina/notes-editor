// @vitest-environment jsdom
import { DOMParser } from '@tiptap/pm/model'
import { expect, test } from 'vitest'
import { createEditor, schema } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'

test('renders and imports blockquotes as inline content blocks', () => {
  const editor = createEditor(doc(block('a', 'quoted', 'quote')))
  expect(editor.getHTML()).toContain('<blockquote>quoted</blockquote>')
  const host = document.createElement('div')
  host.innerHTML = '<blockquote>quoted</blockquote>'
  expect(DOMParser.fromSchema(schema).parseSlice(host).content.firstChild?.type.name).toBe('quote')
  expect(schema.nodes.quote.spec.isolating).not.toBe(true)
})

