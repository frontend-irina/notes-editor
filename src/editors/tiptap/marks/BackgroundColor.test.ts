// @vitest-environment jsdom
import { DOMParser, DOMSerializer } from '@tiptap/pm/model'
import { expect, test } from 'vitest'
import { schema } from '../../../test/create-editor'

test('renders and parses BackgroundColor without losing its value', () => {
  const type = schema.marks.backgroundColor
  expect(type.create().attrs.color).toBe('default')
  const host = document.createElement('div')
  host.append(DOMSerializer.fromSchema(schema).serializeNode(schema.text('color', [type.create({ color: 'red' })])))
  expect(host.querySelector('span')?.getAttribute('data-background-color')).toBe('red')
  expect(host.querySelector('span')?.style.getPropertyValue('background-color')).toBe('red')
  expect(DOMParser.fromSchema(schema).parseSlice(host).content.firstChild?.marks[0].attrs.color).toBe('red')
})

