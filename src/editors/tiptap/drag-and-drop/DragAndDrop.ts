import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import type { DropCursorState } from './types'
import { getActiveDrag, startDrag, endDrag } from './drag-session'
import { dropPosition, handleDrop } from './drop-handler'
import { moveSelection } from './move-selection'
import { dragDecorations } from './drag-decorations'

const dragAndDropKey = new PluginKey<DropCursorState>('block-drag-and-drop')

function clearDrag(view?: EditorView) {
  endDrag()
  view?.dispatch(view.state.tr.setMeta(dragAndDropKey, { pos: null }))
}

export const DragAndDrop = Extension.create({
  name: 'blockDragAndDrop',

  addKeyboardShortcuts() {
    return {
      'Shift-Mod-ArrowUp': () => moveSelection(this.editor.view, -1),
      'Shift-Mod-ArrowDown': () => moveSelection(this.editor.view, 1),
    }
  },

  addProseMirrorPlugins() {
    return [new Plugin<DropCursorState>({
      key: dragAndDropKey,
      state: {
        init: () => ({ pos: null }),
        apply: (transaction, previous) => transaction.getMeta(dragAndDropKey) ?? previous,
      },
      props: {
        decorations: (state) => dragDecorations(state, dragAndDropKey.getState(state)?.pos),
        handleDOMEvents: {
          dragstart(view, event) {
            const handle = (event.target as Element | null)?.closest<HTMLElement>('.tiptap-drag-handle')
            if (!handle?.dataset.blockId) return false
            startDrag(view, event, handle.dataset.blockId)
            return true
          },
          dragover(view, event) {
            if (!getActiveDrag() || !view.editable) return false
            const pos = dropPosition(view, event)
            view.dispatch(view.state.tr.setMeta(dragAndDropKey, { pos }))
            if (pos === null) return false
            event.preventDefault()
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
            return true
          },
          dragleave(view, event) {
            const relatedTarget = event.relatedTarget
            if (!(relatedTarget instanceof Node) || !view.dom.contains(relatedTarget)) {
              view.dispatch(view.state.tr.setMeta(dragAndDropKey, { pos: null }))
            }
            return false
          },
          drop: (view, event) => handleDrop(view, event, clearDrag),
          dragend(view) {
            clearDrag(view)
            return false
          },
          keydown(view, event) {
            if (event.key === 'Escape' && getActiveDrag()) clearDrag(view)
            return false
          },
        },
      },
      view: (view) => ({ destroy: () => clearDrag(view) }),
    })]
  },
})
