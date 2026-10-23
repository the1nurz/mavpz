## 1. Повний Mermaid-код ER-діаграми «Бібліотека»

Код побудовано виключно за наданою специфікацією: 7 сутностей, 30 атрибутів, 7 зв'язків. Додаткових сутностей та атрибутів немає.

\#chatgpt-mermaid-\_r_ds\_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,Segoe UI,Helvetica,Apple Color Emoji,Arial,sans-serif,Segoe UI Emoji,Segoe UI Symbol;font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-\_r_ds\_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_ds\_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-\_r_ds\_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_ds\_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_ds\_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-\_r_ds\_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-\_r_ds\_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-\_r_ds\_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-\_r_ds\_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-\_r_ds\_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-\_r_ds\_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_ds\_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-\_r_ds\_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,Segoe UI,Helvetica,Apple Color Emoji,Arial,sans-serif,Segoe UI Emoji,Segoe UI Symbol;font-size:16px;}#chatgpt-mermaid-\_r_ds\_ p{margin:0;}#chatgpt-mermaid-\_r_ds\_ .entityBox{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_ds\_ .relationshipLabelBox{fill:rgb(48, 48, 48);opacity:0.7;background-color:rgb(48, 48, 48);}#chatgpt-mermaid-\_r_ds\_ .relationshipLabelBox rect{opacity:0.5;}#chatgpt-mermaid-\_r_ds\_ .labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_ds\_ .edgeLabel{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_ds\_ .edgeLabel .label rect{fill:rgb(0, 0, 0);}#chatgpt-mermaid-\_r_ds\_ .edgeLabel .label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_ds\_ .edgeLabel .label{fill:rgb(31, 78, 148);font-size:14px;}#chatgpt-mermaid-\_r_ds\_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,Segoe UI,Helvetica,Apple Color Emoji,Arial,sans-serif,Segoe UI Emoji,Segoe UI Symbol;color:rgb(237, 237, 237);}#chatgpt-mermaid-\_r_ds\_ .edge-pattern-dashed{stroke-dasharray:8,8;}#chatgpt-mermaid-\_r_ds\_ .node rect,#chatgpt-mermaid-\_r_ds\_ .node circle,#chatgpt-mermaid-\_r_ds\_ .node ellipse,#chatgpt-mermaid-\_r_ds\_ .node polygon{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-\_r_ds\_ .relationshipLine{stroke:rgb(175, 175, 175);stroke-width:1px;fill:none;}#chatgpt-mermaid-\_r_ds\_ .marker{fill:none!important;stroke:rgb(175, 175, 175)!important;stroke-width:1;}#chatgpt-mermaid-\_r_ds\_ [data-look=neo].labelBkg{background-color:rgba(48, 48, 48, 0.5);}#chatgpt-mermaid-\_r_ds\_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].node rect,#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].cluster rect,#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-\_r_ds\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-\_r_ds\_-gradient);stroke-width:1px;}#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-\_r_ds\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-\_r_ds\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_ds\_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-\_r_ds\_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-\_r_ds\_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,Segoe UI,Helvetica,Apple Color Emoji,Arial,sans-serif,Segoe UI Emoji,Segoe UI Symbol;}PUBLISHERuuididPKstringnamestringcountryAUTHORuuididPKstringfull_nameintbirth_yearBOOKuuididPKstringtitlestringisbnUKintpublication_yearuuidpublisher_idFKCOPYuuididPKuuidbook_idFKstringinventory_numberUKstringstateREADERuuididPKstringfull_namestringemailUKdatetimeregistered_atLOANuuididPKuuidreader_idFKuuidcopy_idFKdatetimeloaned_atdatetimedue_atdatetimereturned_atRESERVATIONuuididPKuuidreader_idFKuuidbook_idFKdatetimereserved_atstringstatuspublisheswriteshasborrowsis lent inmakesis reserved in

## 2. Відповідності FK → PK

| Зовнішній ключ (FK)     | Первинний ключ (PK) |
| ----------------------- | ------------------- |
| `BOOK.publisher_id`     | `PUBLISHER.id`      |
| `COPY.book_id`          | `BOOK.id`           |
| `LOAN.reader_id`        | `READER.id`         |
| `LOAN.copy_id`          | `COPY.id`           |
| `RESERVATION.reader_id` | `READER.id`         |
| `RESERVATION.book_id`   | `BOOK.id`           |

Усі шість зовнішніх ключів мають тип `uuid` і посилаються на первинні ключі такого самого типу.

Зв'язок `AUTHOR–BOOK` є прямим M:N на концептуальному ER-рівні. Окремого FK або проміжної сутності `BookAuthor` немає.

## 3. Обмеження та NULL

Обов'язковість атрибутів: усі атрибути обов'язкові, крім двох:

- `AUTHOR.birth_year` — допускає NULL, якщо рік народження невідомий.
- `LOAN.returned_at` — допускає NULL, доки примірник не повернуто.

Обмеження видач:

- Для одного `COPY` одночасно допускається не більше однієї видачі з `returned_at = NULL`.
- `due_at >= loaned_at`.
- Якщо `returned_at` заповнено, `returned_at >= loaned_at`.

Стани примірника: `COPY.state` приймає лише `active`, `lost`, `written_off`. Примірник доступний фізично, якщо він має стан `active` і не має відкритої видачі. Окремий атрибут доступності не створюється.

Бронювання: `RESERVATION.status` приймає `active`, `fulfilled`, `cancelled`, `expired`. Бронювання книги дозволено незалежно від наявності доступних примірників.

Для однієї пари `reader_id, book_id` допускається максимум одне активне бронювання. Неактивні бронювання залишаються в історії, після них дозволено нові.

Активна черга впорядковується за `reserved_at` за зростанням, а за однакових значень — за UUID `id` у канонічному нижньому регістрі. Перше активне бронювання має пріоритет, а виконане переходить у `fulfilled`.

## 4. Нормалізація

1НФ: усі атрибути атомарні, повторюваних груп немає.

2НФ: усі кандидатні ключі одноатрибутні, тому часткових залежностей від складеного ключа немає.

3НФ: за прийнятими доменними припущеннями неключові атрибути не залежать транзитивно від ключів.

Функціональні залежності:

- `PUBLISHER.id → name, country`
- `AUTHOR.id → full_name, birth_year`
- `BOOK.id → title, isbn, publication_year, publisher_id`
- `COPY.id → book_id, inventory_number, state`
- `READER.id → full_name, email, registered_at`
- `LOAN.id → reader_id, copy_id, loaned_at, due_at, returned_at`
- `RESERVATION.id → reader_id, book_id, reserved_at, status`

Додаткові кандидатні ключі: `BOOK.isbn`, `COPY.inventory_number`, `READER.email`.

Дані видавця, видання та читача не дублюються у пов'язаних сутностях. Історичні пари учасників видач і бронювань не є унікальними.

## 5. Неоднозначності та обмеження представлення

Є одна важлива особливість: у специфікації для `AUTHOR–BOOK` задано `0..*` книг на автора та `1..*` авторів на книгу. Запис `AUTHOR }|--o{ BOOK` відтворює ці кардинальності відповідно до Mermaid.

Інших суперечностей у заданих структурних вимогах не виявлено.

Водночас Mermaid ER не може повністю відобразити обов'язковість/NULL, дозволені значення `state` і `status`, часові перевірки, унікальність лише активних бронювань та правила черги. Ці обмеження потрібно перевіряти окремо.

## 6. Перевірка критеріїв

| Критерій                       | Результат                |
| ------------------------------ | ------------------------ |
| K1 — PK/FK/UUID                | Відповідає               |
| K2 — 7 зв'язків                | Відповідає               |
| K3 — 1НФ, 2НФ, 3НФ             | Обґрунтовано вручну      |
| K4 — прямий M:N                | Відповідає               |
| K5 — 7 сутностей, 30 атрибутів | Відповідає               |
| K6 — CLI, npm, SVG/PNG         | Не перевірено виконанням |

Висновок: наведена ER-модель структурно відповідає специфікації. Для підтвердження K6 необхідно зберегти код у `model/er.mmd`, згенерувати SVG/PNG за допомогою Mermaid CLI та виконати перевірки в репозиторії.