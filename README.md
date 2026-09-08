# Notes Editor

Экспериментальный блочный редактор на React, в котором поведение
[BlockNote](https://www.blocknotejs.org/) воспроизводится поверх
[Tiptap](https://tiptap.dev/). Оба редактора доступны на одной странице, поэтому
их поведение можно сравнивать напрямую.

> Проект находится в разработке. Backend пока не используется: документы
> сохраняются локально в браузере.

## Возможности

- переключение между эталонным BlockNote и собственной реализацией на Tiptap;
- независимое автосохранение содержимого каждого редактора в `localStorage`;
- блочная модель с уникальными UUID v7 и вложенными блоками;
- блоки Paragraph, Heading уровней 1–6 и Quote;
- выбор типа блока через toolbar;
- полужирный, курсивный, подчёркнутый и зачёркнутый текст;
- ссылки, цвет текста и цвет фона;
- выравнивание текста по левому краю, центру и правому краю;
- отмена и повтор действий для Tiptap;
- сериализация между публичной блочной моделью и внутренним документом Tiptap.

## Технологии

- React 19 и TypeScript 6;
- Vite 8;
- Tiptap 3 и ProseMirror;
- BlockNote 0.54;
- Material UI и Mantine;
- Oxlint.

## Запуск проекта

Требуется актуальная LTS-версия Node.js и npm.

```bash
git clone git@github.com:frontend-irina/notes-editor.git
cd notes-editor
npm install
npm run dev
```

После запуска откройте адрес, указанный Vite в терминале (обычно
`http://localhost:5173`).

## Команды

```bash
npm run dev      # локальная разработка
npm run build    # проверка TypeScript и production-сборка
npm run lint     # статический анализ
npm run preview  # просмотр production-сборки
```

## Хранение данных

На текущем этапе серверной части нет. Редакторы используют разные ключи
`localStorage`:

| Редактор | Ключ |
| --- | --- |
| BlockNote | `editor-playground:blocknote` |
| Tiptap | `editor-playground:tiptap-blocks` |

Tiptap сохраняет публичный массив блоков, а не внутренний JSON ProseMirror.
Очистка данных сайта в браузере удалит сохранённые документы.

## Структура

```text
src/
├── App.tsx                       # вкладки редакторов и undo/redo
└── editors/
    ├── BlockNoteEditor.tsx       # эталонный редактор
    └── tiptap/
        ├── TiptapEditor.tsx      # React-интеграция Tiptap
        ├── TiptapToolbar.tsx     # панель форматирования
        ├── blocks/               # реализации типов блоков
        ├── extensions.ts         # схема и поведение ProseMirror
        ├── serialization.ts      # публичная модель ↔ Tiptap JSON
        └── storage.ts            # работа с localStorage

docs/
├── architecture/project.md       # архитектура и соглашения проекта
└── editor/                       # спецификации поведения редактора
```

## Документация

- [Архитектура и Code Style](docs/architecture/project.md)
- [Toolbar](docs/editor/toolbar.md)
- [Paragraph](docs/editor/blocks/paragraph/paragraph.md)
- [Heading](docs/editor/blocks/heading/heading.md)
- [Quote](docs/editor/blocks/quote/quote.md)
- [List types](docs/editor/blocks/list-types/list-types.md)
- [Markdown](docs/editor/markdown.md)
- [HTML](docs/editor/html.md)

## Проверка изменений

Перед публикацией изменений выполните:

```bash
npm run lint
npm run build
```

Для изменений поведения редактора также проверьте вручную редактирование,
сохранение после перезагрузки страницы и undo/redo в обоих режимах.
