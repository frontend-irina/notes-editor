// @vitest-environment jsdom
import { DOMParser, DOMSerializer } from '@tiptap/pm/model'
import { expect, test } from 'vitest'
import { schema } from '../../../test/create-editor'
import { block } from '../../../test/fixtures'

test('nested groups require containers and preserve their IDs through HTML', () => {
  const group = schema.nodes.blockGroup.create(null, schema.nodeFromJSON(block('child', 'nested')))
  const host = document.createElement('div')
  host.append(DOMSerializer.fromSchema(schema).serializeNode(group))
  expect(host.firstElementChild?.getAttribute('data-node-type')).toBe('blockGroup')
  expect(host.textContent).toBe('nested')
  expect(DOMParser.fromSchema(schema).parseSlice(host).content.firstChild?.firstChild?.attrs.id).toBe('child')
  expect(() => schema.nodes.blockGroup.create().check()).toThrow()
})

