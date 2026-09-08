export type TextAlignment = 'left' | 'center' | 'right' | 'justify'
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type TextStyles = Partial<{
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  code: boolean
  textColor: string
  backgroundColor: string
}>

export type StyledText = {
  type: 'text'
  text: string
  styles: TextStyles
}

export type Link = {
  type: 'link'
  href: string
  content: StyledText[]
}

export type InlineContent = StyledText | Link

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | BulletListItemBlock
  | NumberedListItemBlock
  | CheckListItemBlock

export type ParagraphBlock = {
  id: string
  type: 'paragraph'
  props: {
    backgroundColor: string
    textColor: string
    textAlignment: TextAlignment
  }
  content: InlineContent[]
  children: Block[]
}

export type HeadingBlock = {
  id: string
  type: 'heading'
  props: {
    backgroundColor: string
    textColor: string
    textAlignment: TextAlignment
    level: HeadingLevel
  }
  content: InlineContent[]
  children: Block[]
}

export type QuoteBlock = {
  id: string
  type: 'quote'
  props: {
    backgroundColor: string
    textColor: string
  }
  content: InlineContent[]
  children: Block[]
}

export type BulletListItemBlock = {
  id: string
  type: 'bulletListItem'
  props: ParagraphBlock['props']
  content: InlineContent[]
  children: Block[]
}

export type NumberedListItemBlock = {
  id: string
  type: 'numberedListItem'
  props: ParagraphBlock['props'] & { start?: number }
  content: InlineContent[]
  children: Block[]
}

export type CheckListItemBlock = {
  id: string
  type: 'checkListItem'
  props: ParagraphBlock['props'] & { checked: boolean }
  content: InlineContent[]
  children: Block[]
}

export const defaultBlockProps: ParagraphBlock['props'] = {
  backgroundColor: 'default',
  textColor: 'default',
  textAlignment: 'left',
}

export const defaultQuoteProps: QuoteBlock['props'] = {
  backgroundColor: 'default',
  textColor: 'default',
}

export const defaultHeadingProps: HeadingBlock['props'] = {
  ...defaultBlockProps,
  level: 1,
}
