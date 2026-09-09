import { LinkRounded } from '@mui/icons-material'
import { ToolbarButton } from './ToolbarButton'
import type { TiptapToolbarProps } from './types'

type LinkButtonProps = TiptapToolbarProps & { selected: boolean }

export function LinkButton({ editor, selected }: LinkButtonProps) {
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

  return (
    <ToolbarButton
      label={selected ? 'Изменить ссылку' : 'Создать ссылку'}
      shortcut="Mod+K"
      icon={<LinkRounded />}
      selected={selected}
      onClick={editLink}
    />
  )
}
