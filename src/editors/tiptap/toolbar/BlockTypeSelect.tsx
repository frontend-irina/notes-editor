import {
  FormatQuoteRounded,
  TextFieldsRounded,
  TitleRounded,
} from '@mui/icons-material'
import { Button, ListItemText, Menu, MenuItem } from '@mui/material'
import type { Editor } from '@tiptap/core'
import { useRef, useState, type MouseEvent } from 'react'
import {
  getBlockTypeIcon,
  getBlockTypeLabel,
  HEADING_LEVELS,
  LIST_BLOCKS,
} from './blockTypes'
import type { SelectableBlockType, SelectedBlockType } from './types'

type BlockTypeSelectProps = {
  editor: Editor
  selectedType: SelectedBlockType
}

export function BlockTypeSelect({ editor, selectedType }: BlockTypeSelectProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const selection = useRef<{ from: number; to: number } | null>(null)

  const setBlockType = (type: SelectableBlockType) => {
    if (selectedType === type) {
      setAnchor(null)
      return
    }

    const chain = editor.chain().focus()
    if (selection.current) chain.setTextSelection(selection.current)
    if (type.startsWith('heading-')) {
      chain.setNode('heading', { level: Number(type.slice('heading-'.length)) })
    } else {
      chain.setNode(type)
    }
    if (type === 'quote') chain.updateAttributes('blockContainer', { textAlignment: 'left' })
    chain.run()
    setAnchor(null)
  }

  return (
    <>
      <Button
        size="small"
        color="inherit"
        startIcon={getBlockTypeIcon(selectedType)}
        aria-label={`Тип блока: ${getBlockTypeLabel(selectedType)}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          selection.current = {
            from: editor.state.selection.from,
            to: editor.state.selection.to,
          }
          setAnchor(event.currentTarget)
        }}
      >
        {getBlockTypeLabel(selectedType)}
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        aria-label="Тип блока"
        disablePortal
      >
        <MenuItem
          selected={selectedType === 'paragraph'}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setBlockType('paragraph')}
        >
          <TextFieldsRounded fontSize="small" sx={{ mr: 1.5 }} />
          Параграф
        </MenuItem>
        {HEADING_LEVELS.map((level) => (
          <MenuItem
            key={`heading-${level}`}
            selected={selectedType === `heading-${level}`}
            aria-label={`Заголовок ${level}, Mod+Alt+${level}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setBlockType(`heading-${level}`)}
          >
            <TitleRounded fontSize="small" sx={{ mr: 1.5 }} />
            <ListItemText
              primary={`Заголовок ${level}`}
              secondary={`Mod+Alt+${level}`}
              slotProps={{ secondary: { component: 'span' } }}
            />
          </MenuItem>
        ))}
        <MenuItem
          selected={selectedType === 'quote'}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setBlockType('quote')}
        >
          <FormatQuoteRounded fontSize="small" sx={{ mr: 1.5 }} />
          Цитата
        </MenuItem>
        {LIST_BLOCKS.map((item) => (
          <MenuItem
            key={item.type}
            selected={selectedType === item.type}
            aria-label={`${item.label}, ${item.shortcut}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setBlockType(item.type)}
          >
            <span className="tiptap-block-type-icon">{item.icon}</span>
            <ListItemText
              primary={item.label}
              secondary={item.shortcut}
              slotProps={{ secondary: { component: 'span' } }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
