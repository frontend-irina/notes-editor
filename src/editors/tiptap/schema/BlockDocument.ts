import { Node } from '@tiptap/core'

export const BlockDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: 'blockContainer+',
})
