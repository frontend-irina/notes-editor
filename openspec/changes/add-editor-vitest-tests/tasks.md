## 1. Test Infrastructure

- [x] 1.1 Добавить совместимые devDependencies Vitest, coverage-v8, jsdom и React Testing Library с user-event/jest-dom; проверить установку и согласованность package-lock без обновления runtime-зависимостей.
- [x] 1.2 Создать vitest.config.ts, npm-команды test/test:watch/test:coverage и coverage exclusions по design; проверить запуск временного smoke-теста в Node и jsdom, затем заменить его содержательными тестами следующих задач.
- [x] 1.3 Добавить tsconfig.test.json и test:types, согласовать inclusion/exclusion с app config; проверить типизацию теста и конфигурации, а также npm run build.
- [x] 1.4 Создать небольшие fixtures, фабрику настоящего EditorState/Editor и DOM setup/cleanup в src/test; проверить на тестах schema и React, что редакторы и DOM удаляются, globals восстанавливаются.

## 2. Model and Schema

- [x] 2.1 Добавить соседние тесты types.ts, uuid.ts и storage.ts по матрице design; проверить defaults, UUID и успешные/ошибочные операции storage запуском соответствующих файлов.
- [x] 2.2 Добавить inline.test.ts и blocks.test.ts с независимыми ожидаемыми значениями обоих преобразований, всеми типами, props, marks, links и children; проверить их запуск без Git baseline.
- [x] 2.3 Добавить тесты трёх schema-модулей и обоих color marks; проверить допустимость деревьев и HTML parse/render в jsdom.
- [x] 2.4 Добавить editor-extensions.test.ts и BlockIds.test.ts; проверить построение schema, отсутствие конфликтов, назначение/сохранение ID и завершение appendTransaction.

## 3. Block Behavior

- [x] 3.1 Покрыть block-position.ts и unnest-block.ts; проверить границы, selection, сохранение attrs, children и siblings настоящими transactions.
- [x] 3.2 Покрыть Paragraph.ts и paragraph-enter.ts; проверить Enter в разных позициях, пустой/вложенный блок и undo/redo.
- [x] 3.3 Покрыть Heading.ts и heading-enter.ts; проверить уровни, input rules/shortcuts, Enter и выход из вложенности.
- [x] 3.4 Покрыть Quote.ts и quote-enter.ts; проверить schema, attrs, Enter, пустую цитату и вложенность.
- [x] 3.5 Добавить отдельные тесты BulletListItem.ts, NumberedListItem.ts и CheckListItem.ts; проверить schema/render, checked, readonly и lifecycle checkbox nodeview.
- [x] 3.6 Покрыть inputRules.ts и listItemEnter.ts; проверить маркеры, неприменимые входы, продолжение/выход из списка и вложенность.
- [x] 3.7 Покрыть delete-empty-block.ts и BlockBehavior.ts; проверить guards, подключённые shortcuts, итоговый документ, selection и history.

## 4. Block Menu

- [x] 4.1 Покрыть items.ts и menu-state.ts; проверить фильтрацию/aliases, trigger, mapping, selected index и закрытие меню.
- [x] 4.2 Покрыть menu-commands.ts и menu-input.ts; проверить шесть типов, удаление trigger, readonly, навигацию, composition, Escape, пустые результаты и blur.
- [x] 4.3 Покрыть menu-decorations.ts и menu-accessibility.ts; проверить кнопку открытия, DOM events и изменение/очистку ARIA при закрытии и destroy.
- [x] 4.4 Покрыть BlockMenu.ts и BlockMenuView.tsx; проверить связность plugin/view, роли, группы, выбранный пункт, выполнение команды и закрытое состояние.

## 5. Drag and Drop

- [x] 5.1 Покрыть block-range.ts и move-selection.ts; проверить вложенные диапазоны, границы, движение siblings, selection и undo/redo.
- [x] 5.2 Покрыть drag-session.ts и drag-transfer.ts; проверить общую сессию, HTML/text, фильтрацию preview и cleanup с настоящей schema и минимальным DataTransfer stub.
- [x] 5.3 Покрыть drag-decorations.ts и drop-handler.ts; проверить handles/cursor, недопустимый собственный диапазон, перенос внутри/между двумя редакторами и удаление источника.
- [x] 5.4 Покрыть DragAndDrop.ts; проверить wiring событий, readonly, завершение/отмену сессии и cleanup preview. Зафиксировать, что эти тесты не проверяют нативный браузерный drag.

## 6. Toolbar and Editor Integration

- [x] 6.1 Покрыть blockTypes.tsx, use-block-type-select.ts и BlockTypeSelect.tsx; проверить mixed selection, выбранный тип, открытие/закрытие и применение команды.
- [x] 6.2 Покрыть ToolbarButton.tsx, ColorStyleButton.tsx и InlineStyleButtons.tsx; проверить accessible names, active/disabled, форматирование и сброс цвета пользовательскими действиями.
- [x] 6.3 Покрыть AlignmentButtons.tsx и LinkButton.tsx; проверить alignment, отмену prompt, пустую/обрезанную ссылку, изменение и удаление ссылки.
- [x] 6.4 Покрыть TiptapToolbar.tsx и src/app/EditorHistoryActions.tsx; проверить обновление от editor state, ограничения цитаты, undo/redo и cleanup subscriptions.
- [x] 6.5 Покрыть TiptapEditor.tsx настоящим редактором с контролируемыми DOM API; проверить onReady/cleanup, меню/toolbar, bubble predicate и edit → save → remount → restore.
- [x] 6.6 Покрыть src/editors/BlockNoteEditor.tsx с mock стороннего API; проверить только контракт нашего адаптера загрузки/сохранения и существующие fallback/error-сценарии.

## 7. Coverage and Documentation

- [x] 7.1 Добавить inventory-проверку соответствия runtime-модулей соседним тестам с явными исключениями; проверить, что она обнаруживает отсутствующую пару и учитывает tiptap/types.ts как runtime-модуль.
- [x] 7.2 Создать docs/architecture/testing.md с полной матрицей фактических путей, fixtures, командами и ограничениями jsdom; проверить каждый модуль design против существующего содержательного теста и отразить перенесённые случаи старого стенда.
- [x] 7.3 Обновить docs/architecture/project.md, docs/agent.md и README; проверить рабочие ссылки и соответствие команд package.json, оставить незавершённые браузерные задачи рефакторинга открытыми.
- [x] 7.4 Выполнить npm test, npm run test:types, npm run test:coverage, npm run lint и npm run build; зафиксировать результаты и непокрытые ветки в verification.md изменения. Проверить отсутствие обязательных skip/todo, утечек сессий и зависимостей от Git baseline; при конфликте со спецификацией сохранить воспроизведение и не отмечать затронутую задачу завершённой до разрешения.

## 8. Approved Fixes

- [x] 8.1 Исправить согласованную нормализацию соседних inline-фрагментов независимо от порядка marks; проверить активный регрессионный тест и весь набор serialization.
- [x] 8.2 Исправить согласованный конфликт импорта специализированных list-item HTML-правил со StarterKit через приоритет parse rules; проверить отдельные HTML-тесты bullet, numbered и checklist.
- [x] 8.3 Исправить согласованный перенос между независимыми совместимыми schema и отказ для несовместимых; проверить сохранение props/marks/children, удаление источника и history регрессионными тестами.
- [x] 8.4 Исправить согласованную актуальность history при замене editor и доступность двух меню toolbar; проверить ранее падавшие React-тесты через доступные роли.
- [ ] 8.5 Выполнить browser regression согласованных runtime-исправлений: импорт списков, меню типа/цвета, смена editor/history и перенос между совместимыми редакторами; проверить persistence, undo/redo и отсутствие ошибок. Требуется подключённый браузер; jsdom не заменяет эту проверку.
