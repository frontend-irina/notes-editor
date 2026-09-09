import { TextSelection, type EditorState } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { defaultBlockProps } from '../types'
import { blockMenuKey } from './menu-state'
import type { BlockMenuItem } from './types'

type BlockPosition = { pos: number; nodeSize: number; empty: boolean }

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

export function openMenuForBlock(view: EditorView, blockId: string) {
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

export function closeMenu(view: EditorView) {
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
