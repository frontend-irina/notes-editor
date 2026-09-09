import { afterEach, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  if (typeof localStorage !== 'undefined') localStorage.clear()
})
