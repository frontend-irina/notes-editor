// @vitest-environment jsdom
import { expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../test/react'
import { ToolbarButton } from './ToolbarButton'

test('exposes active/disabled state, prevents selection and dispatches clicks', () => {
  const onClick = vi.fn()
  const { rerender } = render(<ToolbarButton label="Bold" icon={<span>B</span>} selected onClick={onClick} />)
  const button = screen.getByRole('button', { name: 'Bold' })
  expect(button).toHaveAttribute('aria-pressed', 'true')
  expect(fireEvent.mouseDown(button)).toBe(false)
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalledOnce()
  rerender(<ToolbarButton label="Bold" icon={<span>B</span>} disabled onClick={onClick} />)
  expect(button).toBeDisabled()
  fireEvent.click(button)
  expect(onClick).toHaveBeenCalledOnce()
})

