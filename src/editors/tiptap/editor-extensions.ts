import StarterKit from '@tiptap/starter-kit'
import { Heading } from './blocks/heading'
import { Paragraph } from './blocks/paragraph'
import { Quote } from './blocks/quote'
import { BulletListItem, CheckListItem, NumberedListItem } from './blocks/list-types'
import { DragAndDrop } from './drag-and-drop'
import { BlockMenu } from './menu/BlockMenu'
import { BlockDocument } from './schema/BlockDocument'
import { BlockGroup } from './schema/BlockGroup'
import { BlockContainer } from './schema/BlockContainer'
import { BlockIds } from './extensions/BlockIds'
import { BlockBehavior } from './extensions/BlockBehavior'
import { TextColor } from './marks/TextColor'
import { BackgroundColor } from './marks/BackgroundColor'

export function createEditorExtensions() {
  return [
    StarterKit.configure({
      document: false,
      blockquote: false,
      heading: false,
      paragraph: false,
    }),
    BlockDocument,
    BlockGroup,
    BlockContainer,
    Paragraph,
    Heading,
    Quote,
    BulletListItem,
    NumberedListItem,
    CheckListItem,
    BlockIds,
    BlockBehavior,
    DragAndDrop,
    BlockMenu,
    TextColor,
    BackgroundColor,
  ]
}
