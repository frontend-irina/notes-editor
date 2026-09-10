import { Mark } from '@tiptap/core'

export const BackgroundColor = Mark.create({
  name: 'backgroundColor',
  addAttributes: () => ({ color: { default: 'default' } }),
  parseHTML: () => [{
    tag: 'span[data-background-color]',
    getAttrs: (element) => ({ color: (element as HTMLElement).dataset.backgroundColor }),
  }],
  renderHTML: ({ HTMLAttributes }) => [
    'span',
    {
      'data-background-color': HTMLAttributes.color,
      style: `background-color: ${HTMLAttributes.color}`,
    },
    0,
  ],
})
