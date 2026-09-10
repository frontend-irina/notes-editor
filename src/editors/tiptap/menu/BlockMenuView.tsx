import { ListItemText, MenuItem, MenuList, Paper, Portal, Typography } from '@mui/material'
import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { blockMenuKey } from './menu-state'
import { executeBlockMenuItem } from './menu-commands'
import { filterBlockMenuItems } from './items'
import './menu.css'

type BlockMenuViewProps = { editor: Editor }

export function BlockMenuView({ editor }: BlockMenuViewProps) {
  const menu = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => blockMenuKey.getState(currentEditor.state),
  })

  if (!menu?.open) return null

  const items = filterBlockMenuItems(menu.query)
  const coordinates = editor.view.coordsAtPos(menu.queryFrom)
  const top = Math.min(coordinates.bottom + 8, window.innerHeight - 220)
  const left = Math.max(12, Math.min(coordinates.left, window.innerWidth - 352))

  return (
    <Portal>
      <Paper
        id="tiptap-block-menu"
        className="tiptap-block-menu"
        style={{ top, left, maxHeight: window.innerHeight - top - 12 }}
        elevation={8}
      >
        <MenuList dense aria-label="Добавление блока">
          {items.map((item, index) => {
            const groupChanged = index === 0 || items[index - 1].group !== item.group
            return (
              <div key={item.type}>
                {groupChanged && (
                  <Typography className="tiptap-block-menu-group" variant="caption">
                    {item.group}
                  </Typography>
                )}
                <MenuItem
                  id={`tiptap-block-menu-item-${index}`}
                  selected={index === menu.selectedIndex}
                  aria-selected={index === menu.selectedIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => executeBlockMenuItem(editor.view, item)}
                >
                  <ListItemText primary={item.title} secondary={item.subtext} />
                  {item.badge && <span className="tiptap-block-menu-badge">{item.badge}</span>}
                </MenuItem>
              </div>
            )
          })}
          {!items.length && (
            <MenuItem disabled>Команды не найдены</MenuItem>
          )}
        </MenuList>
      </Paper>
    </Portal>
  )
}
