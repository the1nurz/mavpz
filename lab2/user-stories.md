# User Stories — «Бібліотека»

Основа: [специфікація](spec.md) та [EARS-вимоги](requirements.md).
Кожний критерій є очікуваною поведінкою майбутнього застосунку.
Теги `@US-*`, `@REQ-*`, `@SC-*` у `.feature` задають зв'язки з історіями,
вимогами й унікальними визначеннями сценаріїв. Scenario Outline містить
одне визначення та кілька конкретних прикладів. Відхилення не змінює дані.
Посилання нижче ведуть до файлів, а ID однозначно визначають сценарії в них.

## US-01 — Реєстрація читача

As a librarian, I want to register readers, so that loans and reservations can refer to identified readers.

Критерії прийняття: коректні дані створюють Reader з новим UUID та повертають
id; зайнятий email відхиляється з поясненням без зміни даних. Обов'язковість
полів перевіряється також загальним контрактом US-09.

EARS: [REQ-01, REQ-02](requirements.md).
Gherkin: [SC-01, SC-02](features/catalog.feature).

## US-02 — Облік авторів, видавців і видань

As a librarian, I want to maintain authors, publishers and book editions, so that the catalogue represents editions and their contributors accurately.

Критерії прийняття: Author і Publisher можуть існувати без книг; новий Book
має UUID, унікальний ISBN, одного наявного видавця й одного або більше авторів;
примірники для створення книги не потрібні. Повторний ISBN відхиляється.

EARS: [REQ-03–REQ-05](requirements.md).
Gherkin: [SC-03–SC-05](features/catalog.feature).

## US-03 — Облік фізичних примірників

As a librarian, I want to record copies and their physical state, so that each physical item has a unique inventory identity and an accurate state.

Критерії прийняття: Copy створюється з UUID, посиланням на Book, унікальним
інвентарним номером і допустимим state. Повторний номер відхиляється.
Зміна фізичного стану не закриває Loan і не змінює історію; доступність
обчислюється заново з урахуванням відкритої видачі.

EARS: [REQ-06, REQ-07, REQ-09, REQ-21](requirements.md).
Gherkin: [SC-06, SC-07, SC-14](features/catalog.feature).

## US-04 — Пошук і фізична доступність

As a reader, I want to find an edition by ISBN and inspect its copies, so that I can distinguish catalogue presence from physical availability.

Критерії прийняття: точний ISBN повертає відповідний Book або порожній
результат. Для кожного Copy доступність істинна лише за state active
та відсутності відкритого Loan. Книга без Copy явно показує їх відсутність.
Фізична доступність не означає право обійти чергу бронювань.

EARS: [REQ-08, REQ-09](requirements.md).
Gherkin: [SC-08–SC-10](features/catalog.feature).

## US-05 — Бронювання книги та черга

As a reader, I want to reserve an edition, so that my request participates in the agreed reservation queue.

Критерії прийняття: створюється активна Reservation для наявних Reader і Book
за будь-якої доступності, включно з відсутністю Copy. Повторне бронювання
має окремий UUID і не замінює попереднє. Черга містить лише active, сортується
за reserved_at, потім за канонічним UUID нижнього регістру лексикографічно.
Посилання на відсутню книгу відхиляється.

EARS: [REQ-11, REQ-14, REQ-15](requirements.md).
Gherkin: [SC-15–SC-18](features/circulation.feature).

## US-06 — Видача з перевіркою права

As a librarian, I want to issue a physically available copy only to an eligible reader, so that reservations are respected and simultaneous loans cannot conflict.

Критерії прийняття: без активної черги видача дозволена будь-якому наявному
читачеві; за черги — першому. Створюється Loan з UUID, коректними датами
й порожнім returned_at; виконана перша Reservation атомарно стає fulfilled,
інші незмінні. Lost, written_off, відкрита видача або пріоритет іншого читача
спричиняють відмову. З двох одночасних коректних спроб без черги успішна
лише одна. Некоректна хронологія відхиляється; сповіщення не обходить перевірку.

EARS: [REQ-13, REQ-15–REQ-19, REQ-24](requirements.md).
Gherkin: [SC-19–SC-23](features/circulation.feature),
[SC-27](features/notifications.feature).

## US-07 — Повернення примірника

As a librarian, I want to record the return of an open loan, so that loan history remains accurate and physical availability can be recalculated.

Критерії прийняття: returned_at не раніше loaned_at; рівність допустима.
Повернення зберігає інші поля та історію, не змінює Copy.state і повторно
обчислює доступність. Lost і written_off залишаються недоступними навіть
після закриття Loan. Раніша дата відхиляється без зміни даних.

EARS: [REQ-09, REQ-13, REQ-20](requirements.md).
Gherkin: [SC-23, SC-24](features/circulation.feature).

## US-08 — Сповіщення за припущенням A1

As a reader, I want to receive a notification when a copy can be offered to me as the first reader in the queue, so that I know when to contact the library.

Критерії прийняття: зовнішньому сервісу передаються email першого читача,
id і назва Book; помилка показується бібліотекарю з посиланням на Book.
Передавання та помилка не змінюють Loan, Reservation, Copy чи чергу.
Доставка не гарантує видачу: право перевіряється повторно. Сервіс — зовнішній
актор згідно з погодженим A1, без нової сутності ER.

EARS: [REQ-22–REQ-24](requirements.md).
Gherkin: [SC-25–SC-27](features/notifications.feature),
[SC-11](features/catalog.feature) для структури ER.

## US-09 — Цілісність обліку

As a librarian, I want records to satisfy the agreed data contract, so that catalogue and circulation data remain consistent.

Критерії прийняття: модель містить 7 сутностей, 30 атрибутів і 7 погоджених
зв'язків, UUID PK/FK та прямий Author–Book M:N; доступність не зберігається
окремо. Відсутні обов'язкові поля, неіснуючі посилання, порушені кардинальності
та недопустимі state/status відхиляються з позначенням порушення.
Порожній Loan.returned_at залишається дозволеним для відкритої видачі.

EARS: [REQ-10–REQ-12](requirements.md).
Gherkin: [SC-11–SC-13](features/catalog.feature),
[SC-19](features/circulation.feature) для порожнього returned_at.

## Покриття EARS на цьому етапі

| EARS | User Story | Сценарії |
|---|---|---|
| REQ-01 | US-01 | SC-01 |
| REQ-02 | US-01 | SC-02 |
| REQ-03 | US-02 | SC-03 |
| REQ-04 | US-02 | SC-04 |
| REQ-05 | US-02 | SC-05 |
| REQ-06 | US-03 | SC-06 |
| REQ-07 | US-03 | SC-07 |
| REQ-08 | US-04 | SC-08 |
| REQ-09 | US-03, US-04, US-07 | SC-09, SC-10, SC-14, SC-24 |
| REQ-10 | US-09 | SC-11 |
| REQ-11 | US-05, US-09 | SC-12, SC-17, SC-19 |
| REQ-12 | US-09 | SC-13 |
| REQ-13 | US-06, US-07 | SC-23 |
| REQ-14 | US-05 | SC-15, SC-16 |
| REQ-15 | US-05, US-06 | SC-18, SC-20 |
| REQ-16 | US-06 | SC-19, SC-20, SC-21, SC-27 |
| REQ-17 | US-06 | SC-21, SC-22, SC-27 |
| REQ-18 | US-06 | SC-19, SC-20 |
| REQ-19 | US-06 | SC-22, SC-27 |
| REQ-20 | US-07 | SC-24 |
| REQ-21 | US-03 | SC-14 |
| REQ-22 | US-08 | SC-25 |
| REQ-23 | US-08 | SC-26 |
| REQ-24 | US-06, US-08 | SC-25, SC-26, SC-27 |

Непокритих ID немає. REQ-10 має структурний сценарій перевірки контракту;
він не є операцією користувача застосунку. Приклади REQ-11 представляють
три класи порушень, а не вичерпний перебір усіх полів. Файли `.feature`
не мають реалізацій кроків: синтаксична перевірка й наявність зв'язків
не доводять виконання поведінки застосунком. Політики строків бронювання,
скасування та повторних спроб доставки не додаються. Повна матриця ER →
EARS → Story → Gherkin → Use Case належить наступним етапам.
