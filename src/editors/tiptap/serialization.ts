import type { JSONContent } from '@tiptap/core'
import {
  defaultBlockProps,
  defaultHeadingProps,
  defaultQuoteProps,
  type Block,
  type HeadingLevel,
  type InlineContent,
  type StyledText,
  type TextAlignment,
  type TextStyles,
} from './types'
import { uuidV7 } from './uuid'

function inlineToTiptap(content: InlineContent[]): JSONContent[] {
  return content.flatMap((item) => {
    const segments = item.type === 'link' ? item.content : [item]
    return segments
      .filter(({ text }) => text.length > 0)
      .map(({ text, styles }) => {
        const marks: Array<{ type: string; attrs?: Record<string, unknown> }> = []
        for (const name of ['bold', 'italic', 'underline', 'strike', 'code'] as const) {
          if (styles[name]) marks.push({ type: name })
        }
        if (styles.textColor && styles.textColor !== 'default') {
          marks.push({ type: 'textColor', attrs: { color: styles.textColor } })
        }
        if (styles.backgroundColor && styles.backgroundColor !== 'default') {
          marks.push({ type: 'backgroundColor', attrs: { color: styles.backgroundColor } })
        }
        if (item.type === 'link') {
          marks.push({ type: 'link', attrs: { href: item.href } })
        }
        return { type: 'text', text, ...(marks.length ? { marks } : {}) }
      })
  })
}

export function blockToTiptap(block: Block): JSONContent {
  const contentNodeType = block.type
  const attrs = block.type === 'quote'
    ? { ...defaultBlockProps, ...defaultQuoteProps, ...block.props, textAlignment: 'left', id: block.id || uuidV7() }
    : { ...defaultBlockProps, ...block.props, id: block.id || uuidV7() }
  const contentAttrs = block.type === 'heading'
    ? { level: block.props.level }
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

function marksToStyles(marks: readonly JSONContent[] = []): TextStyles {
  const styles: TextStyles = {}
  for (const mark of marks) {
    if (['bold', 'italic', 'underline', 'strike', 'code'].includes(mark.type ?? '')) {
      styles[mark.type as keyof Pick<TextStyles, 'bold' | 'italic' | 'underline' | 'strike' | 'code'>] = true
    } else if (mark.type === 'textColor') {
      styles.textColor = mark.attrs?.color
    } else if (mark.type === 'backgroundColor') {
      styles.backgroundColor = mark.attrs?.color
    }
  }
  return styles
}

function tiptapInlineToBlockNote(nodes: readonly JSONContent[] = []): InlineContent[] {
  const result: InlineContent[] = []

  for (const node of nodes) {
    if (node.type !== 'text' || !node.text) continue

    const linkMark = node.marks?.find((mark) => mark.type === 'link')
    const text: StyledText = {
      type: 'text',
      text: node.text,
      styles: marksToStyles(node.marks),
    }

    if (linkMark) {
      const previous = result.at(-1)
      const href = String(linkMark.attrs?.href ?? '')
      if (previous?.type === 'link' && previous.href === href) previous.content.push(text)
      else result.push({ type: 'link', href, content: [text] })
    } else {
      const previous = result.at(-1)
      if (
        previous?.type === 'text'
        && JSON.stringify(previous.styles) === JSON.stringify(text.styles)
      ) {
        previous.text += text.text
      } else {
        result.push(text)
      }
    }
  }

  return result
}

export function tiptapBlockToBlockNote(node: JSONContent): Block {
  const paragraph = node.content?.find((child) => child.type === 'paragraph')
  const heading = node.content?.find((child) => child.type === 'heading')
  const quote = node.content?.find((child) => child.type === 'quote')
  const childGroup = node.content?.find((child) => child.type === 'blockGroup')
  const common = {
    id: String(node.attrs?.id ?? uuidV7()),
    content: tiptapInlineToBlockNote((quote ?? heading ?? paragraph)?.content),
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
