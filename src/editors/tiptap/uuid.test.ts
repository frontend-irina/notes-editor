import { expect, test, vi } from 'vitest'
import { uuidV7 } from './uuid'

test('encodes timestamp, version 7 and RFC variant', () => {
  vi.spyOn(Date, 'now').mockReturnValue(0x0123456789ab)
  const id = uuidV7()
  expect(id).toMatch(/^01234567-89ab-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
})

test('retains random entropy when the clock does not advance', () => {
  vi.spyOn(Date, 'now').mockReturnValue(123456)
  expect(new Set(Array.from({ length: 1000 }, uuidV7)).size).toBe(1000)
})
