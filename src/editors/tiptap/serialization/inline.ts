import type { JSONContent } from '@tiptap/core'
import type { InlineContent, StyledText, TextStyles } from '../types'

export function inlineToTiptap(content: InlineContent[]): JSONContent[] {
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

export function tiptapInlineToBlockNote(nodes: readonly JSONContent[] = []): InlineContent[] {
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
