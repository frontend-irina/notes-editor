# Markdown для блока Paragraph

## Назначение

Документ определяет импорт и экспорт блока `paragraph` между публичной моделью
редактора и Markdown.

Общие правила формата, безопасности, diagnostics и lossy-преобразований описаны в
[общей спецификации Markdown](../../markdown.md). Модель блока определена в
[paragraph.md](./paragraph.md), а inline-разметка — в
[inline-content.md](../../inline-content.md).

## Представление

Обычный Paragraph представлен текстовым параграфом Markdown без специального
префикса:

```md
Обычный параграф с **жирным текстом** и [ссылкой](https://example.com).
```

- Один публичный `paragraph` соответствует одному Markdown paragraph.
- Соседние Paragraph разделяются пустой строкой.
- Перенос строк внутри одного Markdown paragraph нормализуется согласно правилам
  soft break и hard break поддерживаемого диалекта.
- Block markers других типов (`#`, `>`, list markers, fences) не являются частью
  обычного Paragraph и должны экранироваться при экспорте, если встречаются как
  текст в структурно значимой позиции.

## Импорт Markdown

### Создание блока

- Обычный текстовый paragraph создаёт `ParagraphBlock`.
- Импортированный блок получает новый UUID v7, поскольку Markdown не хранит
  внутренний `id`.
- `props` принимают значения по умолчанию:
  - `backgroundColor: "default"`;
  - `textColor: "default"`;
  - `textAlignment: "left"`.
- Текст и поддерживаемая inline-разметка преобразуются в `InlineContent[]`.
- Markdown paragraph без видимого содержимого не должен создавать произвольное
  число пустых blocks из разделительных пустых строк.
- Если весь импортируемый документ пуст, общий импортёр создаёт минимальный пустой
  Paragraph согласно инварианту документа.

### Inline content

Внутри Paragraph поддерживаются общие Markdown mappings:

| Markdown | Публичное inline-представление |
| --- | --- |
| `**text**` / `__text__` | `StyledText` с `bold: true` |
| `*text*` / `_text_` | `StyledText` с `italic: true` |
| `~~text~~` | `StyledText` с `strike: true` |
| `` `text` `` | `StyledText` с `code: true` |
| `[label](href)` | `Link` |
| обычный текст | `StyledText` со `styles: {}` |

- Совместимые стили могут комбинироваться.
- Соседние фрагменты с одинаковыми styles нормализуются.
- Синтаксис разметки не включается в `text` распознанного inline content.
- Неизвестная или некорректная inline-конструкция сохраняется как читаемый текст,
  если это безопасно.

### Переносы строк

- Soft line break внутри исходного Markdown paragraph не создаёт новый Block.
- Hard break преобразуется в поддерживаемый перенос строки inline content.
- Пустая строка завершает текущий Paragraph и начинает следующий block при наличии
  последующего содержимого.
- Конкретная нормализация пробелов вокруг переносов должна совпадать с общим
  Markdown parser и проверяться семантически, а не побайтово.

## Экспорт Markdown

- `content` экспортируется как обычный Markdown paragraph.
- Поддерживаемые `bold`, `italic`, `strike`, `code` и `Link` преобразуются в
  соответствующую Markdown-разметку.
- `underline`, inline colors и background colors не имеют переносимого
  CommonMark-представления и теряются с warning.
- `id`, `backgroundColor`, `textColor` и `textAlignment` уровня блока не
  экспортируются.
- Текст должен экранироваться так, чтобы повторный импорт не превращал Paragraph
  в heading, quote, list item, thematic break или code block.
- Соседние top-level Paragraph разделяются одной пустой строкой в нормализованном
  выводе.

## Дочерние блоки

Markdown не имеет общего переносимого способа вложить произвольные blocks под
Paragraph.

- `children` не входят в inline-содержимое родительского Paragraph.
- При lossy-экспорте дети Paragraph выводятся после него как последовательные
  blocks без исходной вложенности, аналогично BlockNote.
- Потеря вложенности должна сопровождаться warning расширенного API.
- При последующем импорте такие blocks становятся соседними, а не `children`
  исходного Paragraph.

## Round trip

Для простого Paragraph гарантируется семантический цикл:

```text
ParagraphBlock → Markdown → ParagraphBlock
```

Сохраняются:

- тип `paragraph`;
- видимый текст;
- поддерживаемые inline-стили;
- ссылки и их `href`.

Не сохраняются:

- исходный `id`;
- block props;
- неподдерживаемые inline-стили;
- вложенность `children`.

## Критерии приёмки

1. Обычный Markdown paragraph импортируется как `ParagraphBlock`.
2. Импортированный Paragraph получает UUID v7 и default props.
3. Поддерживаемое inline content преобразуется без потери видимого текста.
4. Пустые строки разделяют blocks и не создают лишние пустые Paragraph.
5. Экспорт не добавляет block marker к обычному Paragraph.
6. Структурно значимые символы в начале текста корректно экранируются.
7. Соседние Paragraph разделяются пустой строкой.
8. Потеря props, unsupported styles и вложенности является детерминированной и
   отражается в warnings.
9. Round trip сохраняет семантику простого Paragraph и поддерживаемого inline
   content.

## Открытые вопросы для проверки по эталону

- точная нормализация soft и hard breaks;
- сохранение ведущих и завершающих пробелов;
- экранирование текста, начинающегося с цифры и точки;
- поведение нескольких последовательных пустых Paragraph;
- экспорт Paragraph с вложенными blocks разных типов;
- обработка raw HTML внутри Markdown paragraph.
