import { expect, test } from 'vitest'
import { createEditorExtensions } from './editor-extensions'
import { schema } from '../../test/create-editor'

test('assembles a valid block schema and disables competing StarterKit nodes', () => {
  const extensions = createEditorExtensions()
  expect(new Set(extensions.map(({ name }) => name)).size).toBe(extensions.length)
  expect(extensions[0].options).toMatchObject({ document: false, blockquote: false, heading: false, paragraph: false })
  expect(extensions.find(({ name }) => name === 'blockBehavior')?.config.priority).toBe(1000)
  expect(schema.topNodeType.name).toBe('doc')
  expect(schema.nodes.blockquote).toBeUndefined()
  for (const name of ['paragraph', 'heading', 'quote', 'bulletListItem', 'numberedListItem', 'checkListItem']) {
    expect(schema.nodes[name].isTextblock).toBe(true)
  }
})

