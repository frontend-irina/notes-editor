import type { ResolvedPos } from '@tiptap/pm/model'

export function getBlockDepth($from: ResolvedPos) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'blockContainer') return depth
  }
  return -1
}
