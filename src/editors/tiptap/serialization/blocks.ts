import type { JSONContent } from '@tiptap/core'
import {
  defaultBlockProps,
  defaultHeadingProps,
  defaultQuoteProps,
  type Block,
  type CheckListItemBlock,
  type HeadingLevel,
  type TextAlignment,
} from '../types'
import { uuidV7 } from '../uuid'
import { inlineToTiptap, tiptapInlineToBlockNote } from './inline'

export function blockToTiptap(block: Block): JSONContent {
  const contentNodeType = block.type
  const attrs = block.type === 'quote'
    ? { ...defaultBlockProps, ...defaultQuoteProps, ...block.props, textAlignment: 'left', id: block.id || uuidV7() }
    : { ...defaultBlockProps, ...block.props, id: block.id || uuidV7() }
  const contentAttrs = block.type === 'heading'
    ? { level: block.props.level }
    : block.type === 'numberedListItem'
      ? { start: block.props.start ?? null }
      : block.type === 'checkListItem'
        ? { checked: block.props.checked }
        : undefined

  return {
    type: 'blockContainer',
    attrs,
    content: [
      { type: contentNodeType, attrs: contentAttrs, content: inlineToTiptap(block.content ?? []) },
      ...(block.children?.length
        ? [{ type: 'blockGroup', content: block.children.map(blockToTiptap) }]
        : []),
    ],
  }
}

export function tiptapBlockToBlockNote(node: JSONContent): Block {
  const paragraph = node.content?.find((child) => child.type === 'paragraph')
  const heading = node.content?.find((child) => child.type === 'heading')
  const quote = node.content?.find((child) => child.type === 'quote')
  const bulletListItem = node.content?.find((child) => child.type === 'bulletListItem')
  const numberedListItem = node.content?.find((child) => child.type === 'numberedListItem')
  const checkListItem = node.content?.find((child) => child.type === 'checkListItem')
  const childGroup = node.content?.find((child) => child.type === 'blockGroup')
  const blockContent = checkListItem
    ?? numberedListItem
    ?? bulletListItem
    ?? quote
    ?? heading
    ?? paragraph
  const common = {
    id: String(node.attrs?.id ?? uuidV7()),
    content: tiptapInlineToBlockNote(blockContent?.content),
    children: (childGroup?.content ?? []).map(tiptapBlockToBlockNote),
  }

  if (quote) {
    return {
      ...common,
      type: 'quote',
      props: {
        backgroundColor: String(node.attrs?.backgroundColor ?? 'default'),
        textColor: String(node.attrs?.textColor ?? 'default'),
      },
    }
  }

  if (heading) {
    const rawLevel = Number(heading.attrs?.level ?? defaultHeadingProps.level)
    const level = ([1, 2, 3, 4, 5, 6] as number[]).includes(rawLevel)
      ? rawLevel as HeadingLevel
      : defaultHeadingProps.level
    return {
      ...common,
      type: 'heading',
      props: {
        backgroundColor: String(node.attrs?.backgroundColor ?? 'default'),
        textColor: String(node.attrs?.textColor ?? 'default'),
        textAlignment: (node.attrs?.textAlignment ?? 'left') as TextAlignment,
        level,
      },
    }
  }

  const listProps = {
    backgroundColor: String(node.attrs?.backgroundColor ?? 'default'),
    textColor: String(node.attrs?.textColor ?? 'default'),
    textAlignment: (node.attrs?.textAlignment ?? 'left') as TextAlignment,
  }

  if (bulletListItem) {
    return { ...common, type: 'bulletListItem', props: listProps }
  }

  if (numberedListItem) {
    const rawStart = numberedListItem.attrs?.start
    return {
      ...common,
      type: 'numberedListItem',
      props: {
        ...listProps,
        ...(typeof rawStart === 'number' ? { start: rawStart } : {}),
      },
    }
  }

  if (checkListItem) {
    return {
      ...common,
      type: 'checkListItem',
      props: {
        ...listProps,
        checked: Boolean(checkListItem.attrs?.checked),
      } satisfies CheckListItemBlock['props'],
    }
  }

  return {
    ...common,
    type: 'paragraph',
    props: {
      backgroundColor: String(node.attrs?.backgroundColor ?? 'default'),
      textColor: String(node.attrs?.textColor ?? 'default'),
      textAlignment: (node.attrs?.textAlignment ?? 'left') as TextAlignment,
    },
  }
}
