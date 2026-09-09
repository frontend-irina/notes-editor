import { IconButton, Tooltip } from '@mui/material'
import type { ReactNode } from 'react'

type ToolbarButtonProps = {
  label: string
  shortcut?: string
  icon: ReactNode
  selected?: boolean
  disabled?: boolean
  onClick: () => void
}

export function ToolbarButton({
  label,
  shortcut,
  icon,
  selected = false,
  disabled = false,
  onClick,
}: ToolbarButtonProps) {
  const title = shortcut ? `${label} · ${shortcut}` : label

  return (
    <Tooltip title={title} placement="top">
      <span>
        <IconButton
          size="small"
          color={selected ? 'primary' : 'default'}
          disabled={disabled}
          aria-label={label}
          aria-pressed={selected}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}
        >
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  )
}
