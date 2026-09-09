import type { EditorProps } from '@tiptap/pm/view'
import { blockMenuKey } from './menu-state'
import { closeMenu, executeBlockMenuItem } from './menu-commands'
import { filterBlockMenuItems } from './items'

export const menuInput: EditorProps = {
  handleTextInput(view, from, _to, text) {
    if (text !== '/' || !view.editable || view.state.selection.$from.parent.type.spec.code) {
      return false
    }
    view.dispatch(
      view.state.tr
        .insertText('/', from)
        .setMeta(blockMenuKey, {
          kind: 'open', triggerFrom: from, queryFrom: from + 1, deleteTrigger: true,
        }),
    )
    return true
  },
  handleKeyDown(view, event) {
    const state = blockMenuKey.getState(view.state)
    if (!state?.open) return false
    const items = filterBlockMenuItems(state.query)

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(view)
      return true
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      if (!items.length) return true
      const delta = event.key === 'ArrowDown' ? 1 : -1
      const selectedIndex = (state.selectedIndex + delta + items.length) % items.length
      view.dispatch(view.state.tr.setMeta(blockMenuKey, { kind: 'select', selectedIndex }).setMeta('addToHistory', false))
      return true
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault()
      if (!items.length) return true
      const selectedIndex = event.key === 'PageUp' ? 0 : items.length - 1
      view.dispatch(view.state.tr.setMeta(blockMenuKey, { kind: 'select', selectedIndex }).setMeta('addToHistory', false))
      return true
    }
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault()
      event.stopPropagation()
      const item = items[state.selectedIndex]
      return item ? executeBlockMenuItem(view, item) : true
    }
    return false
  },
  handleClick(view) {
    if (!blockMenuKey.getState(view.state)?.open) return false
    closeMenu(view)
    return false
  },
  handleDOMEvents: {
    blur(view) {
      if (blockMenuKey.getState(view.state)?.open) closeMenu(view)
      return false
    },
  },
}
