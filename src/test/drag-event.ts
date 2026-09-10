import { vi } from 'vitest'

// Only the transfer/coordinate contract is simulated; native drag is a browser check.
export function dragEvent(type = 'drop', target?: Element) {
  const data = new Map<string, string>()
  const transfer = {
    clearData: vi.fn(() => data.clear()),
    setData: vi.fn((key: string, value: string) => data.set(key, value)),
    getData: (key: string) => data.get(key) ?? '',
    setDragImage: vi.fn(), effectAllowed: 'none', dropEffect: 'none',
  }
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 10, clientY: 10 })
  Object.defineProperty(event, 'dataTransfer', { value: transfer })
  if (target) Object.defineProperty(event, 'target', { value: target })
  return { event: event as DragEvent, transfer }
}

