import { expect, test } from 'vitest'
import { schema } from '../../../test/create-editor'
import { block, doc } from '../../../test/fixtures'

test('requires containers at the root and at least one block', () => {
  expect(() => schema.nodeFromJSON(doc(block())).check()).not.toThrow()
  expect(() => schema.nodeFromJSON(doc()).check()).toThrow()
  expect(() => schema.nodeFromJSON(doc({ type: 'paragraph' })).check()).toThrow()
})

