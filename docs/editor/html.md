# Импорт и экспорт HTML

## Назначение

Документ определяет контракт преобразования между публичной блочной моделью
редактора и HTML. HTML используется для interoperability, вставки, миграции и
статического отображения документов.

Источники поведения:

- [BlockNote — HTML Import](https://www.blocknotejs.org/docs/features/import/html);
- [BlockNote — HTML Export](https://www.blocknotejs.org/docs/features/export/html);
- [BlockNote — Format Interoperability](https://www.blocknotejs.org/docs/foundations/supported-formats).

Связанные спецификации:

- [Markdown](./markdown.md);
- [Inline Content](./inline-content.md);
- [Paragraph](./blocks/paragraph/paragraph.md);
- [HTML для Paragraph](./blocks/paragraph/html.md);
- [Heading](./blocks/heading/html.md);
- [Quote](./blocks/quote/html.md);
- [Элементы списка](./blocks/list-types/html.md).

## Роль формата

Редактор различает три представления:

| Представление | Назначение | Потери |
| --- | --- | --- |
| Публичный `Block[]` JSON | Каноническое хранение и API | Без потерь для активной схемы |
| Полный BlockNote HTML | Статический рендеринг и перенос полной структуры | Минимальные, зависит от schema mappings |
| Interoperable HTML | Обмен с другими приложениями | Lossy |

HTML не заменяет публичный JSON как основной persistence-формат. Даже полный HTML
может зависеть от версии схемы, CSS и зарегистрированных custom blocks.

## Публичный API

Совместимый API надстройки должен разделять полный и interoperable экспорт:

```ts
type HTMLImportResult = {
  blocks: Block[];
  warnings: HTMLDiagnostic[];
};

type HTMLExportResult = {
  html: string;
  warnings: HTMLDiagnostic[];
};

type HTMLDiagnostic = {
  code: string;
  message: string;
  severity: "warning" | "error";
  blockId?: string;
};

function importHTML(html: string): HTMLImportResult;
function exportFullHTML(blocks?: Block[]): HTMLExportResult;
function exportInteroperableHTML(blocks?: Block[]): HTMLExportResult;
```

На уровне BlockNote операциям соответствуют:

```ts
editor.tryParseHTMLToBlocks(html: string): Block[];
editor.blocksToFullHTML(blocks?: Block[]): string;
editor.blocksToHTMLLossy(blocks?: Block[]): string;
```

- Если `blocks` при экспорте не переданы, экспортируется весь документ.
- Преобразования не должны изменять текущий документ или переданный массив.
- Вставка либо замена blocks после импорта выполняется отдельной явной командой.
- Реализация преобразований должна быть изолирована от React UI.

## Импорт HTML

### Общие правила

- Входом является строка HTML.
- Блочные элементы преобразуются в `Block`, inline-элементы — в
  `InlineContent`.
- Импорт поддерживает как полный BlockNote HTML, так и стандартный HTML в пределах
  активной схемы.
- Неизвестный block-level element преобразуется в paragraph либо ближайший
  поддерживаемый block с сохранением читаемого содержимого.
- Неизвестный inline element сохраняет текстовое содержимое и поддерживаемых
  потомков, но его собственная неизвестная семантика может быть потеряна.
- Импортированные внешние blocks получают UUID v7. Валидные `id` из доверенного
  полного BlockNote HTML могут сохраняться только в явно выбранном режиме импорта;
  дубликаты всегда заменяются по правилам [block-id.md](./block-id.md).
- Пустой или не содержащий импортируемого содержимого HTML создаёт корректный
  пустой документ согласно инварианту схемы.

### Соответствие стандартных blocks

| HTML | Публичная модель |
| --- | --- |
| `<p>` | `paragraph` |
| `<h1>` … `<h6>` | `heading` с соответствующим `level` |
| `<blockquote>` | `quote` |
| `<ul>` / `<ol>` и `<li>` | list item blocks и `children` |
| `<pre><code>` | code block |
| `<table>` | table block при наличии в схеме |
| `<img>` | image block при наличии в схеме |
| `<hr>` | divider block при наличии в схеме |

- Семантический элемент имеет приоритет над чисто визуальным стилем при выборе
  block type.
- Специализированный block создаётся только при наличии соответствующего типа в
  активной схеме; иначе применяется безопасный fallback с warning.
- Вложенные block-level elements восстанавливаются в `children`, если их отношение
  однозначно выражено структурой и поддерживается block mapping.

### Inline-соответствие

| HTML | `InlineContent` |
| --- | --- |
| `<strong>`, `<b>` | `bold: true` |
| `<em>`, `<i>` | `italic: true` |
| `<u>` | `underline: true` |
| `<s>`, `<del>`, `<strike>` | `strike: true` |
| `<code>` вне code block | `code: true` |
| `<a href>` | `Link` |
| `<br>` | поддерживаемый перенос строки |
| `color` | `textColor` |
| `background-color` | `backgroundColor` |

- Вложенные поддерживаемые inline-стили комбинируются.
- Соседние фрагменты с одинаковыми styles нормализуются согласно
  [inline-content.md](./inline-content.md).
- Вложенные `<a>` не создают вложенные `Link`; применяется валидное ближайшее
  представление.
- CSS учитывается только для разрешённого набора свойств. Полный CSS cascade не
  является частью контракта импорта.

### Props блока

- Полный BlockNote HTML восстанавливает block type и props из стабильных
  служебных `data-*` attrs.
- Для interoperable HTML поддерживаемые `background-color`, `color` и
  `text-align` могут восстанавливаться из inline style.
- Значения должны проходить валидацию prop schema.
- Недопустимое значение заменяется default или игнорируется с warning.
- Inline color и block color остаются разными уровнями данных.

## Полный BlockNote HTML

`exportFullHTML` предназначен для статического отображения документа с максимально
полной структурой BlockNote.

- Сохраняет block wrappers, `data-node-type`, `data-content-type`, `data-id` и
  поддерживаемые props.
- Сохраняет иерархию `blockGroup`/`blockContainer` и вложенные `children`.
- Использует HTML mapping каждого зарегистрированного block и inline type.
- Для визуального совпадения потребитель должен подключить совместимые стили и
  внешние контейнеры BlockNote.
- Служебный HTML является версионируемым контрактом конкретной схемы, а не
  универсальным HTML для произвольного редактора.
- Полный HTML не должен включать runtime-only UI: selection, caret, floating
  toolbar, drag handles, открытые popovers и локальное toggle-состояние.

Пример структурной формы:

```html
<div class="bn-block-group" data-node-type="blockGroup">
  <div class="bn-block-outer" data-node-type="blockOuter" data-id="…">
    <div class="bn-block" data-node-type="blockContainer" data-id="…">
      <div class="bn-block-content" data-content-type="heading" data-level="2">
        <h2 class="bn-inline-content">Заголовок</h2>
      </div>
    </div>
  </div>
</div>
```

## Interoperable HTML

`exportInteroperableHTML` создаёт простой семантический HTML для других
приложений.

- Paragraph экспортируется как `<p>`, heading — как `<h1>`–`<h6>`.
- Inline content использует стандартные элементы и минимальные inline styles.
- Служебные wrappers и attrs редактора не должны быть обязательны для понимания
  результата.
- Для соответствия HTML-стандартам дети blocks, не являющихся list items, могут
  быть выведены следом без исходной вложенности.
- Props и пользовательские block types без переносимого HTML-представления могут
  быть упрощены или потеряны.
- Lossy-решения должны быть детерминированными и отражаться в warnings расширенного
  API.

## HTML отдельных документированных blocks

### Paragraph

Подробные правила импорта, полного и interoperable экспорта вынесены в
[HTML для Paragraph](./blocks/paragraph/html.md).

### Heading

- Обычный heading экспортируется как `<h1>`–`<h6>` согласно `level`.
- Дочерние блоки экспортируются отдельно от inline-содержимого `<h1>`–`<h6>`
  согласно [heading.md](./blocks/heading/heading.md).

### Quote

Подробные правила импорта, полного и interoperable экспорта вынесены в
[HTML для Quote](./blocks/quote/html.md).

### Элементы списка

Подробные правила полного и interoperable HTML вынесены в
[HTML для элементов списка](./blocks/list-types/html.md).

## Безопасность

HTML всегда считается недоверенным вводом.

- Импорт не должен выполнять `<script>`, inline event handlers или JavaScript URL.
- Небезопасные элементы и атрибуты удаляются до преобразования в blocks.
- `style` обрабатывается по allowlist поддерживаемых CSS-свойств и значений.
- URL в `href`, `src` и аналогичных attrs проходят общую URL-политику.
- Remote resources не должны загружаться как побочный эффект серверного parsing.
- HTML exporter должен корректно экранировать текст и attrs.
- Экспорт HTML не освобождает потребителя от безопасной политики рендеринга, если
  custom blocks могут возвращать пользовательскую разметку.
- В React нельзя передавать непроверенный импортированный HTML в
  `dangerouslySetInnerHTML` как замену block parser.

## Ошибки и diagnostics

- Malformed HTML обрабатывается устойчивым parser, а не регулярными выражениями.
- Восстановимые ошибки возвращают blocks и warnings.
- Невосстановимая ошибка не должна частично заменять текущий документ.
- Неизвестный element, отброшенный attr, небезопасный URL и lossy flattening должны
  иметь стабильные diagnostic codes в расширенном API.
- Diagnostics не входят в публичный документ.

## Round trip и эквивалентность

### Полный HTML

Для зарегистрированной схемы ожидается максимально полная семантическая
эквивалентность:

```text
Block[] → Full HTML → Block[]
```

Должны сохраняться block type, поддерживаемые props, inline content, children и
валидные идентификаторы в доверенном режиме импорта. Runtime UI-state не
сохраняется.

### Interoperable HTML

Гарантируется только эквивалентность поддерживаемой семантики:

```text
HTML → Block[] → Interoperable HTML → Block[]
```

Порядок attrs, выбор эквивалентных tags, whitespace между block elements и способ
записи CSS могут нормализоваться. Сравнение должно выполняться по публичной модели,
а не по побайтовому HTML.

## Критерии приёмки

1. Полный и interoperable HTML имеют отдельные методы и явно различимую семантику.
2. Публичный JSON остаётся каноническим persistence-форматом.
3. Импорт распознаёт стандартные block-level и inline elements при наличии типов
   в активной схеме.
4. Неизвестные elements сохраняют читаемый текст или создают warning, но не
   приводят к падению всего импорта.
5. Внешний HTML не может навязать дублирующиеся или недопустимые block IDs.
6. Full HTML round trip сохраняет поддерживаемые type, props, content и children.
7. Interoperable HTML экспортируется без обязательных служебных wrappers.
8. Lossy flattening вложенности происходит предсказуемо и диагностируется.
9. Inline styles и ссылки преобразуются согласно публичной модели.
10. Default props не создают лишних inline styles в interoperable HTML.
11. Scripts, event handlers, опасные URL и неподдерживаемый CSS не исполняются и
    не попадают в документ как активный код.
12. Malformed HTML не приводит к неуправляемому исключению или частичной замене
    документа.
13. Экспорт корректно экранирует пользовательский текст и значения attrs.
14. Преобразования не зависят от mounted React UI и доступны для серверной
    реализации редактора.
15. Quote импортируется из `<blockquote>` и экспортируется семантическим
    `<blockquote>` в interoperable HTML.
16. Full HTML round trip Quote сохраняет ID, props, content и children; lossy-
    упрощение сложного внешнего `<blockquote>` диагностируется.

## Открытые вопросы для проверки по эталону

- точный allowlist elements, attrs, styles и URL schemes BlockNote;
- приоритет `data-*` attrs и inline CSS при конфликте;
- сохранение IDs при импорте полного HTML из доверенного и внешнего источника;
- whitespace normalization вокруг inline и block elements;
- обработка malformed tables, nested anchors и invalid list nesting;
- импорт `<blockquote>` с несколькими параграфами или вложенными blockquotes;
- экспорт custom blocks без явного external HTML mapping;
- импорт `<details>` и фактическая роль attr `open`;
- различия client и server parsing в окружении без DOM.
