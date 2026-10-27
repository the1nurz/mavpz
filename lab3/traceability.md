# Матриця трасування Завдання 3

## Межі й правила читання

Основа — `055054acf4eec22a5e2df4dfba26ab8734f96651`. [Специфікація і повний план](spec.md); джерела: [UC](../lab2/diagrams/use-cases.puml), [UC-10](../lab2/uc-10-detail.md), [REQ/NFR](../lab2/requirements.md), [ER](../model/er.mmd), Gherkin [catalog](../lab2/features/catalog.feature), [circulation](../lab2/features/circulation.feature), [notifications](../lab2/features/notifications.feature), [матриця №2](../lab2/traceability.md).

Немає створених sequence-діаграм. Шляхи в таблицях — плани відносно lab3, а не посилання на готові файли. Первинний ключ Gherkin-випадку — SC ID і порядковий номер рядка Examples; для звичайного Scenario — «єдиний». Номери рядків Examples рахуються від 1 без заголовка. Таблиця Given SC-18 є даними одного сценарію, не шістьма окремими випадками.

REQ у первинній таблиці — точні теги SC, навіть коли конкретний рядок Examples показує лише частину вимоги. ER перелічує сутності контексту, а не обов'язкові записи до сховища. NFR — застосовні умови з requirements.md, не теги SC і не виконані тести. Спільні умови інтерактивних потоків — доступ/сесія, захист і українські повідомлення; це не нові виняткові сценарії для кожного UC. NFR-01/02/12 не мають окремих sequence-сценаріїв, їх облік наведено в spec.md §10.

Прив'язка SC-12 до UC-01/05/06 — конкретизація наскрізного REQ-11 за змістом Examples. SC-18 має US-05; зв'язок із UC-10 непрямий через REQ-15 і його внутрішню чергу, не вигаданий тег US-06. Повторне використання SC-09 в UC-15 не збільшує кількість Gherkin-випадків. Q1–Q8 позначають відкриті питання специфікації.

## 1. Первинні плани для 48 конкретних Gherkin-випадків

| План | UC ID | Сценарій / гілка | Gherkin SC ID / конкретний випадок | REQ | NFR як умови | ER | Майбутній файл | Статус |
|---|---|---|---|---|---|---|---|---|
| D01 | UC-01 | Реєстрація читача | SC-01; єдиний | REQ-01 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader | `diagrams/uc-01-register.mmd` | Заплановано; не створено |
| D02 | UC-01 | Відмова: email зайнятий | SC-02; єдиний | REQ-02 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader | `diagrams/uc-01-email-taken.mmd` | Заплановано; не створено |
| D03 | UC-03 | Додати автора без книг | SC-03; 1: Author | REQ-03 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Author | `diagrams/uc-03-add-author.mmd` | Заплановано; не створено |
| D04 | UC-04 | Додати видавця без книг | SC-03; 2: Publisher | REQ-03 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Publisher | `diagrams/uc-04-add-publisher.mmd` | Заплановано; не створено |
| D05 | UC-05 | Видання зі співавторами без Copy | SC-04; єдиний | REQ-04 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Author, Publisher | `diagrams/uc-05-add-book.mmd` | Заплановано; не створено |
| D06 | UC-05 | Відмова: ISBN зайнятий | SC-05; єдиний | REQ-05 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book | `diagrams/uc-05-isbn-taken.mmd` | Заплановано; не створено |
| D07 | UC-06 | Додати Copy: active | SC-06; 1: active | REQ-06 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Copy | `diagrams/uc-06-add-active.mmd` | Заплановано; не створено |
| D08 | UC-06 | Додати Copy: lost | SC-06; 2: lost | REQ-06 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Copy | `diagrams/uc-06-add-lost.mmd` | Заплановано; не створено |
| D09 | UC-06 | Додати Copy: written_off | SC-06; 3: written_off | REQ-06 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Copy | `diagrams/uc-06-add-written-off.mmd` | Заплановано; не створено |
| D10 | UC-06 | Відмова: інвентарний номер зайнятий | SC-07; єдиний | REQ-07 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Copy, Book | `diagrams/uc-06-inventory-taken.mmd` | Заплановано; не створено |
| D11 | UC-07 | Пошук: ISBN знайдено | SC-08; 1: B1 / лише B1 | REQ-08 | NFR-04, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book | `diagrams/uc-07-isbn-found.mmd` | Заплановано; не створено |
| D12 | UC-07 | Пошук: ISBN відсутній | SC-08; 2: немає / порожній список | REQ-08 | NFR-04, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book | `diagrams/uc-07-isbn-empty.mmd` | Заплановано; не створено |
| D13 | UC-08 | Перегляд: active, відкритих Loan 0 | SC-09; 1: active, 0 | REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Copy, Loan | `diagrams/uc-08-active-0.mmd` | Заплановано; не створено |
| D14 | UC-08 | Перегляд: active, відкритих Loan 1 | SC-09; 2: active, 1 | REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Copy, Loan | `diagrams/uc-08-active-1.mmd` | Заплановано; не створено |
| D15 | UC-08 | Перегляд: lost, відкритих Loan 0 | SC-09; 3: lost, 0 | REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Copy, Loan | `diagrams/uc-08-lost-0.mmd` | Заплановано; не створено |
| D16 | UC-08 | Перегляд: written_off, відкритих Loan 0 | SC-09; 4: written_off, 0 | REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Copy, Loan | `diagrams/uc-08-written-off-0.mmd` | Заплановано; не створено |
| D17 | UC-08 | Перегляд: книга без Copy | SC-10; єдиний | REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Copy | `diagrams/uc-08-no-copies.mmd` | Заплановано; не створено |
| D18 | UC-01 | Відмова: Reader.email обов'язковий | SC-12; 1: Reader без email | REQ-11 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader | `diagrams/uc-01-missing-email.mmd` | Заплановано; не створено |
| D19 | UC-06 | Відмова: Copy.book_id | SC-12; 2: Copy з відсутньою Book | REQ-11 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Copy, Book | `diagrams/uc-06-missing-book.mmd` | Заплановано; не створено |
| D20 | UC-05 | Відмова: Book без автора | SC-12; 3: Book без автора | REQ-11 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Author | `diagrams/uc-05-no-author.mmd` | Заплановано; не створено |
| D21 | UC-05 | Відмова: два видавці Book | SC-12; 4: Book з двома видавцями | REQ-11 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Book, Publisher | `diagrams/uc-05-two-publishers.mmd` | Заплановано; не створено |
| D22 | UC-12 | Відмова: Copy.state unknown | SC-13; 1: Copy / Copy.state | REQ-12 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Copy | `diagrams/uc-12-invalid-state.mmd` | Заплановано; не створено |
| D23 | UC-12 | Зміна стану: active за відкритого Loan | SC-14; 1: active | REQ-21, REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Copy, Loan | `diagrams/uc-12-state-active.mmd` | Заплановано; не створено |
| D24 | UC-12 | Зміна стану: lost за відкритого Loan | SC-14; 2: lost | REQ-21, REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Copy, Loan | `diagrams/uc-12-state-lost.mmd` | Заплановано; не створено |
| D25 | UC-12 | Зміна стану: written_off за відкритого Loan | SC-14; 3: written_off | REQ-21, REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Copy, Loan | `diagrams/uc-12-state-written-off.mmd` | Заплановано; не створено |
| D26 | UC-09 | Бронювання: є фізично доступний Copy | SC-15; 1: є фізично доступний Copy | REQ-14 | NFR-05, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Reservation | `diagrams/uc-09-reserve-available.mmd` | Заплановано; не створено |
| D27 | UC-09 | Бронювання: усі Copy видані | SC-15; 2: усі Copy видані | REQ-14 | NFR-05, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Reservation | `diagrams/uc-09-reserve-loaned.mmd` | Заплановано; не створено |
| D28 | UC-09 | Бронювання: усі Copy lost або written_off | SC-15; 3: усі Copy lost або written_off | REQ-14 | NFR-05, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Reservation | `diagrams/uc-09-reserve-inactive.mmd` | Заплановано; не створено |
| D29 | UC-09 | Бронювання: немає Copy | SC-15; 4: немає Copy | REQ-14 | NFR-05, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Reservation | `diagrams/uc-09-reserve-no-copies.mmd` | Заплановано; не створено |
| D30 | UC-09 | Повторне бронювання | SC-16; єдиний | REQ-14 | NFR-05, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Reservation | `diagrams/uc-09-reserve-again.mmd` | Заплановано; не створено |
| D31 | UC-09 | Відмова: бронювання відсутньої Book | SC-17; єдиний | REQ-11 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Reservation | `diagrams/uc-09-missing-book.mmd` | Заплановано; не створено |
| D32 | UC-10 | Внутрішній крок: активна черга | SC-18; єдиний; таблиця Given — не Examples | REQ-15 | — | Reservation, Book | `diagrams/shared-active-queue.mmd` | Заплановано: внутрішній крок; не створено |
| D33 | UC-10 | Основний: видача без черги, рівні дати | SC-19; 1: due_at = loaned_at | REQ-11, REQ-13, REQ-16, REQ-18 | NFR-03, NFR-05, NFR-06, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-10-issue-equal-date.mmd` | Заплановано; не створено |
| D34 | UC-10 | Основний: видача без черги, пізніший due_at | SC-19; 2: due_at > loaned_at | REQ-11, REQ-13, REQ-16, REQ-18 | NFR-03, NFR-05, NFR-06, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-10-issue-later-date.mmd` | Заплановано; не створено |
| D35 | UC-10 | A1: видача першому читачеві черги | SC-20; єдиний; A1 | REQ-15, REQ-16, REQ-18 | NFR-05, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-10-first-reservation.mmd` | Заплановано; не створено |
| D36 | UC-10 | A3: відмова — lost | SC-21; 1: lost, 0, R1 | REQ-17, REQ-16 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-10-deny-lost.mmd` | Заплановано; не створено |
| D37 | UC-10 | A3: відмова — written-off | SC-21; 2: written_off, 0, R1 | REQ-17, REQ-16 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-10-deny-written-off.mmd` | Заплановано; не створено |
| D38 | UC-10 | A3: відмова — open-loan | SC-21; 3: active, 1, R1 | REQ-17, REQ-16 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-10-deny-open-loan.mmd` | Заплановано; не створено |
| D39 | UC-10 | A2: відмова — queue-priority | SC-21; 4: active, 0, R2 | REQ-17, REQ-16 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-10-deny-queue-priority.mmd` | Заплановано; не створено |
| D40 | UC-10 | A4: конкурентні запити | SC-22; єдиний; A4 | REQ-19, REQ-17 | NFR-03, NFR-05, NFR-06, NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-10-concurrent.mmd` | Заплановано; не створено |
| D41 | UC-10 | A5: due_at раніше loaned_at | SC-23; 1: due_at; A5 | REQ-13 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Loan | `diagrams/uc-10-invalid-due-date.mmd` | Заплановано; не створено |
| D42 | UC-11 | Відмова: returned_at раніше loaned_at | SC-23; 2: returned_at | REQ-13 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Loan | `diagrams/uc-11-invalid-return-date.mmd` | Заплановано; не створено |
| D43 | UC-11 | Повернення: Copy active | SC-24; 1: active | REQ-20, REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Loan, Copy | `diagrams/uc-11-return-active.mmd` | Заплановано; не створено |
| D44 | UC-11 | Повернення: Copy lost | SC-24; 2: lost | REQ-20, REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Loan, Copy | `diagrams/uc-11-return-lost.mmd` | Заплановано; не створено |
| D45 | UC-11 | Повернення: Copy written_off | SC-24; 3: written_off | REQ-20, REQ-09 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Loan, Copy | `diagrams/uc-11-return-written-off.mmd` | Заплановано; не створено |
| D46 | UC-13 | Передавання сповіщення A1 | SC-25; єдиний | REQ-22, REQ-24 | NFR-09, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-13-transfer.mmd` | Заплановано; не створено |
| D47 | UC-17 | Помилка A1 у контексті UC-13 | SC-26; єдиний; розширення UC-13, також UC-10 X5 | REQ-23, REQ-24 | NFR-09, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-17-transfer-failure.mmd` | Заплановано; не створено |
| D48 | UC-10 | A6: після повідомлення Copy вже виданий | SC-27; єдиний; A6 | REQ-24, REQ-16, REQ-17, REQ-19 | NFR-07, NFR-08, NFR-09, NFR-10, NFR-11 | Reader, Book, Copy, Loan, Reservation | `diagrams/uc-10-after-notification.mmd` | Заплановано; не створено |

## 2. Винятки UC-10 без прямих Gherkin-прикладів — 7 планів

X1 та X2 розділені за різними причинами/відповідями; X3 — за моментом збою. Усі джерела тут — uc-10-detail.md та застосовні REQ/NFR; SC-12 лише аналогія для X2. X5 враховано окремим посиланням нижче.

| План | UC ID | Сценарій / гілка | Gherkin SC ID / конкретний випадок | REQ | NFR як умови | ER | Майбутній файл | Статус |
|---|---|---|---|---|---|---|---|---|
| D49 | UC-10 | X1: немає чинної сесії | —; X1 | — | NFR-07, NFR-09, NFR-10, NFR-11 | Reader, Book, Copy, Loan, Reservation (контекст; за відмови доступ до Store може не виконуватися) | `diagrams/uc-10-x1-session.mmd` | Заплановано: без прямого Gherkin; не створено |
| D50 | UC-10 | X1: немає права видачі | —; X1 | — | NFR-08, NFR-09, NFR-11 | Reader, Book, Copy, Loan, Reservation (контекст; за відмови доступ до Store може не виконуватися) | `diagrams/uc-10-x1-forbidden.mmd` | Заплановано: без прямого Gherkin; не створено |
| D51 | UC-10 | X2: неповні дані видачі | —; X2 | REQ-11 | NFR-07, NFR-08, NFR-11 | Reader, Book, Copy, Loan, Reservation (контекст; за відмови доступ до Store може не виконуватися) | `diagrams/uc-10-x2-fields.mmd` | Заплановано: без прямого Gherkin; не створено |
| D52 | UC-10 | X2: відсутні посилання видачі | —; X2 | REQ-11 | NFR-07, NFR-08, NFR-11 | Reader, Book, Copy, Loan, Reservation (контекст; за відмови доступ до Store може не виконуватися) | `diagrams/uc-10-x2-references.mmd` | Заплановано: без прямого Gherkin; не створено |
| D53 | UC-10 | X3: збій до фіксації | —; X3 | REQ-18, REQ-19 | NFR-11 | Reader, Book, Copy, Loan, Reservation (контекст; за відмови доступ до Store може не виконуватися) | `diagrams/uc-10-x3-before-commit.mmd` | Заплановано: без прямого Gherkin; не створено |
| D54 | UC-10 | X3: відповідь втрачена після фіксації | —; X3 | REQ-18 | NFR-05 | Reader, Book, Copy, Loan, Reservation (контекст; за відмови доступ до Store може не виконуватися) | `diagrams/uc-10-x3-after-commit.mmd` | Заплановано: без прямого Gherkin; не створено |
| D55 | UC-10 | X4: усі 50 HTTP-слотів зайняті | —; X4 | — | NFR-06, NFR-11 | Reader, Book, Copy, Loan, Reservation (контекст; за відмови доступ до Store може не виконуватися) | `diagrams/uc-10-x4-capacity.mmd` | Заплановано: без прямого Gherkin; не створено |

## 3. Внутрішній UC-15 — 4 плани

Це повторно використовувані обчислення, викликані UC-08/10/11/12/13. Самостійного актора та операції «записати доступність» немає. SC-10 покриває порожню колекцію у викликачі (D17); для неіснуючого Copy UC-15 не запускається. SC-14/24 підтверджують застосування формули після змін, їх первинні рядки залишаються в розділі 1.

| План | UC ID | Сценарій / гілка | Gherkin SC ID / конкретний випадок | REQ | NFR як умови | ER | Майбутній файл | Статус |
|---|---|---|---|---|---|---|---|---|
| D56 | UC-15 | Внутрішня доступність: active, Loan 0 | SC-09; 1: active, 0; повторно використовується SC-14/SC-24 | REQ-09 | — | Copy, Loan | `diagrams/uc-15-active-0.mmd` | Заплановано: внутрішній UC; непрямий Gherkin; не створено |
| D57 | UC-15 | Внутрішня доступність: active, Loan 1 | SC-09; 2: active, 1; повторно використовується SC-14/SC-24 | REQ-09 | — | Copy, Loan | `diagrams/uc-15-active-1.mmd` | Заплановано: внутрішній UC; непрямий Gherkin; не створено |
| D58 | UC-15 | Внутрішня доступність: lost, Loan 0 | SC-09; 3: lost, 0; повторно використовується SC-14/SC-24 | REQ-09 | — | Copy, Loan | `diagrams/uc-15-lost-0.mmd` | Заплановано: внутрішній UC; непрямий Gherkin; не створено |
| D59 | UC-15 | Внутрішня доступність: written_off, Loan 0 | SC-09; 4: written_off, 0; повторно використовується SC-14/SC-24 | REQ-09 | — | Copy, Loan | `diagrams/uc-15-written-off-0.mmd` | Заплановано: внутрішній UC; непрямий Gherkin; не створено |

## 4. Структурне покриття, відкриті випадки та недубльовані зв'язки — 5 рядків

| Облік | UC ID | Сценарій / гілка | Gherkin SC ID / конкретний випадок | REQ | NFR як умови | ER | План файла / зв'язок | Статус |
|---|---|---|---|---|---|---|---|---|
| S01 | — | Структурний контракт, не дія застосунку | SC-11; єдиний | REQ-10 | — | Publisher, Author, Book, Copy, Reader, Loan, Reservation | —; tools/audit.js та окремий перегляд, не sequence | Структурно; діаграма не потрібна за ADR-L2-0002 |
| Q02 | UC-09 лише контекст; актор операції не узгоджений | Відсутній Reader у Reservation, бібліотекар у When | SC-12; 5: Reservation з відсутнім Reader | REQ-11 | NFR-08 (конфлікт прав) | Reservation, Reader | —; чекає рішення Q2 | Відкрите; не планувати новий UC або право |
| Q03 | —; UC-12 не керує Reservation | Запис Reservation.status unknown без визначеної користувацької операції | SC-13; 2: Reservation / Reservation.status | REQ-12 | NFR-08 (операція/право не визначені) | Reservation | —; чекає рішення Q3 | Внутрішній контракт; потребує рішення, без діаграми користувацької операції |
| A02 | UC-02 | Абстрактне ведення каталогу | SC-03/04/05; повторні зв'язки, не нові випадки | REQ-03, REQ-04, REQ-05 | NFR-08 | Author, Publisher, Book | D03–D06 у розділі 1 | Узагальнення UC-03/04/05; окремий файл не планується |
| X05 | UC-10 X5; UC-13/17 | Помилка сповіщення належить іншій взаємодії | SC-26; повторне посилання | REQ-23, REQ-24 | NFR-11 | Reader, Book, Copy, Loan, Reservation | D47: `diagrams/uc-17-transfer-failure.mmd` | Заплановано через розширення UC-13, не новий незалежний сценарій |

## 5. Баланс повноти

- 15 чинних UC: UC-01, UC-02, UC-03, UC-04, UC-05, UC-06, UC-07, UC-08, UC-09, UC-10, UC-11, UC-12, UC-13, UC-15, UC-17.
- 27 визначень SC-01–SC-27, 51 конкретний Gherkin-випадок: 48 первинних планів + S01 + Q02 + Q03 = 51. Це повнота обліку, не твердження про готовність діаграм або вирішення Q02/Q03.
- 24 REQ мають облік: REQ-10 структурний; REQ-11/12 включають відкриті приклади.
- 59 майбутніх файлів: 48 первинних + 7 виняткових + 4 внутрішніх. Жоден .mmd на Етапі 2 не створюється.
- Матриця має 64 рядки обліку: 59 планів + 5 спеціальних. A02/X05 та внутрішні повторні SC не рахуються новими Gherkin-випадками.
- UC-10: основний D33/D34; A1 D35; A2 D39; A3 D36–D38; A4 D40; A5 D41; A6 D48; X1 D49/D50; X2 D51/D52; X3 D53/D54; X4 D55; X5 X05 → D47.
- Реалізованих діаграм: 0. Рендер, перевірки діаграм і поведінкові тести: не виконані.

Перевірка Етапу 2: зіставити первинні ключі SC/Examples зі всіма feature-файлами, точні REQ-теги з первинними рядками, існування NFR/ER, унікальність 59 шляхів і відповідність плану специфікації. Невирішені рядки є явними винятками обліку, а не замаскованим реалізованим покриттям.
