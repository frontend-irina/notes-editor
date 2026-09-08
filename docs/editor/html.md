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
- [Heading](./blocks/heading.md);
- [Quote](./blocks/quote.md).

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
  согласно [heading.md](./blocks/heading.md).

### Quote

Модель блока и его редакторское поведение определены в [quote.md](./blocks/quote.md).

#### Импорт

- Семантический `<blockquote>` создаёт блок `quote`, если этот тип присутствует в
  активной схеме. Атрибут `cite` не является частью публичной модели Quote и
  игнорируется либо отражается в warning расширенного API.
- Поддерживаемые inline-элементы внутри `<blockquote>` преобразуются в
  `InlineContent[]` по общим правилам. Сам `<blockquote>` не создаёт лишний
  paragraph.
- В полном BlockNote HTML служебные `data-*` props имеют приоритет. Во внешнем
  HTML `backgroundColor` и `textColor` могут быть прочитаны соответственно из
  разрешённых `background-color` и `color` в inline style.
- Значения props проходят prop schema Quote. Отсутствующие, недопустимые или
  запрещённые значения нормализуются в `"default"` либо отбрасываются с warning.
  Prop `textAlignment` для Quote не создаётся.
- Простой пустой `<blockquote></blockquote>` создаёт Quote с `content: []`.
- Если `<blockquote>` содержит несколько block-level элементов или вложенный
  `<blockquote>`, importer сохраняет читаемый текст и порядок. Структура
  восстанавливается в Quote и `children` только при однозначном mapping; иначе она
  детерминированно раскладывается в поддерживаемые blocks с warning.

#### Полный BlockNote HTML

- Quote сохраняется внутри стандартных `blockOuter` / `blockContainer` wrappers;
  block content имеет `data-content-type="quote"`, а inline content отображается
  семантическим `<blockquote>`.
- Служебная структура сохраняет UUID, `backgroundColor`, `textColor` и отдельный
  дочерний `blockGroup`, поэтому дети не становятся inline-содержимым
  `<blockquote>`.
- В доверенном режиме полный round trip сохраняет type, ID, props, inline content
  и children Quote.

#### Interoperable HTML

- Quote экспортируется как `<blockquote>…</blockquote>` без обязательных
  BlockNote wrappers и служебных attrs.
- Поддерживаемое inline content сериализуется непосредственно внутри элемента.
- `backgroundColor` и `textColor`, отличающиеся от `"default"`, экспортируются
  минимальными inline CSS declarations `background-color` и `color`; default-
  значения не создают styles.
- Именованные цвета темы перед экспортом преобразуются в соответствующие
  переносимые CSS-значения.
- `id` не экспортируется. `children` non-list Quote могут быть выведены после
  `<blockquote>` как соседние blocks; потеря исходной вложенности отмечается
  warning.

```html
<blockquote style="color: #b91c1c">
  Текст с <strong>жирным</strong> начертанием и
  <a href="https://example.com">ссылкой</a>.
</blockquote>
```

Для простого Quote interoperable round trip сохраняет тип, текст, поддерживаемые
inline-стили и переносимые block colors. Порядок attrs, пробелы и форма CSS могут
быть нормализованы.

### Элементы списка

Модель блоков описана в [list-types.md](./blocks/list-types.md). `<ul>` и `<ol>`
являются только HTML-представлением группы соседних list-item blocks и не создают
дополнительный публичный `Block`.

#### Полный BlockNote HTML

- Сохраняет точные `type`, `id`, `DefaultProps`, `start`, `checked`, inline
  content и `children` через служебные wrappers и `data-*` attrs.
- `blockGroup` / `blockContainer` сохраняют границы блоков; дочерний `blockGroup`
  представляет `children` элемента.
- Локальное раскрытие `toggleListItem` не экспортируется.
- При импорте валидные служебные данные имеют приоритет над семантическими
  эвристиками, но props обязательно проходят проверку схемы.

#### Interoperable HTML: экспорт

| Тип блока | Семантический HTML |
| --- | --- |
| `bulletListItem` | `<li>` внутри `<ul>` |
| `numberedListItem` | `<li>` внутри `<ol>` |
| `checkListItem` | task-list `<li>` внутри `<ul>` с машиночитаемым checked-state |
| `toggleListItem` | `<details>` / `<summary>` либо документированный lossy fallback |

```html
<ul>
  <li>
    Первый пункт
    <ol start="3">
      <li>Вложенный третий пункт</li>
    </ol>
  </li>
  <li>Второй пункт</li>
</ul>
```

- Inline content помещается в `<li>` или допустимую внутреннюю текстовую обёртку;
  такая обёртка при импорте не создаёт дополнительный paragraph.
- Вложенный список располагается внутри родительского `<li>` и соответствует
  list-item blocks в его `children`.
- `start` первого `numberedListItem` группы экспортируется как `<ol start="N">`,
  если `N` не равно `1`.
- Явный разрыв нумерации начинает новую `<ol start="N">` либо использует другое
  валидное HTML-представление, сохраняющее номер.
- Checklist сохраняет `checked` машиночитаемо; checkbox не подменяется символом в
  inline content. Конкретные `data-*` attrs и classes определяет профиль экспорта.
- Неподдерживаемый toggle list упрощается детерминированно до обычного list item с
  доступными детьми и создаёт diagnostic warning.

#### Interoperable HTML: импорт

- `<ul><li>` создаёт `bulletListItem`, `<ol><li>` — `numberedListItem`.
- `<ol start="N">` задаёт `start: N` первому элементу; следующие элементы
  продолжают нумерацию. Поддерживаемый явный номер `<li>` восстанавливается как
  `start` этого элемента.
- Вложенный `<ul>` или `<ol>` импортируется в `children`, а не в `InlineContent`.
- Task-list разметка создаёт `checkListItem` только при однозначном признаке типа
  и состояния; checkbox преобразуется в `checked` и не входит в текст.
- Поддерживаемая `<details>` / `<summary>` структура создаёт `toggleListItem`
  только при однозначном mapping и наличии типа в активной схеме.
- Inline-elements внутри `<li>` становятся `InlineContent[]`; однозначно
  вложенные block-level elements восстанавливаются в `children`.
- Malformed nesting, неизвестные attrs и отсутствующие в схеме типы используют
  безопасный fallback с diagnostic warning вместо падения импорта.

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
