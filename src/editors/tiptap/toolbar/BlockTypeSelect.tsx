import {
  FormatQuoteRounded,
  TextFieldsRounded,
  TitleRounded,
} from '@mui/icons-material'
import { Button, ListItemText, Menu, MenuItem } from '@mui/material'
import type { Editor } from '@tiptap/core'
import { useBlockTypeSelect } from './use-block-type-select'
import {
  getBlockTypeIcon,
  getBlockTypeLabel,
  HEADING_LEVELS,
  LIST_BLOCKS,
} from './blockTypes'
import type { SelectedBlockType } from './types'

type BlockTypeSelectProps = {
  editor: Editor
  selectedType: SelectedBlockType
}

export function BlockTypeSelect({ editor, selectedType }: BlockTypeSelectProps) {
  const { anchor, openMenu, closeMenu, setBlockType } = useBlockTypeSelect(editor, selectedType)

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
        onClick={openMenu}
      >
        {getBlockTypeLabel(selectedType)}
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={closeMenu}
        aria-label="Тип блока"
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
