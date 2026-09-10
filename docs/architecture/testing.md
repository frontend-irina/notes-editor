# Тестирование редактора

Тесты находятся рядом с модулями: `имя.test.ts` для TypeScript и `имя.test.tsx` для JSX. Общие fixtures размещены в `src/test`. Новая логика требует содержательных assertions результата и граничных случаев; проверка одного импорта не считается покрытием модуля.

## Запуск

```bash
npm test
npm run test:watch
npm run test:types
npm run test:coverage
npm run lint
npm run build
```

Один модуль: `npm test -- src/editors/tiptap/serialization/inline.test.ts`.
Проверка типов запускается отдельно: Vitest преобразует TypeScript, но не заменяет TypeScript compiler. Тесты исключены из app tsconfig и включены в test tsconfig.

## Окружения и изоляция

- По умолчанию Node. DOM и React-тесты объявляют `// @vitest-environment jsdom`.
- `fixtures.ts` создаёт блочные JSON-документы; `create-editor.ts` создаёт настоящую schema, EditorState и отдельные Tiptap Editor. Редакторы уничтожаются после каждого теста вместе с DOM-host и общей drag session.
- `setup.ts` восстанавливает mocks, globals, timers и очищает localStorage. `react.ts` подключает jest-dom и React cleanup. `dom-mocks.ts` задаёт предсказуемую геометрию Range/HTMLElement и заглушку scrollBy: это заменяет отсутствующий layout, а не проверяет его.
- `drag-event.ts` моделирует только DataTransfer и координаты. Проверки Slice, transactions, документов и history используют настоящие ProseMirror API.
- BlockNote-тесты подменяют сторонние useCreateBlockNote/BlockNoteView и проверяют наш storage-адаптер. В интеграции Tiptap подменён только BubbleMenu из внешнего пакета: отдельно проверяется переданный shouldShow, а внутренние editor, menu, toolbar и persistence остаются настоящими.
- Composition guard проверяется прямым вызовом обработчика: синтетический isComposing на одном KeyboardEvent не создаёт полноценную IME-сессию ProseMirror.

## Полнота и покрытие

`src/test/module-inventory.test.ts` проверяет наличие соседнего теста у каждого исполняемого модуля `src/editors` и у `src/app/EditorHistoryActions.tsx`. AST-проверка отличает файлы только с типами и реэкспортами от runtime-кода. `tiptap/types.ts` содержит defaults и включён в runtime-проверки.

Coverage V8 включает также неисполненные файлы. Отчёты: терминал, `coverage/index.html`, `coverage/coverage-summary.json`; каталог не добавляется в Git. Процент покрытия — диагностический показатель, а не доказательство правильности. Обязательные сценарии не скрываются через skip/todo. Падающий регрессионный тест остаётся активным до согласованного исправления.

Сценарии старого сравнительного стенда перенесены в самостоятельные проверки serialization, Enter и выхода из вложенности, удаления пустого блока, menu-state/commands, диапазонов drag и history. Suite не читает Git baseline и не переписывает исходники в памяти. Полная совместимость с BlockNote этим набором не заявляется.

## Граница браузерных проверок

jsdom не проверяет нативный drag, реальную IME, визуальную позицию меню, clipboard, CSS и viewport. Для согласованных runtime-исправлений дополнительно требуется browser regression; отсутствие подключённого браузера фиксируется отдельно от результата Vitest. Незавершённые задачи 5.3/8.1 изменения `refactor-editor-modules` сохраняют статус.

Функциональные требования остаются в [индексе спецификаций](../agent.md). Текущий результат запуска и обнаруженные расхождения записаны в [verification.md изменения](../../openspec/changes/add-editor-vitest-tests/verification.md).

## Матрица модулей

Каждая строка соответствует отдельному соседнему тесту. Дополнительные тесты helpers и inventory расположены в `src/test`.

| Модуль | Тест | Сценарии |
| --- | --- | --- |
| [src/app/EditorHistoryActions.tsx](../../src/app/EditorHistoryActions.tsx) | [EditorHistoryActions.test.tsx](../../src/app/EditorHistoryActions.test.tsx) | Undo/redo, ??????????? ??????, ?????? editor; ????????? ?????????? |
| [src/editors/BlockNoteEditor.tsx](../../src/editors/BlockNoteEditor.tsx) | [BlockNoteEditor.test.tsx](../../src/editors/BlockNoteEditor.test.tsx) | ????????/defaults, malformed JSON, callback ?????????? ? storage errors |
| [src/editors/tiptap/TiptapEditor.tsx](../../src/editors/tiptap/TiptapEditor.tsx) | [TiptapEditor.test.tsx](../../src/editors/tiptap/TiptapEditor.test.tsx) | onEditorReady/cleanup, bubble predicate, edit/save/remount/restore ? ???????? Editor |
| [src/editors/tiptap/blocks/heading/Heading.ts](../../src/editors/tiptap/blocks/heading/Heading.ts) | [Heading.test.ts](../../src/editors/tiptap/blocks/heading/Heading.test.ts) | ????? ???????, shortcuts, HTML ? ???????????? allowed/default levels |
| [src/editors/tiptap/blocks/heading/heading-enter.ts](../../src/editors/tiptap/blocks/heading/heading-enter.ts) | [heading-enter.test.ts](../../src/editors/tiptap/blocks/heading/heading-enter.test.ts) | ??????/????????/?????, selection, children, nested lift ? history |
| [src/editors/tiptap/blocks/list-types/BulletListItem.ts](../../src/editors/tiptap/blocks/list-types/BulletListItem.ts) | [BulletListItem.test.ts](../../src/editors/tiptap/blocks/list-types/BulletListItem.test.ts) | Shortcut, HTML metadata ? ????????? ??????? ????? StarterKit |
| [src/editors/tiptap/blocks/list-types/CheckListItem.ts](../../src/editors/tiptap/blocks/list-types/CheckListItem.ts) | [CheckListItem.test.ts](../../src/editors/tiptap/blocks/list-types/CheckListItem.test.ts) | Checkbox update/change, ?????? ????, readonly, HTML checked ? ????????? ??????? |
| [src/editors/tiptap/blocks/list-types/NumberedListItem.ts](../../src/editors/tiptap/blocks/list-types/NumberedListItem.ts) | [NumberedListItem.test.ts](../../src/editors/tiptap/blocks/list-types/NumberedListItem.test.ts) | Shortcut, HTML metadata, ?????? start ? ????????? ??????? |
| [src/editors/tiptap/blocks/list-types/inputRules.ts](../../src/editors/tiptap/blocks/list-types/inputRules.ts) | [inputRules.test.ts](../../src/editors/tiptap/blocks/list-types/inputRules.test.ts) | ??????? ???????/checklist/heading/quote ? ???????????? ????? |
| [src/editors/tiptap/blocks/list-types/listItemEnter.ts](../../src/editors/tiptap/blocks/list-types/listItemEnter.ts) | [listItemEnter.test.ts](../../src/editors/tiptap/blocks/list-types/listItemEnter.test.ts) | ???????????/?????, children, checked reset, selection guards ? history |
| [src/editors/tiptap/blocks/paragraph/Paragraph.ts](../../src/editors/tiptap/blocks/paragraph/Paragraph.ts) | [Paragraph.test.ts](../../src/editors/tiptap/blocks/paragraph/Paragraph.test.ts) | HTML ? shortcut ?????????????? heading ? paragraph |
| [src/editors/tiptap/blocks/paragraph/paragraph-enter.ts](../../src/editors/tiptap/blocks/paragraph/paragraph-enter.ts) | [paragraph-enter.test.ts](../../src/editors/tiptap/blocks/paragraph/paragraph-enter.test.ts) | ??????/????????/?????, ???????? selection, children, nested lift, undo/redo |
| [src/editors/tiptap/blocks/quote/Quote.ts](../../src/editors/tiptap/blocks/quote/Quote.ts) | [Quote.test.ts](../../src/editors/tiptap/blocks/quote/Quote.test.ts) | HTML parse/render ? ?????????? isolating-??????? |
| [src/editors/tiptap/blocks/quote/quote-enter.ts](../../src/editors/tiptap/blocks/quote/quote-enter.ts) | [quote-enter.test.ts](../../src/editors/tiptap/blocks/quote/quote-enter.test.ts) | ??????????, ??????/????????? ??????, props/children ? history |
| [src/editors/tiptap/blocks/shared/block-position.ts](../../src/editors/tiptap/blocks/shared/block-position.ts) | [block-position.test.ts](../../src/editors/tiptap/blocks/shared/block-position.test.ts) | ????????? ?????????, ?????? ? ??????????? |
| [src/editors/tiptap/blocks/shared/unnest-block.ts](../../src/editors/tiptap/blocks/shared/unnest-block.ts) | [unnest-block.test.ts](../../src/editors/tiptap/blocks/shared/unnest-block.test.ts) | Lift ? attrs, ???????????? children ? ?????????? siblings; ??????? ????? |
| [src/editors/tiptap/drag-and-drop/DragAndDrop.ts](../../src/editors/tiptap/drag-and-drop/DragAndDrop.ts) | [DragAndDrop.test.ts](../../src/editors/tiptap/drag-and-drop/DragAndDrop.test.ts) | ??????? dragover/leave/end, Escape, destroy ? readonly |
| [src/editors/tiptap/drag-and-drop/block-range.ts](../../src/editors/tiptap/drag-and-drop/block-range.ts) | [block-range.test.ts](../../src/editors/tiptap/drag-and-drop/block-range.test.ts) | ?????????, ????????? ? multi-sibling ???????? |
| [src/editors/tiptap/drag-and-drop/drag-decorations.ts](../../src/editors/tiptap/drag-and-drop/drag-decorations.ts) | [drag-decorations.test.ts](../../src/editors/tiptap/drag-and-drop/drag-decorations.test.ts) | Draggable handle, ID, accessible name ? optional cursor |
| [src/editors/tiptap/drag-and-drop/drag-session.ts](../../src/editors/tiptap/drag-and-drop/drag-session.ts) | [drag-session.test.ts](../../src/editors/tiptap/drag-and-drop/drag-session.test.ts) | Source, MIME, preview lifecycle, missing transfer/ID ? readonly |
| [src/editors/tiptap/drag-and-drop/drag-transfer.ts](../../src/editors/tiptap/drag-and-drop/drag-transfer.ts) | [drag-transfer.test.ts](../../src/editors/tiptap/drag-and-drop/drag-transfer.test.ts) | HTML/plain text, ?????????? widgets, preview ? ?????????? iframe/embed/object |
| [src/editors/tiptap/drag-and-drop/drop-handler.ts](../../src/editors/tiptap/drag-and-drop/drop-handler.ts) | [drop-handler.test.ts](../../src/editors/tiptap/drag-and-drop/drop-handler.test.ts) | ??????? ??????/????? ???????????, ??????????? ???????? ? history; ??????????? ??????????? schema |
| [src/editors/tiptap/drag-and-drop/move-selection.ts](../../src/editors/tiptap/drag-and-drop/move-selection.ts) | [move-selection.test.ts](../../src/editors/tiptap/drag-and-drop/move-selection.test.ts) | ??????????? ?????/????, ???????, nested siblings ? undo/redo |
| [src/editors/tiptap/editor-extensions.ts](../../src/editors/tiptap/editor-extensions.ts) | [editor-extensions.test.ts](../../src/editors/tiptap/editor-extensions.test.ts) | ??????, ?????????? ? schema ??? ????????????? document/paragraph/heading/blockquote |
| [src/editors/tiptap/extensions/BlockBehavior.ts](../../src/editors/tiptap/extensions/BlockBehavior.ts) | [BlockBehavior.test.ts](../../src/editors/tiptap/extensions/BlockBehavior.test.ts) | ?????????????????? Backspace/Delete/Enter ? quote shortcut |
| [src/editors/tiptap/extensions/BlockIds.ts](../../src/editors/tiptap/extensions/BlockIds.ts) | [BlockIds.test.ts](../../src/editors/tiptap/extensions/BlockIds.test.ts) | ?????????????/????????????? ID, ???????????? ? ?????????? appendTransaction |
| [src/editors/tiptap/extensions/delete-empty-block.ts](../../src/editors/tiptap/extensions/delete-empty-block.ts) | [delete-empty-block.test.ts](../../src/editors/tiptap/extensions/delete-empty-block.test.ts) | ???????? ??????? sibling, selection, history ? guards |
| [src/editors/tiptap/marks/BackgroundColor.ts](../../src/editors/tiptap/marks/BackgroundColor.ts) | [BackgroundColor.test.ts](../../src/editors/tiptap/marks/BackgroundColor.test.ts) | Default, HTML parse/render ???? |
| [src/editors/tiptap/marks/TextColor.ts](../../src/editors/tiptap/marks/TextColor.ts) | [TextColor.test.ts](../../src/editors/tiptap/marks/TextColor.test.ts) | Default, HTML parse/render ????? ?????? |
| [src/editors/tiptap/menu/BlockMenu.ts](../../src/editors/tiptap/menu/BlockMenu.ts) | [BlockMenu.test.ts](../../src/editors/tiptap/menu/BlockMenu.test.ts) | ????????? plugin state/decorations ? blur cleanup |
| [src/editors/tiptap/menu/BlockMenuView.tsx](../../src/editors/tiptap/menu/BlockMenuView.tsx) | [BlockMenuView.test.tsx](../../src/editors/tiptap/menu/BlockMenuView.test.tsx) | ??????, ????????? ?????, click ???????, ???????? ? ?????? ????????? |
| [src/editors/tiptap/menu/items.ts](../../src/editors/tiptap/menu/items.ts) | [items.test.ts](../../src/editors/tiptap/menu/items.test.ts) | ???????????? ????????, title/alias, ??????? ? ?????? ????????? |
| [src/editors/tiptap/menu/menu-accessibility.ts](../../src/editors/tiptap/menu/menu-accessibility.ts) | [menu-accessibility.test.ts](../../src/editors/tiptap/menu/menu-accessibility.test.ts) | ARIA expanded/active item, close ? destroy |
| [src/editors/tiptap/menu/menu-commands.ts](../../src/editors/tiptap/menu/menu-commands.ts) | [menu-commands.test.ts](../../src/editors/tiptap/menu/menu-commands.test.ts) | ??? ???????, ID/children, ??????? ????? ????????? ?????, missing/readonly/closed |
| [src/editors/tiptap/menu/menu-decorations.ts](../../src/editors/tiptap/menu/menu-decorations.ts) | [menu-decorations.test.ts](../../src/editors/tiptap/menu/menu-decorations.test.ts) | ?????? ??? ??????? ??????????, mousedown ? ???????? ?? click |
| [src/editors/tiptap/menu/menu-input.ts](../../src/editors/tiptap/menu/menu-input.ts) | [menu-input.test.ts](../../src/editors/tiptap/menu/menu-input.test.ts) | Slash, query, IME guard, arrows/pages/Enter/Escape, empty results, click ? readonly |
| [src/editors/tiptap/menu/menu-state.ts](../../src/editors/tiptap/menu/menu-state.ts) | [menu-state.test.ts](../../src/editors/tiptap/menu/menu-state.test.ts) | Anchors mapping, query/reset, metadata close, range ? ????? parent |
| [src/editors/tiptap/schema/BlockContainer.ts](../../src/editors/tiptap/schema/BlockContainer.ts) | [BlockContainer.test.ts](../../src/editors/tiptap/schema/BlockContainer.test.ts) | HTML attrs/props, children ? ?????? ????????????? ??????????? |
| [src/editors/tiptap/schema/BlockDocument.ts](../../src/editors/tiptap/schema/BlockDocument.ts) | [BlockDocument.test.ts](../../src/editors/tiptap/schema/BlockDocument.test.ts) | ???????? ???????? ???????? ?????? ?? blockContainer |
| [src/editors/tiptap/schema/BlockGroup.ts](../../src/editors/tiptap/schema/BlockGroup.ts) | [BlockGroup.test.ts](../../src/editors/tiptap/schema/BlockGroup.test.ts) | ????????? ??????, HTML ? ?????? ?????? ?????? |
| [src/editors/tiptap/serialization/blocks.ts](../../src/editors/tiptap/serialization/blocks.ts) | [blocks.test.ts](../../src/editors/tiptap/serialization/blocks.test.ts) | ??? ????? ?????, props, children, ????????????? ID ? fallback levels |
| [src/editors/tiptap/serialization/inline.ts](../../src/editors/tiptap/serialization/inline.ts) | [inline.test.ts](../../src/editors/tiptap/serialization/inline.test.ts) | ??? marks, links, ??????????? ??????, ??????? ? ????????????? ?? ??????? marks |
| [src/editors/tiptap/storage.ts](../../src/editors/tiptap/storage.ts) | [storage.test.ts](../../src/editors/tiptap/storage.test.ts) | ????????????? ????, malformed JSON, storage errors, ????????? JSON ? ?????????? ID |
| [src/editors/tiptap/toolbar/AlignmentButtons.tsx](../../src/editors/tiptap/toolbar/AlignmentButtons.tsx) | [AlignmentButtons.test.tsx](../../src/editors/tiptap/toolbar/AlignmentButtons.test.tsx) | ??????? left/center/right ?? props ?????????? |
| [src/editors/tiptap/toolbar/BlockTypeSelect.tsx](../../src/editors/tiptap/toolbar/BlockTypeSelect.tsx) | [BlockTypeSelect.test.tsx](../../src/editors/tiptap/toolbar/BlockTypeSelect.test.tsx) | ???????? ???????? ? ?????????? heading; ????????? Portal |
| [src/editors/tiptap/toolbar/ColorStyleButton.tsx](../../src/editors/tiptap/toolbar/ColorStyleButton.tsx) | [ColorStyleButton.test.tsx](../../src/editors/tiptap/toolbar/ColorStyleButton.test.tsx) | ??????????/????? ????? ?????? ? ????; ????????? Portal |
| [src/editors/tiptap/toolbar/InlineStyleButtons.tsx](../../src/editors/tiptap/toolbar/InlineStyleButtons.tsx) | [InlineStyleButtons.test.tsx](../../src/editors/tiptap/toolbar/InlineStyleButtons.test.tsx) | ?????? inline-???????, ?????? marks ? ??????? selection |
| [src/editors/tiptap/toolbar/LinkButton.tsx](../../src/editors/tiptap/toolbar/LinkButton.tsx) | [LinkButton.test.tsx](../../src/editors/tiptap/toolbar/LinkButton.test.tsx) | Cancel/empty/trimmed URL, ??????? href ? ?????????? ?????? |
| [src/editors/tiptap/toolbar/TiptapToolbar.tsx](../../src/editors/tiptap/toolbar/TiptapToolbar.tsx) | [TiptapToolbar.test.tsx](../../src/editors/tiptap/toolbar/TiptapToolbar.test.tsx) | ???????? ?? formatting, hidden alignment ??? quote ? unmount |
| [src/editors/tiptap/toolbar/ToolbarButton.tsx](../../src/editors/tiptap/toolbar/ToolbarButton.tsx) | [ToolbarButton.test.tsx](../../src/editors/tiptap/toolbar/ToolbarButton.test.tsx) | Accessible name, active/disabled, click ? ?????????????? mousedown |
| [src/editors/tiptap/toolbar/blockTypes.tsx](../../src/editors/tiptap/toolbar/blockTypes.tsx) | [blockTypes.test.tsx](../../src/editors/tiptap/toolbar/blockTypes.test.tsx) | Single/mixed selection, ??????? ? ?????? ???? |
| [src/editors/tiptap/toolbar/use-block-type-select.ts](../../src/editors/tiptap/toolbar/use-block-type-select.ts) | [use-block-type-select.test.ts](../../src/editors/tiptap/toolbar/use-block-type-select.test.ts) | ??????????? selection, quote alignment, close ? no-op ???????? ???? |
| [src/editors/tiptap/types.ts](../../src/editors/tiptap/types.ts) | [types.test.ts](../../src/editors/tiptap/types.test.ts) | Defaults paragraph/heading/quote |
| [src/editors/tiptap/uuid.ts](../../src/editors/tiptap/uuid.ts) | [uuid.test.ts](../../src/editors/tiptap/uuid.test.ts) | Timestamp UUID v7, version/variant, ???????????? ??? ????????????? ????? |
