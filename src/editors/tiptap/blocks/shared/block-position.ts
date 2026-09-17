import type { Node as ProseMirrorNode, ResolvedPos } from '@tiptap/pm/model'

export function getBlockDepth($from: ResolvedPos) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'blockContainer') return depth
  }
  return -1
}

export function getBlockNestingDepth($from: ResolvedPos) {
  let nestingDepth = 0
  for (let depth = 0; depth <= $from.depth; depth += 1) {
    if ($from.node(depth).type.name === 'blockContainer') nestingDepth += 1
  }
  return nestingDepth
}

export function getNodeBlockDepth(node: ProseMirrorNode) {
  let maximum = 0
  const visit = (current: ProseMirrorNode, depth: number) => {
    const nextDepth = depth + (current.type.name === 'blockContainer' ? 1 : 0)
    maximum = Math.max(maximum, nextDepth)
    current.forEach(child => visit(child, nextDepth))
  }
  visit(node, 0)
  return maximum
}
