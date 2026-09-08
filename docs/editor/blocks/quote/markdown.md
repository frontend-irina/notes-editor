# Markdown для блока Quote

## Назначение

Документ определяет импорт и экспорт блока `quote` между публичной моделью
редактора и Markdown.

Общие правила формата, безопасности, diagnostics и lossy-преобразований описаны в
[общей спецификации Markdown](../../markdown.md). Модель блока определена в
[quote.md](./quote.md), а inline-разметка — в
[inline-content.md](../../inline-content.md).

## Представление

Quote представлен CommonMark blockquote: каждая физическая строка начинается с
маркера `>`.

```md
> Текст с **жирным** начертанием и [ссылкой](https://example.com).
```

Пробел после `>` используется в каноническом экспорте. Маркер не является частью
`InlineContent[]`.

## Импорт Markdown

- Строка с `>` создаёт `QuoteBlock`, если тип зарегистрирован в активной схеме.
- Пробел после маркера рекомендуется, но не обязателен для валидного CommonMark
  blockquote.
- Текст, ссылки и поддерживаемые inline-стили преобразуются по общим правилам.
- Продолжающиеся строки простого blockquote объединяются в content одного Quote с
  нормализованными soft/hard breaks.
- Пустой blockquote создаёт Quote с `content: []`.
- Импортированный Quote получает новый UUID v7; `backgroundColor` и `textColor`
  получают значение `"default"`.
- Несколько block-level конструкций внутри blockquote нормализуются в
  последовательность поддерживаемых blocks с сохранением читаемого текста и
  warning при неоднозначности.
- Дополнительный уровень `>` восстанавливается через `children` только при
  однозначном mapping; иначе вложенность упрощается с warning.

## Inline content

Внутри Quote поддерживаются общие Markdown mappings:

| Markdown | Публичное inline-представление |
| --- | --- |
| `**text**` / `__text__` | `StyledText` с `bold: true` |
| `*text*` / `_text_` | `StyledText` с `italic: true` |
| `~~text~~` | `StyledText` с `strike: true` |
| `` `text` `` | `StyledText` с `code: true` |
| `[label](href)` | `Link` |
| обычный текст | `StyledText` со `styles: {}` |

Совместимые стили могут комбинироваться. Соседние фрагменты с одинаковыми styles
нормализуются.

## Экспорт Markdown

- Каждая физическая строка Quote получает префикс `> `.
- Пустая строка внутри цитаты сериализуется как строка `>`.
- Поддерживаемые inline-стили и ссылки сериализуются после маркера.
- Quote отделяется от соседних top-level blocks пустой строкой.
- `id`, `backgroundColor` и `textColor` не экспортируются.
- `underline`, inline colors и background colors теряются с warning, поскольку у
  них нет переносимого CommonMark-представления.

## Дочерние блоки

- `children` не входят в inline content родительского Quote.
- При lossy-экспорте дети могут выводиться после Quote как top-level blocks.
- Потеря исходной вложенности сопровождается warning.
- Вложенный CommonMark blockquote используется только тогда, когда его mapping в
  публичные `children` однозначен и поддерживается общим exporter.

## Round trip

Для простого Quote гарантируется семантический цикл:

```text
QuoteBlock → Markdown → QuoteBlock
```

Сохраняются тип, видимый текст, поддерживаемые inline-стили и ссылки. Новый ID,
default block colors и потеря неподдерживаемых styles считаются ожидаемой
нормализацией.

## Критерии приёмки

1. CommonMark blockquote импортируется как `QuoteBlock`.
2. Маркер `>` не попадает в `InlineContent[]`.
3. Пустой blockquote создаёт Quote с `content: []`.
4. Импортированный Quote получает UUID v7 и default props.
5. Экспорт добавляет `>` к каждой физической строке Quote.
6. Поддерживаемое inline content сохраняет видимый текст и семантику.
7. Потери props, unsupported styles и вложенности отражаются в warnings.
8. Round trip простого Quote сохраняет тип и поддерживаемое содержимое.

## Открытые вопросы для проверки по эталону

- нормализация lazy continuation lines;
- точная обработка нескольких Paragraph внутри одного blockquote;
- mapping вложенных blockquote в `children`;
- экспорт пустых строк и hard breaks;
- экспорт Quote с дочерними blocks разных типов.
