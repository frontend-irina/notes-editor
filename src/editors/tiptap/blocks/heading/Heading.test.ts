// @vitest-environment jsdom
import { expect, test } from 'vitest'
import { DOMParser, DOMSerializer } from '@tiptap/pm/model'
import { getSchema } from '@tiptap/core'
import { createEditorExtensions } from '../../editor-extensions'
import { Heading } from './Heading'
import { createEditor } from '../../../../test/create-editor'
import { block, doc } from '../../../../test/fixtures'

test.each([1, 2, 3, 4, 5, 6])('registers heading level %i and matching HTML', level => {
  const editor = createEditor(doc(block('a', 'text')))
  editor.commands.keyboardShortcut('Mod-Alt-' + level)
  expect(editor.state.doc.firstChild?.firstChild?.attrs.level).toBe(level)
  expect(editor.getHTML()).toContain('<h' + level)
  expect(editor.state.doc.firstChild?.attrs.id).toBe('a')
})

test('configured levels restrict import rules and provide a rendering fallback', () => {
  const schema = getSchema(createEditorExtensions().map(extension => extension.name === 'heading'
    ? Heading.configure({ levels: [2, 3], defaultLevel: 2 }) : extension))
  expect(schema.nodes.heading.create().attrs.level).toBe(2)
  const element = DOMSerializer.fromSchema(schema).serializeNode(schema.nodes.heading.create({ level: 6 })) as HTMLElement
  expect(element.tagName).toBe('H2')
  const host = document.createElement('div')
  host.innerHTML = '<h3>title</h3>'
  expect(DOMParser.fromSchema(schema).parseSlice(host).content.firstChild?.attrs.level).toBe(3)
  expect(schema.nodes.heading.spec.parseDOM?.map(rule => 'tag' in rule && rule.tag)).toEqual(['h2', 'h3'])
})
