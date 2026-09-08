import {
  FormatAlignCenterRounded,
  FormatAlignLeftRounded,
  FormatAlignRightRounded,
  FormatBoldRounded,
  FormatColorFillRounded,
  FormatColorTextRounded,
  FormatItalicRounded,
  FormatQuoteRounded,
  FormatUnderlinedRounded,
  LinkRounded,
  StrikethroughSRounded,
  TextFieldsRounded,
  TitleRounded,
} from '@mui/icons-material'
import {
  Button,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import type { Editor } from '@tiptap/core'
import { useEditorState } from '@tiptap/react'
import { useRef, useState, type MouseEvent, type ReactNode } from 'react'

type TiptapToolbarProps = {
  editor: Editor
}

type HeadingBlockType = `heading-${1 | 2 | 3 | 4 | 5 | 6}`
type SelectableBlockType = 'paragraph' | 'quote' | HeadingBlockType
type SelectedBlockType = SelectableBlockType | 'mixed' | null

type ToolbarButtonProps = {
  label: string
  shortcut?: string
  icon: ReactNode
  selected?: boolean
  disabled?: boolean
  onClick: () => void
}

const COLORS = [
  { label: 'По умолчанию', value: 'default' },
  { label: 'Красный', value: '#d32f2f' },
  { label: 'Оранжевый', value: '#ed6c02' },
  { label: 'Зелёный', value: '#2e7d32' },
  { label: 'Синий', value: '#1976d2' },
  { label: 'Фиолетовый', value: '#7b1fa2' },
]

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const

function selectableTypeFromNode(type: string, level?: unknown): SelectableBlockType | null {
  if (type === 'paragraph' || type === 'quote') return type
  if (type === 'heading' && HEADING_LEVELS.includes(level as typeof HEADING_LEVELS[number])) {
    return `heading-${level}` as HeadingBlockType
  }
  return null
}

function getSelectedBlockType(editor: Editor): SelectedBlockType {
  const { doc, selection } = editor.state
  const selectedTypes = new Set<SelectableBlockType>()

  for (let depth = selection.$from.depth; depth > 0; depth -= 1) {
    const node = selection.$from.node(depth)
    const type = selectableTypeFromNode(node.type.name, node.attrs.level)
    if (type) selectedTypes.add(type)
  }

  doc.nodesBetween(selection.from, selection.to, (node) => {
    const type = selectableTypeFromNode(node.type.name, node.attrs.level)
    if (type) selectedTypes.add(type)
  })

  if (selectedTypes.size === 0) return null
  if (selectedTypes.size > 1) return 'mixed'
  return [...selectedTypes][0]
}

function ToolbarButton({
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

function ColorStyleButton({ editor }: TiptapToolbarProps) {
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
        disablePortal
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

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
  const [blockTypeAnchor, setBlockTypeAnchor] = useState<HTMLElement | null>(null)
  const blockTypeSelection = useRef<{ from: number; to: number } | null>(null)
  const state = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor.isActive('bold'),
      italic: currentEditor.isActive('italic'),
      underline: currentEditor.isActive('underline'),
      strike: currentEditor.isActive('strike'),
      left: currentEditor.isActive('blockContainer', { textAlignment: 'left' }),
      center: currentEditor.isActive('blockContainer', { textAlignment: 'center' }),
      right: currentEditor.isActive('blockContainer', { textAlignment: 'right' }),
      link: currentEditor.isActive('link'),
      blockType: getSelectedBlockType(currentEditor),
    }),
  })

  const setAlignment = (textAlignment: 'left' | 'center' | 'right') => {
    editor.chain().focus().updateAttributes('blockContainer', { textAlignment }).run()
  }

  const editLink = () => {
    const currentHref = String(editor.getAttributes('link').href ?? '')
    const href = window.prompt('Адрес ссылки', currentHref)
    if (href === null) return
    if (href.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  const setBlockType = (type: SelectableBlockType) => {
    if (state.blockType === type) {
      setBlockTypeAnchor(null)
      return
    }

    const chain = editor.chain().focus()
    if (blockTypeSelection.current) chain.setTextSelection(blockTypeSelection.current)
    if (type.startsWith('heading-')) {
      chain.setNode('heading', { level: Number(type.slice('heading-'.length)) })
    } else {
      chain.setNode(type)
    }
    if (type === 'quote') chain.updateAttributes('blockContainer', { textAlignment: 'left' })
    chain.run()
    setBlockTypeAnchor(null)
  }

  return (
    <div className="tiptap-toolbar" role="toolbar" aria-label="Форматирование текста">
      <Button
        size="small"
        color="inherit"
        startIcon={state.blockType === 'quote'
          ? <FormatQuoteRounded />
          : state.blockType?.startsWith('heading-')
            ? <TitleRounded />
            : <TextFieldsRounded />}
        aria-label={`Тип блока: ${
          state.blockType === 'quote'
            ? 'цитата'
            : state.blockType?.startsWith('heading-')
              ? `заголовок ${state.blockType.slice('heading-'.length)}`
            : state.blockType === 'mixed'
              ? 'несколько типов'
              : 'параграф'
        }`}
        aria-haspopup="menu"
        aria-expanded={Boolean(blockTypeAnchor)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          blockTypeSelection.current = {
            from: editor.state.selection.from,
            to: editor.state.selection.to,
          }
          setBlockTypeAnchor(event.currentTarget)
        }}
      >
        {state.blockType === 'quote'
          ? 'Цитата'
          : state.blockType?.startsWith('heading-')
            ? `Заголовок ${state.blockType.slice('heading-'.length)}`
          : state.blockType === 'mixed'
            ? 'Несколько типов'
            : 'Параграф'}
      </Button>
      <Menu
        anchorEl={blockTypeAnchor}
        open={Boolean(blockTypeAnchor)}
        onClose={() => setBlockTypeAnchor(null)}
        aria-label="Тип блока"
        disablePortal
      >
        <MenuItem
          selected={state.blockType === 'paragraph'}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setBlockType('paragraph')}
        >
          <TextFieldsRounded fontSize="small" sx={{ mr: 1.5 }} />
          Параграф
        </MenuItem>
        {HEADING_LEVELS.map((level) => (
          <MenuItem
            key={`heading-${level}`}
            selected={state.blockType === `heading-${level}`}
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
          selected={state.blockType === 'quote'}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setBlockType('quote')}
        >
          <FormatQuoteRounded fontSize="small" sx={{ mr: 1.5 }} />
          Цитата
        </MenuItem>
      </Menu>
      <Divider orientation="vertical" flexItem />
      <ToolbarButton
        label="Полужирный"
        shortcut="Mod+B"
        icon={<FormatBoldRounded />}
        selected={state.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="Курсив"
        shortcut="Mod+I"
        icon={<FormatItalicRounded />}
        selected={state.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="Подчёркивание"
        shortcut="Mod+U"
        icon={<FormatUnderlinedRounded />}
        selected={state.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      />
      <ToolbarButton
        label="Зачёркивание"
        shortcut="Mod+Shift+S"
        icon={<StrikethroughSRounded />}
        selected={state.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <Divider orientation="vertical" flexItem />
      {state.blockType !== 'quote' && (
        <>
          <ToolbarButton
            label="Выровнять слева"
            icon={<FormatAlignLeftRounded />}
            selected={state.left}
            onClick={() => setAlignment('left')}
          />
          <ToolbarButton
            label="Выровнять по центру"
            icon={<FormatAlignCenterRounded />}
            selected={state.center}
            onClick={() => setAlignment('center')}
          />
          <ToolbarButton
            label="Выровнять справа"
            icon={<FormatAlignRightRounded />}
            selected={state.right}
            onClick={() => setAlignment('right')}
          />
          <Divider orientation="vertical" flexItem />
        </>
      )}
      <ColorStyleButton editor={editor} />
      <ToolbarButton
        label={state.link ? 'Изменить ссылку' : 'Создать ссылку'}
        shortcut="Mod+K"
        icon={<LinkRounded />}
        selected={state.link}
        onClick={editLink}
      />
    </div>
  )
}
