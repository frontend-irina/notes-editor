import type { JSONContent } from '@tiptap/core'

export function block(id = 'a', text = '', type = 'paragraph', children: JSONContent[] = []): JSONContent {
  return {
    type: 'blockContainer', attrs: { id },
    content: [
      { type, content: text ? [{ type: 'text', text }] : [] },
      ...(children.length ? [{ type: 'blockGroup', content: children }] : []),
    ],
  }
}

export function doc(...content: JSONContent[]): JSONContent {
  return { type: 'doc', content }
}
