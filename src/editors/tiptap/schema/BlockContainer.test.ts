// @vitest-environment jsdom
import { DOMParser, DOMSerializer } from '@tiptap/pm/model'
import { expect, test } from 'vitest'
import { schema } from '../../../test/create-editor'
import { block } from '../../../test/fixtures'

test('renders and parses block props with optional children', () => {
  const node = schema.nodeFromJSON({ ...block('parent', 'text', 'paragraph', [block('child')]),
    attrs: { id: 'parent', textColor: 'red', backgroundColor: 'yellow', textAlignment: 'center' } })
  const host = document.createElement('div')
  host.append(DOMSerializer.fromSchema(schema).serializeNode(node))
  const element = host.firstElementChild as HTMLElement
  expect(element.dataset.id).toBe('parent')
  expect(element.style.textAlign).toBe('center')
  expect(element.style.color).toBe('red')
  expect(DOMParser.fromSchema(schema).parse(host).firstChild?.toJSON()).toEqual(node.toJSON())
  expect(() => schema.nodes.blockContainer.create().check()).toThrow()
  expect(() => schema.nodes.blockContainer.create(null, [schema.nodes.paragraph.create(), schema.nodes.paragraph.create()]).check()).toThrow()
})

