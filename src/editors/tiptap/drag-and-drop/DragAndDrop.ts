import { Extension } from '@tiptap/core'
import { DOMSerializer, type Node as ProseMirrorNode, Slice } from '@tiptap/pm/model'
import { Plugin, PluginKey, Selection } from '@tiptap/pm/state'
import { dropPoint } from '@tiptap/pm/transform'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'

type BlockRange = {
  from: number
  to: number
  node: ProseMirrorNode
}

type ActiveDrag = BlockRange & {
  source: EditorView
  slice: Slice
  preview: HTMLElement | null
}

type DropCursorState = { pos: number | null }

const dragAndDropKey = new PluginKey<DropCursorState>('block-drag-and-drop')
const internalMimeType = 'blocknote/html'
let activeDrag: ActiveDrag | null = null

function blockRangeAtPosition(doc: ProseMirrorNode, position: number): BlockRange | null {
  let result: BlockRange | null = null

  doc.descendants((node, pos) => {
    if (node.type.name !== 'blockContainer') return
    const to = pos + node.nodeSize
    if (pos <= position && position <= to) result = { from: pos, to, node }
  })

  return result
}

function selectedBlockRange(view: EditorView, dragged: BlockRange): BlockRange {
  const { doc, selection } = view.state
  const draggedBlockIsSelected = selection.from < dragged.to && selection.to > dragged.from
  if (selection.empty || !draggedBlockIsSelected) {
    return dragged
  }

  const $from = doc.resolve(selection.from)
  const $to = doc.resolve(selection.to)
  let sharedGroupDepth = 0
  const sharedDepth = Math.min($from.depth, $to.depth)
  for (let depth = 0; depth <= sharedDepth; depth += 1) {
    if ($from.node(depth) !== $to.node(depth)) break
    if (depth === 0 || $from.node(depth).type.name === 'blockGroup') sharedGroupDepth = depth
  }

  const blockDepth = sharedGroupDepth + 1
  if (blockDepth > $from.depth || blockDepth > $to.depth) return dragged
  const firstNode = $from.node(blockDepth)
  const lastNode = $to.node(blockDepth)
  if (firstNode.type.name !== 'blockContainer' || lastNode.type.name !== 'blockContainer') return dragged

  const firstFrom = $from.before(blockDepth)
  const lastFrom = $to.before(blockDepth)
  const from = Math.min(firstFrom, lastFrom)
  const to = Math.max(firstFrom + firstNode.nodeSize, lastFrom + lastNode.nodeSize)
  if (firstFrom === lastFrom) return dragged
  if (dragged.from < from || dragged.to > to) {
    return dragged
  }

  return {
    from,
    to,
    node: dragged.node,
  }
}

function createPreview(view: EditorView, range: BlockRange) {
  const wrapper = document.createElement('div')
  wrapper.className = 'tiptap-block-drag-preview'
  const serializer = DOMSerializer.fromSchema(view.state.schema)
  wrapper.appendChild(serializer.serializeFragment(view.state.doc.slice(range.from, range.to).content))
  wrapper.querySelectorAll('iframe, embed, object').forEach((element) => element.remove())
  document.body.appendChild(wrapper)
  return wrapper
}

function serializeRange(view: EditorView, range: BlockRange) {
  const wrapper = document.createElement('div')
  const serializer = DOMSerializer.fromSchema(view.state.schema)
  wrapper.appendChild(serializer.serializeFragment(view.state.doc.slice(range.from, range.to).content))
  return { html: wrapper.innerHTML, text: wrapper.textContent ?? '' }
}

function clearDrag(view?: EditorView) {
  activeDrag?.preview?.remove()
  activeDrag = null
  view?.dispatch(view.state.tr.setMeta(dragAndDropKey, { pos: null }))
}

function startDrag(view: EditorView, event: DragEvent, blockId: string) {
  if (!event.dataTransfer || !view.editable) return

  let dragged: BlockRange | null = null
  view.state.doc.descendants((node, pos) => {
    if (node.type.name === 'blockContainer' && node.attrs.id === blockId) {
      dragged = { from: pos, to: pos + node.nodeSize, node }
      return false
    }
  })
  if (!dragged) return

  const range = selectedBlockRange(view, dragged)
  const slice = view.state.doc.slice(range.from, range.to)
  const preview = createPreview(view, range)
  const serialized = serializeRange(view, range)

  activeDrag = { ...range, source: view, slice, preview }
  event.dataTransfer.clearData()
  event.dataTransfer.setData(internalMimeType, serialized.html)
  event.dataTransfer.setData('text/html', serialized.html)
  event.dataTransfer.setData('text/plain', serialized.text)
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setDragImage(preview, 0, 0)
}

function dropPosition(view: EditorView, event: DragEvent) {
  if (!activeDrag) return null
  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
  if (!coordinates) return null
  return dropPoint(view.state.doc, coordinates.pos, activeDrag.slice)
}

function moveSelection(view: EditorView, direction: -1 | 1) {
  const { doc, selection } = view.state
  const current = blockRangeAtPosition(doc, selection.from)
  if (!current) return false

  const $from = doc.resolve(current.from)
  const parent = $from.parent
  const index = $from.index()
  const siblingIndex = index + direction
  if (siblingIndex < 0 || siblingIndex >= parent.childCount) return false

  let siblingFrom = $from.start()
  for (let currentIndex = 0; currentIndex < siblingIndex; currentIndex += 1) {
    siblingFrom += parent.child(currentIndex).nodeSize
  }
  const target = direction < 0 ? siblingFrom : siblingFrom + parent.child(siblingIndex).nodeSize
  const slice = doc.slice(current.from, current.to)
  const transaction = view.state.tr.delete(current.from, current.to)
  const mappedTarget = transaction.mapping.map(target)
  transaction.replaceRange(mappedTarget, mappedTarget, slice)
  view.dispatch(transaction.scrollIntoView())
  return true
}

function dragHandle(blockId: string) {
  const handle = document.createElement('button')
  handle.type = 'button'
  handle.className = 'tiptap-drag-handle'
  handle.draggable = true
  handle.dataset.blockId = blockId
  handle.title = 'Перетащить блок'
  handle.setAttribute('aria-label', 'Перетащить блок')
  handle.textContent = '⋮⋮'
  return handle
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
        decorations(state) {
          const decorations: Decoration[] = []
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'blockContainer') {
              decorations.push(Decoration.widget(
                pos + 1,
                () => dragHandle(String(node.attrs.id)),
                { side: -1, key: `drag-handle-${String(node.attrs.id)}` },
              ))
            }
          })
          const cursor = dragAndDropKey.getState(state)?.pos
          if (typeof cursor === 'number') {
            decorations.push(Decoration.widget(cursor, () => {
              const element = document.createElement('div')
              element.className = 'tiptap-drop-cursor'
              return element
            }, { side: -1, key: 'block-drop-cursor' }))
          }
          return DecorationSet.create(state.doc, decorations)
        },
        handleDOMEvents: {
          dragstart(view, event) {
            const handle = (event.target as Element | null)?.closest<HTMLElement>('.tiptap-drag-handle')
            if (!handle?.dataset.blockId) return false
            startDrag(view, event, handle.dataset.blockId)
            return true
          },
          dragover(view, event) {
            if (!activeDrag || !view.editable) return false
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
          drop(view, event) {
            if (!activeDrag || !view.editable) return false
            const target = dropPosition(view, event)
            if (target === null) return false
            event.preventDefault()

            const drag = activeDrag
            if (drag.source === view) {
              if (target >= drag.from && target <= drag.to) {
                clearDrag(view)
                return true
              }
              const transaction = view.state.tr.delete(drag.from, drag.to)
              const mappedTarget = transaction.mapping.map(target)
              transaction.replaceRange(mappedTarget, mappedTarget, drag.slice)
              transaction.setSelection(Selection.near(transaction.doc.resolve(mappedTarget), 1))
              view.dispatch(transaction.scrollIntoView())
            } else {
              const transaction = view.state.tr.replaceRange(target, target, drag.slice)
              transaction.setSelection(Selection.near(transaction.doc.resolve(target), 1))
              view.dispatch(transaction.scrollIntoView())
              drag.source.dispatch(drag.source.state.tr.delete(drag.from, drag.to))
            }
            clearDrag(view)
            return true
          },
          dragend(view) {
            clearDrag(view)
            return false
          },
          keydown(view, event) {
            if (event.key === 'Escape' && activeDrag) clearDrag(view)
            return false
          },
        },
      },
      view: (view) => ({ destroy: () => clearDrag(view) }),
    })]
  },
})
