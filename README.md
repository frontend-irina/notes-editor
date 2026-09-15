# Tiptap Block Editor

Блочный React-редактор на Tiptap с панелью форматирования, меню блоков,
drag-and-drop и встроенными кнопками отмены и повтора действий.

## Установка

```bash
npm install @frontend-irina/tiptap-block-editor
```

## Использование

```tsx
import { TiptapEditor, type Block } from '@frontend-irina/tiptap-block-editor'
import '@frontend-irina/tiptap-block-editor/style.css'

const initialBlocks: Block[] = [{
  id: 'welcome',
  type: 'paragraph',
  props: {
    backgroundColor: 'default',
    textColor: 'default',
    textAlignment: 'left',
  },
  content: [{ type: 'text', text: 'Начните писать...', styles: {} }],
  children: [],
}]

export function Editor() {
  return (
    <TiptapEditor
      initialBlocks={initialBlocks}
      onChange={(blocks) => console.log(blocks)}
    />
  )
}
```

`initialBlocks` используется при создании редактора. Актуальное содержимое
передаётся в `onChange`; сохранением на сервере или в `localStorage` управляет
приложение-потребитель. Если `initialBlocks` отсутствует или пуст, редактор
создаёт один пустой paragraph.

## Возможности

- блочная модель с UUID v7 и вложенными блоками;
- Paragraph, Heading уровней 1–6, Quote и элементы списков;
- форматирование текста, ссылки, цвета и выравнивание;
- меню добавления и преобразования блоков;
- drag-and-drop блоков;
- встроенные undo и redo;
- сериализация между публичной моделью `Block[]` и Tiptap.

## Локальная разработка

```bash
npm install
npm run dev
```

## Проверки

```bash
npm run lint
npm test
npm run test:types
npm run build
npm pack --dry-run
```

Документация в [`docs/`](docs/) использует BlockNote только как reference для
описания модели и ожидаемого поведения. BlockNote не входит в runtime или
зависимости пакета.
