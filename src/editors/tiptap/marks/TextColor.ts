import { Mark } from '@tiptap/core'

export const TextColor = Mark.create({
  name: 'textColor',
  addAttributes: () => ({ color: { default: 'default' } }),
  parseHTML: () => [{
    tag: 'span[data-text-color]',
    getAttrs: (element) => ({ color: (element as HTMLElement).dataset.textColor }),
  }],
  renderHTML: ({ HTMLAttributes }) => [
    'span',
    { 'data-text-color': HTMLAttributes.color, style: `color: ${HTMLAttributes.color}` },
    0,
  ],
})
