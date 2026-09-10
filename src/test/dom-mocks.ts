import { afterEach, beforeEach, vi } from 'vitest'

const originals = new Map<string, PropertyDescriptor | undefined>()

beforeEach(() => {
  // jsdom has no layout: only geometry-dependent handlers use these stable rectangles.
  for (const [key, value] of Object.entries({
    getClientRects: () => [],
    getBoundingClientRect: () => new DOMRect(0, 0, 100, 20),
  })) {
    originals.set(key, Object.getOwnPropertyDescriptor(Range.prototype, key))
    Object.defineProperty(Range.prototype, key, { configurable: true, value })
  }
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 20))
  vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
})

afterEach(() => {
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(Range.prototype, key, descriptor)
    else Reflect.deleteProperty(Range.prototype, key)
  }
  originals.clear()
})
