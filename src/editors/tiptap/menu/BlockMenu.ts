import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection, type EditorState } from '@tiptap/pm/state'
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view'
import { defaultBlockProps } from '../types'
import { filterBlockMenuItems } from './items'
import type { BlockMenuItem, BlockMenuState } from './types'

type BlockPosition = { pos: number; nodeSize: number; empty: boolean }
type BlockMenuMeta =
  | { kind: 'open'; triggerFrom: number; queryFrom: number; deleteTrigger: boolean }
  | { kind: 'close' }
  | { kind: 'select'; selectedIndex: number }

export const blockMenuKey = new PluginKey<BlockMenuState>('block-menu')

const closedState: BlockMenuState = {
  open: false,
  triggerFrom: 0,
  queryFrom: 0,
  query: '',
  selectedIndex: 0,
  deleteTrigger: false,
}

function findBlockById(state: EditorState, blockId: string): BlockPosition | null {
  let result: BlockPosition | null = null
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'blockContainer' && node.attrs.id === blockId) {
      result = {
        pos,
        nodeSize: node.nodeSize,
        empty: node.firstChild?.content.size === 0,
      }
      return false
    }
  })
  return result
}

function openMenuForBlock(view: EditorView, blockId: string) {
  if (!view.editable) return
  const block = findBlockById(view.state, blockId)
  if (!block) return
  view.focus()

  if (block.empty) {
    const cursor = block.pos + 2
    view.dispatch(
      view.state.tr
        .setSelection(TextSelection.near(view.state.doc.resolve(cursor)))
        .setMeta(blockMenuKey, {
          kind: 'open', triggerFrom: cursor, queryFrom: cursor, deleteTrigger: false,
        }),
    )
    return
  }

  const { schema } = view.state
  const paragraph = schema.nodes.paragraph.create()
  const container = schema.nodes.blockContainer.create(
    { ...defaultBlockProps, id: null },
    paragraph,
  )
  const insertAt = block.pos + block.nodeSize
  const transaction = view.state.tr.insert(insertAt, container)
  const cursor = insertAt + 2
  transaction
    .setSelection(TextSelection.near(transaction.doc.resolve(cursor)))
    .setMeta(blockMenuKey, {
      kind: 'open', triggerFrom: cursor, queryFrom: cursor, deleteTrigger: false,
    })
  view.dispatch(transaction.scrollIntoView())
}

function addBlockButton(view: EditorView, blockId: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'tiptap-add-block-button'
  button.title = 'Добавить блок'
  button.setAttribute('aria-label', 'Добавить блок')
  const icon = document.createElement('span')
  icon.className = 'tiptap-add-block-icon'
  icon.setAttribute('aria-hidden', 'true')
  button.append(icon)
  button.addEventListener('mousedown', (event) => {
    event.preventDefault()
    event.stopPropagation()
  })
  button.addEventListener('click', (event) => {
    event.stopPropagation()
    openMenuForBlock(view, blockId)
  })
  return button
}

function closeMenu(view: EditorView) {
  view.dispatch(view.state.tr.setMeta(blockMenuKey, { kind: 'close' }).setMeta('addToHistory', false))
}

export function executeBlockMenuItem(view: EditorView, item: BlockMenuItem) {
  const menu = blockMenuKey.getState(view.state)
  if (!menu?.open) return false

  const selectionTo = view.state.selection.to
  const transaction = view.state.tr.delete(menu.triggerFrom, selectionTo)
  const mappedCursor = transaction.mapping.map(menu.triggerFrom)
  const $cursor = transaction.doc.resolve(mappedCursor)
  let contentDepth = -1
  let containerDepth = -1
  for (let depth = $cursor.depth; depth > 0; depth -= 1) {
    if (contentDepth < 0 && $cursor.node(depth).type.isTextblock) contentDepth = depth
    if ($cursor.node(depth).type.name === 'blockContainer') {
      containerDepth = depth
      break
    }
  }
  if (contentDepth < 0 || containerDepth < 0) return false

  const contentPos = $cursor.before(contentDepth)
  const containerPos = $cursor.before(containerDepth)
  const container = transaction.doc.nodeAt(containerPos)
  const isHeading = item.type.startsWith('heading-')
  const nodeTypeName = isHeading ? 'heading' : item.type
  const contentType = view.state.schema.nodes[nodeTypeName]
  if (!contentType || !container) return false

  const contentNode = transaction.doc.nodeAt(contentPos)
  transaction.setNodeMarkup(contentPos, contentType, isHeading
    ? { level: Number(item.type.slice('heading-'.length)) }
    : item.type === 'checkListItem'
      ? { checked: false }
      : null)
  if (item.type === 'quote') {
    transaction.setNodeMarkup(containerPos, undefined, {
      ...container.attrs,
      textAlignment: 'left',
    })
  }
  if (!contentNode) return false

  transaction
    .setSelection(TextSelection.near(transaction.doc.resolve(mappedCursor)))
    .setMeta(blockMenuKey, { kind: 'close' })
  view.dispatch(transaction.scrollIntoView())
  view.focus()
  return true
}

export const BlockMenu = Extension.create({
  name: 'blockMenu',

  addProseMirrorPlugins() {
    return [new Plugin<BlockMenuState>({
      key: blockMenuKey,
      state: {
        init: () => closedState,
        apply(transaction, previous, _oldState, newState) {
          const meta = transaction.getMeta(blockMenuKey) as BlockMenuMeta | undefined
          if (meta?.kind === 'close') return closedState
          if (meta?.kind === 'open') {
            return {
              open: true,
              triggerFrom: meta.triggerFrom,
              queryFrom: meta.queryFrom,
              query: '',
              selectedIndex: 0,
              deleteTrigger: meta.deleteTrigger,
            }
          }
          if (!previous.open) return previous
          if (meta?.kind === 'select') return { ...previous, selectedIndex: meta.selectedIndex }
          if (
            transaction.getMeta('pointer')
            || transaction.getMeta('focus')
            || transaction.getMeta('blur')
          ) return closedState

          // Keep both anchors on the left side of text inserted at the query
          // boundary. The default positive association would move queryFrom
          // after every typed character and immediately invalidate `/`.
          const triggerFrom = transaction.mapping.map(previous.triggerFrom, -1)
          const queryFrom = transaction.mapping.map(previous.queryFrom, -1)
          const { selection } = newState
          if (!selection.empty || selection.from < queryFrom) return closedState
          if (!selection.$from.sameParent(newState.doc.resolve(queryFrom))) return closedState

          const query = newState.doc.textBetween(queryFrom, selection.from)
          if (previous.deleteTrigger && newState.doc.textBetween(triggerFrom, queryFrom) !== '/') {
            return closedState
          }
          return {
            ...previous,
            triggerFrom,
            queryFrom,
            query,
            selectedIndex: query === previous.query ? previous.selectedIndex : 0,
          }
        },
      },
      props: {
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
        decorations(state) {
          const decorations: Decoration[] = []
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'blockContainer') {
              decorations.push(Decoration.widget(
                pos + 1,
                (view) => addBlockButton(view, String(node.attrs.id)),
                { side: -2, key: `add-block-${String(node.attrs.id)}` },
              ))
            }
          })
          return DecorationSet.create(state.doc, decorations)
        },
      },
      view(view) {
        return {
          update(currentView) {
            const state = blockMenuKey.getState(currentView.state)
            if (state?.open) {
              currentView.dom.setAttribute('aria-expanded', 'true')
              currentView.dom.setAttribute('aria-controls', 'tiptap-block-menu')
              currentView.dom.setAttribute('aria-activedescendant', `tiptap-block-menu-item-${state.selectedIndex}`)
            } else {
              currentView.dom.removeAttribute('aria-expanded')
              currentView.dom.removeAttribute('aria-controls')
              currentView.dom.removeAttribute('aria-activedescendant')
            }
          },
          destroy() {
            view.dom.removeAttribute('aria-expanded')
            view.dom.removeAttribute('aria-controls')
            view.dom.removeAttribute('aria-activedescendant')
          },
        }
      },
    })]
  },
})
