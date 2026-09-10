import {
  FormatColorFillRounded,
  FormatColorTextRounded,
} from '@mui/icons-material'
import { Divider, IconButton, Menu, MenuItem, Tooltip } from '@mui/material'
import { useState, type MouseEvent } from 'react'
import type { TiptapToolbarProps } from './types'

const COLORS = [
  { label: 'По умолчанию', value: 'default' },
  { label: 'Красный', value: '#d32f2f' },
  { label: 'Оранжевый', value: '#ed6c02' },
  { label: 'Зелёный', value: '#2e7d32' },
  { label: 'Синий', value: '#1976d2' },
  { label: 'Фиолетовый', value: '#7b1fa2' },
]

export function ColorStyleButton({ editor }: TiptapToolbarProps) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)

  const applyColor = (kind: 'textColor' | 'backgroundColor', color: string) => {
    const chain = editor.chain().focus()
    if (color === 'default') chain.unsetMark(kind).run()
    else chain.setMark(kind, { color }).run()
    setAnchorElement(null)
  }

  return (
    <>
      <Tooltip title="Цвет текста и фона" placement="top">
        <IconButton
          size="small"
          aria-label="Цвет текста и фона"
          aria-haspopup="menu"
          aria-expanded={Boolean(anchorElement)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event: MouseEvent<HTMLButtonElement>) => setAnchorElement(event.currentTarget)}
        >
          <FormatColorTextRounded />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={() => setAnchorElement(null)}
        aria-label="Выбор цвета"
      >
        <MenuItem disabled>Цвет текста</MenuItem>
        {COLORS.map((color) => (
          <MenuItem
            key={`text-${color.value}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyColor('textColor', color.value)}
          >
            <span className="tiptap-color-swatch" style={{ color: color.value }} />
            {color.label}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem disabled>Цвет фона</MenuItem>
        {COLORS.map((color) => (
          <MenuItem
            key={`background-${color.value}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyColor('backgroundColor', color.value)}
          >
            <FormatColorFillRounded
              fontSize="small"
              sx={{ mr: 1.5, color: color.value === 'default' ? 'text.secondary' : color.value }}
            />
            {color.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
