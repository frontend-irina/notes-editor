## Context

Мотивация описана в [proposal.md](proposal.md). Редактор уже разделён на schema, blocks, serialization, extensions, menu, drag-and-drop и toolbar. В проекте есть Vite 8, React 19 и TypeScript 6, но отсутствуют Vitest и тестовые команды. Сравнительный стенд предыдущего рефакторинга зависит от исторического Git baseline.

## Goals / Non-Goals

**Goals:** Каждый модуль с исполняемой логикой получает соседний тест с проверкой результатов, включая граничные случаи. Тесты запускаются одной командой без доступа к desktop automation. Публичная модель блоков остаётся основой assertions.

**Non-Goals:** Тестирование внутренней реализации стороннего BlockNote, визуальные снимки CSS, замена реальных браузерных проверок, изменение поведения редактора ради прохождения тестов. App, темы и main находятся вне области редакторных модулей; исключение — EditorHistoryActions.

## Decisions

### Согласованные исправления

Пользователь разрешил исправить выявленную зависимость нормализации от порядка marks: сравнение выполняется по числу ключей и их значениям вместо JSON.stringify. Также согласован конфликт импорта списков: специализированные `li[data-list-type]` для bullet/numbered/check получают parse-rule priority 100, общий StarterKit listItem сохраняет обычный приоритет. Оба изменения восстанавливают существующие контракты без изменения публичных типов или добавления возможностей. Остальные выявленные дефекты фиксируются в verification.md до отдельного согласования.

### Размещение и границы

Дополнительно пользователь согласовал исправления выявленных регрессий. Для межредакторного drop Slice восстанавливается через schema получателя; неизвестные типы или некорректные узлы отклоняются до изменения документов. History selector читает текущий prop editor, сохраняя подписку useEditorState. Меню типа блока и цвета используют стандартный Portal MUI, чтобы не оказаться внутри aria-hidden корневого контейнера. Регрессионные тесты проверяют результат без обхода accessible-role поиска.

Тест располагается рядом с модулем: `serialization/blocks.test.ts`, `menu/BlockMenuView.test.tsx`. Крупные наборы можно разделять на `имя.сценарий.test.ts(x)` в той же папке. Тесты также сохраняют читаемый размер около 100–150 строк; повторяемые данные выносятся в небольшие fixtures, а не в универсальный тестовый framework.

Общие средства находятся в `src/test/`: `fixtures.ts` для документов, `create-editor.ts` для настоящих EditorState/Editor, `dom-mocks.ts` для минимальных DOM API и `setup.ts` для cleanup. Специфические helpers остаются у соответствующей функции редактора. Центральная папка со всеми тестами отклонена: соседние файлы легче находить и переносить вместе с модулем.

Файлы только с типами (`menu/types.ts`, `toolbar/types.ts`, `drag-and-drop/types.ts`) проверяются TypeScript; чистые index-реэкспорты — через потребителей. CSS не получает формальных unit-тестов. `tiptap/types.ts` содержит runtime defaults и обязательно получает тест. Список исключений явный, без общего исключения `**/types.ts`.

### Инструменты и окружения

Добавить devDependencies: Vitest, соответствующий ему по версии `@vitest/coverage-v8`, jsdom, React Testing Library, user-event и jest-dom. При установке выбрать совместимые стабильные версии с существующими Vite, React и Node и зафиксировать package-lock без обновления runtime-зависимостей.

Отдельный `vitest.config.ts` использует `mergeConfig` с существующей конфигурацией Vite, не дублируя React plugin. Явные импорты из Vitest, `globals: false`, `allowOnly: false`. По умолчанию Node; DOM-файлы используют `@vitest-environment jsdom`. Такое разделение поддержано [Vitest environment](https://vitest.dev/config/environment). Setup безопасен и в Node: DOM cleanup подключается только при наличии DOM либо отдельным setup для DOM-наборов.

Команды: `test` → `vitest run`, `test:watch` → `vitest`, `test:coverage` → `vitest run --coverage`, `test:types` → отдельная проверка `tsconfig.test.json`. Конфигурация тестов включает тесты, helpers и vitest.config, сохраняет параметры приложения и добавляет необходимые Node-типы. Тестовые файлы исключаются из app tsconfig только вместе с их включением в test tsconfig. Production build остаётся самостоятельной обязательной проверкой.

### Реальные состояния и контролируемые зависимости

Serialization проверяется через конкретные ожидаемые публичные блоки и Tiptap JSON в обоих направлениях; один round-trip недостаточен, поскольку две ошибки могут компенсировать друг друга. Schema, команды и плагины используют настоящие schema, transactions, selections и plugin state. Проверяется документ после действия, а не только факт вызова dispatch. Undo/redo проверяется с подключённым history для операций, меняющих документ.

React-тесты используют доступные роли, имена и взаимодействия пользователя, согласно подходу [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/). Не заменять внутренние проверяемые команды целиком mocks. Для оболочки BlockNote допустима подмена стороннего API; она проверяет наш адаптер. Tiptap получает хотя бы один интеграционный сценарий с настоящим редактором.

Подменять только отсутствующие возможности jsdom: измерение координат, DataTransfer, prompt, необходимые observers. Для каждого shim документировать ограничение. Восстанавливать spies, таймеры, crypto и localStorage; уничтожать редакторы, subscriptions, React roots, preview и активную drag session после каждого теста. Не зависеть от порядка файлов, случайных UUID или сохранённых пользовательских данных.

### Матрица обязательного покрытия

Все пути ниже относительно `src/editors/tiptap`, кроме явно указанных. Каждое имя в строке получает собственный соседний тест; группировка отражает общую область, а не один тест на группу.

| Модули | Проверяемые сценарии |
| --- | --- |
| `types.ts`, `uuid.ts`, `storage.ts` | Defaults, UUID version/variant и отсутствие коллизий в выборке; загрузка/сохранение публичных блоков, отсутствующий ключ, повреждённый JSON и ошибки storage. |
| `serialization/inline.ts`, `serialization/blocks.ts` | Шесть типов блоков, вложенность, props, marks и links; пустой контент, объединение inline fragments и существующие fallback-ветки. |
| `schema/BlockDocument.ts`, `BlockContainer.ts`, `BlockGroup.ts` | Допустимые и недопустимые деревья, attrs, вложенность, HTML parse/render в пределах существующих schema. |
| `marks/TextColor.ts`, `BackgroundColor.ts` | Defaults, parse/render цветов и сохранение marks. |
| `editor-extensions.ts` | Построение настоящей schema, состав и приоритеты extensions, отсутствие конфликтующих узлов StarterKit. |
| `extensions/BlockIds.ts` | Назначение отсутствующих ID, обработка дубликатов, сохранение имеющихся ID, отсутствие повторяющейся appendTransaction. |
| `extensions/BlockBehavior.ts`, `delete-empty-block.ts` | Подключение shortcuts; Backspace/Delete/Enter и quote shortcut, guards, выбор позиции после удаления, undo/redo. |
| `blocks/shared/block-position.ts`, `unnest-block.ts` | Поиск контейнера, отсутствие блока, выход из вложенности с сохранением следующих siblings, children и attrs. |
| `blocks/paragraph/Paragraph.ts`, `paragraph-enter.ts` | Регистрация узла, Enter в начале/середине/конце, пустой и вложенный блок, selection после операции. |
| `blocks/heading/Heading.ts`, `heading-enter.ts` | Уровни заголовков, input rules/shortcuts, Enter и выход из пустого вложенного заголовка. |
| `blocks/quote/Quote.ts`, `quote-enter.ts` | Schema и атрибуты цитаты, Enter, пустая цитата и вложенность. |
| `blocks/list-types/BulletListItem.ts`, `NumberedListItem.ts`, `CheckListItem.ts` | Schema/attrs/render; checkbox toggle, readonly, nodeview update и отказ от чужого типа узла. |
| `blocks/list-types/inputRules.ts`, `listItemEnter.ts` | Маркеры списков и чекбоксов, неприменимые входы, продолжение/выход из списка, checked state и вложенность. |
| `menu/items.ts`, `menu/menu-state.ts` | Каталог, aliases и фильтрация; trigger, mapping позиции, selected index, закрытие и невалидный контекст. |
| `menu/menu-commands.ts`, `menu/menu-input.ts` | Открытие, шесть типов блоков, удаление trigger; клавиатура, composition, Escape, пустые результаты, readonly, click/blur. |
| `menu/menu-decorations.ts`, `menu/menu-accessibility.ts` | Кнопка открытия, DOM events; ARIA при открытии, выборе, закрытии и destroy. |
| `menu/BlockMenu.ts`, `menu/BlockMenuView.tsx` | Совместная работа plugin/view, фильтрация и группы, выбранный пункт, выполнение команды, закрытый и пустой список. |
| `drag-and-drop/block-range.ts`, `move-selection.ts` | Диапазон siblings и вложенных блоков, движение вверх/вниз, границы документа, selection и history. |
| `drag-and-drop/drag-session.ts`, `drag-transfer.ts` | Общая сессия двух редакторов, start/end; HTML/plain text, очистка небезопасных preview-элементов и удаление preview. |
| `drag-and-drop/drag-decorations.ts`, `drop-handler.ts`, `DragAndDrop.ts` | Handles/cursor, readonly, drop внутрь собственного диапазона, перенос внутри/между редакторами, удаление источника, cleanup и undo/redo в пределах поддерживаемой истории. |
| `toolbar/blockTypes.tsx`, `use-block-type-select.ts`, `BlockTypeSelect.tsx` | Тип и mixed selection, список вариантов, состояние открытия/закрытия, применение типа. |
| `toolbar/ToolbarButton.tsx`, `ColorStyleButton.tsx`, `InlineStyleButtons.tsx` | Accessible name, disabled/active, действия форматирования, выбор и сброс цвета. |
| `toolbar/AlignmentButtons.tsx`, `LinkButton.tsx` | Alignment; prompt cancel/empty/trimmed URL, существующая ссылка и удаление ссылки. |
| `toolbar/TiptapToolbar.tsx` | Обновление состояния от selection/transaction, доступные команды, ограничения для цитаты, отписка при unmount. |
| `TiptapEditor.tsx` | Создание и cleanup, onReady, загрузка и сохранение, подключение меню/toolbar, условие показа bubble; интеграция edit → save → remount → restore. |
| `src/editors/BlockNoteEditor.tsx` | Адаптер загрузки/сохранения, fallback при повреждённых данных и обработка storage errors в пределах текущего контракта. |
| `src/app/EditorHistoryActions.tsx` | Доступность undo/redo, команды, переключение editor и cleanup subscriptions. |

При уточнении сценариев источником требований служат документы из proposal, а не текущее поведение само по себе. Применимые случаи старого стенда переносятся с независимыми ожидаемыми значениями; стенд не импортируется и не изменяется.

### Полнота и критерий завершения

`docs/architecture/testing.md` фиксирует матрицу «реальный путь → тестовые файлы → сценарии». Небольшая inventory-проверка выявляет новые runtime-модули без соседнего теста; явные исключения ограничены чистыми типами и реэкспортами. Наличие файла дополняется review assertions: тест импорта или snapshot без проверки поведения не считается покрытием модуля.

Coverage V8 явно включает `src/editors/**/*.{ts,tsx}` и `src/app/EditorHistoryActions.tsx`, исключает тесты, helpers, declarations и перечисленные чистые типы/реэкспорты. `coverage.include` нужен, чтобы видеть также неисполненные файлы: [Vitest coverage](https://vitest.dev/config/coverage). Отчёты text/html/json-summary; `coverage/` исключается из Git. На первом этапе критерий — полная матрица с содержательными сценариями и объяснением непокрытых веток, без искусственного требования 100% или произвольного процентного порога.

Завершение требует успешных test, test:types, test:coverage, lint и build. Обязательные сценарии нельзя скрывать через skip/todo или снижением assertions. Обнаруженный конфликт со спецификацией фиксируется воспроизводимым случаем и отдельным решением; до разрешения затронутая задача остаётся незавершённой.

## Risks / Trade-offs

- jsdom не воспроизводит layout, нативный drag, IME и реальный фокус полностью → проверки конкретных обработчиков и lifecycle дополняют, но не закрывают браузерные задачи 5.3/8.1 предыдущего изменения.
- Избыточные mocks могут пропустить ошибки связности → настоящие ProseMirror transactions и интеграционный сценарий Tiptap обязательны.
- Общая drag session и browser globals создают зависимости от порядка → явный cleanup и повторный запуск затронутых наборов при обнаружении утечек.
- Соседние тесты увеличивают число файлов → привычное именование и небольшие локальные helpers сохраняют навигацию после рефакторинга.

## Migration Plan

Сначала настроить runner, типизацию и fixtures; затем покрывать модули от модели и schema до plugins и React-оболочек. После заполнения матрицы выполнить все проверки и обновить README, архитектуру и индекс docs/agent.md. Продакшен-миграции данных не требуются. Откат ограничен тестовой инфраструктурой, devDependencies и документацией этого изменения; результаты предыдущего рефакторинга сохраняются.
