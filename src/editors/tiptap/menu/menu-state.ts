import { PluginKey, type StateField } from '@tiptap/pm/state'
import type { BlockMenuState } from './types'

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

export const menuState: StateField<BlockMenuState> = {
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
}
