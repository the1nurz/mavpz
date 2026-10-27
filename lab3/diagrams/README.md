# Sequence-діаграми Завдання 3

Створено 59 Mermaid sequenceDiagram за [специфікацією](../spec.md) та [матрицею](../traceability.md). Ідентифікатори D01–D59 збігаються з планом Етапу 2.

| План | UC | Сценарій / Gherkin | Файл |
|---|---|---|---|
| D01 | UC-01 | Реєстрація читача; SC-01; єдиний | [uc-01-register.mmd](uc-01-register.mmd) |
| D02 | UC-01 | Відмова: email зайнятий; SC-02; єдиний | [uc-01-email-taken.mmd](uc-01-email-taken.mmd) |
| D03 | UC-03 | Додати автора без книг; SC-03; 1: Author | [uc-03-add-author.mmd](uc-03-add-author.mmd) |
| D04 | UC-04 | Додати видавця без книг; SC-03; 2: Publisher | [uc-04-add-publisher.mmd](uc-04-add-publisher.mmd) |
| D05 | UC-05 | Видання зі співавторами без Copy; SC-04; єдиний | [uc-05-add-book.mmd](uc-05-add-book.mmd) |
| D06 | UC-05 | Відмова: ISBN зайнятий; SC-05; єдиний | [uc-05-isbn-taken.mmd](uc-05-isbn-taken.mmd) |
| D07 | UC-06 | Додати Copy: active; SC-06; 1: active | [uc-06-add-active.mmd](uc-06-add-active.mmd) |
| D08 | UC-06 | Додати Copy: lost; SC-06; 2: lost | [uc-06-add-lost.mmd](uc-06-add-lost.mmd) |
| D09 | UC-06 | Додати Copy: written_off; SC-06; 3: written_off | [uc-06-add-written-off.mmd](uc-06-add-written-off.mmd) |
| D10 | UC-06 | Відмова: інвентарний номер зайнятий; SC-07; єдиний | [uc-06-inventory-taken.mmd](uc-06-inventory-taken.mmd) |
| D11 | UC-07 | Пошук: ISBN знайдено; SC-08; 1: B1 / лише B1 | [uc-07-isbn-found.mmd](uc-07-isbn-found.mmd) |
| D12 | UC-07 | Пошук: ISBN відсутній; SC-08; 2: немає / порожній список | [uc-07-isbn-empty.mmd](uc-07-isbn-empty.mmd) |
| D13 | UC-08 | Перегляд: active, відкритих Loan 0; SC-09; 1: active, 0 | [uc-08-active-0.mmd](uc-08-active-0.mmd) |
| D14 | UC-08 | Перегляд: active, відкритих Loan 1; SC-09; 2: active, 1 | [uc-08-active-1.mmd](uc-08-active-1.mmd) |
| D15 | UC-08 | Перегляд: lost, відкритих Loan 0; SC-09; 3: lost, 0 | [uc-08-lost-0.mmd](uc-08-lost-0.mmd) |
| D16 | UC-08 | Перегляд: written_off, відкритих Loan 0; SC-09; 4: written_off, 0 | [uc-08-written-off-0.mmd](uc-08-written-off-0.mmd) |
| D17 | UC-08 | Перегляд: книга без Copy; SC-10; єдиний | [uc-08-no-copies.mmd](uc-08-no-copies.mmd) |
| D18 | UC-01 | Відмова: Reader.email обов'язковий; SC-12; 1: Reader без email | [uc-01-missing-email.mmd](uc-01-missing-email.mmd) |
| D19 | UC-06 | Відмова: Copy.book_id; SC-12; 2: Copy з відсутньою Book | [uc-06-missing-book.mmd](uc-06-missing-book.mmd) |
| D20 | UC-05 | Відмова: Book без автора; SC-12; 3: Book без автора | [uc-05-no-author.mmd](uc-05-no-author.mmd) |
| D21 | UC-05 | Відмова: два видавці Book; SC-12; 4: Book з двома видавцями | [uc-05-two-publishers.mmd](uc-05-two-publishers.mmd) |
| D22 | UC-12 | Відмова: Copy.state unknown; SC-13; 1: Copy / Copy.state | [uc-12-invalid-state.mmd](uc-12-invalid-state.mmd) |
| D23 | UC-12 | Зміна стану: active за відкритого Loan; SC-14; 1: active | [uc-12-state-active.mmd](uc-12-state-active.mmd) |
| D24 | UC-12 | Зміна стану: lost за відкритого Loan; SC-14; 2: lost | [uc-12-state-lost.mmd](uc-12-state-lost.mmd) |
| D25 | UC-12 | Зміна стану: written_off за відкритого Loan; SC-14; 3: written_off | [uc-12-state-written-off.mmd](uc-12-state-written-off.mmd) |
| D26 | UC-09 | Бронювання: є фізично доступний Copy; SC-15; 1: є фізично доступний Copy | [uc-09-reserve-available.mmd](uc-09-reserve-available.mmd) |
| D27 | UC-09 | Бронювання: усі Copy видані; SC-15; 2: усі Copy видані | [uc-09-reserve-loaned.mmd](uc-09-reserve-loaned.mmd) |
| D28 | UC-09 | Бронювання: усі Copy lost або written_off; SC-15; 3: усі Copy lost або written_off | [uc-09-reserve-inactive.mmd](uc-09-reserve-inactive.mmd) |
| D29 | UC-09 | Бронювання: немає Copy; SC-15; 4: немає Copy | [uc-09-reserve-no-copies.mmd](uc-09-reserve-no-copies.mmd) |
| D30 | UC-09 | Повторне бронювання; SC-16; єдиний | [uc-09-reserve-again.mmd](uc-09-reserve-again.mmd) |
| D31 | UC-09 | Відмова: бронювання відсутньої Book; SC-17; єдиний | [uc-09-missing-book.mmd](uc-09-missing-book.mmd) |
| D32 | UC-10 | Внутрішній крок: активна черга; SC-18; єдиний; таблиця Given — не Examples | [shared-active-queue.mmd](shared-active-queue.mmd) |
| D33 | UC-10 | Основний: видача без черги, рівні дати; SC-19; 1: due_at = loaned_at | [uc-10-issue-equal-date.mmd](uc-10-issue-equal-date.mmd) |
| D34 | UC-10 | Основний: видача без черги, пізніший due_at; SC-19; 2: due_at > loaned_at | [uc-10-issue-later-date.mmd](uc-10-issue-later-date.mmd) |
| D35 | UC-10 | A1: видача першому читачеві черги; SC-20; єдиний; A1 | [uc-10-first-reservation.mmd](uc-10-first-reservation.mmd) |
| D36 | UC-10 | A3: відмова — lost; SC-21; 1: lost, 0, R1 | [uc-10-deny-lost.mmd](uc-10-deny-lost.mmd) |
| D37 | UC-10 | A3: відмова — written-off; SC-21; 2: written_off, 0, R1 | [uc-10-deny-written-off.mmd](uc-10-deny-written-off.mmd) |
| D38 | UC-10 | A3: відмова — open-loan; SC-21; 3: active, 1, R1 | [uc-10-deny-open-loan.mmd](uc-10-deny-open-loan.mmd) |
| D39 | UC-10 | A2: відмова — queue-priority; SC-21; 4: active, 0, R2 | [uc-10-deny-queue-priority.mmd](uc-10-deny-queue-priority.mmd) |
| D40 | UC-10 | A4: конкурентні запити; SC-22; єдиний; A4 | [uc-10-concurrent.mmd](uc-10-concurrent.mmd) |
| D41 | UC-10 | A5: due_at раніше loaned_at; SC-23; 1: due_at; A5 | [uc-10-invalid-due-date.mmd](uc-10-invalid-due-date.mmd) |
| D42 | UC-11 | Відмова: returned_at раніше loaned_at; SC-23; 2: returned_at | [uc-11-invalid-return-date.mmd](uc-11-invalid-return-date.mmd) |
| D43 | UC-11 | Повернення: Copy active; SC-24; 1: active | [uc-11-return-active.mmd](uc-11-return-active.mmd) |
| D44 | UC-11 | Повернення: Copy lost; SC-24; 2: lost | [uc-11-return-lost.mmd](uc-11-return-lost.mmd) |
| D45 | UC-11 | Повернення: Copy written_off; SC-24; 3: written_off | [uc-11-return-written-off.mmd](uc-11-return-written-off.mmd) |
| D46 | UC-13 | Передавання сповіщення A1; SC-25; єдиний | [uc-13-transfer.mmd](uc-13-transfer.mmd) |
| D47 | UC-17 | Помилка A1 у контексті UC-13; SC-26; єдиний; розширення UC-13, також UC-10 X5 | [uc-17-transfer-failure.mmd](uc-17-transfer-failure.mmd) |
| D48 | UC-10 | A6: після повідомлення Copy вже виданий; SC-27; єдиний; A6 | [uc-10-after-notification.mmd](uc-10-after-notification.mmd) |
| D49 | UC-10 | X1: немає чинної сесії; —; X1 | [uc-10-x1-session.mmd](uc-10-x1-session.mmd) |
| D50 | UC-10 | X1: немає права видачі; —; X1 | [uc-10-x1-forbidden.mmd](uc-10-x1-forbidden.mmd) |
| D51 | UC-10 | X2: неповні дані видачі; —; X2 | [uc-10-x2-fields.mmd](uc-10-x2-fields.mmd) |
| D52 | UC-10 | X2: відсутні посилання видачі; —; X2 | [uc-10-x2-references.mmd](uc-10-x2-references.mmd) |
| D53 | UC-10 | X3: збій до фіксації; —; X3 | [uc-10-x3-before-commit.mmd](uc-10-x3-before-commit.mmd) |
| D54 | UC-10 | X3: відповідь втрачена після фіксації; —; X3 | [uc-10-x3-after-commit.mmd](uc-10-x3-after-commit.mmd) |
| D55 | UC-10 | X4: усі 50 HTTP-слотів зайняті; —; X4 | [uc-10-x4-capacity.mmd](uc-10-x4-capacity.mmd) |
| D56 | UC-15 | Внутрішня доступність: active, Loan 0; SC-09; 1: active, 0; повторно використовується SC-14/SC-24 | [uc-15-active-0.mmd](uc-15-active-0.mmd) |
| D57 | UC-15 | Внутрішня доступність: active, Loan 1; SC-09; 2: active, 1; повторно використовується SC-14/SC-24 | [uc-15-active-1.mmd](uc-15-active-1.mmd) |
| D58 | UC-15 | Внутрішня доступність: lost, Loan 0; SC-09; 3: lost, 0; повторно використовується SC-14/SC-24 | [uc-15-lost-0.mmd](uc-15-lost-0.mmd) |
| D59 | UC-15 | Внутрішня доступність: written_off, Loan 0; SC-09; 4: written_off, 0; повторно використовується SC-14/SC-24 | [uc-15-written-off-0.mmd](uc-15-written-off-0.mmd) |

## Межі покриття

- 48 джерел відображають конкретні Gherkin-випадки. D32 — внутрішній крок черги, не новий UC.
- 7 джерел D49–D55 описують X1–X4 UC-10 без прямих Gherkin-прикладів.
- 4 джерела D56–D59 відображають внутрішній UC-15.
- UC-02 покрито спеціалізаціями. UC-17 (D47) показує розширення UC-13 і X5 UC-10.
- SC-11 — структурна перевірка. SC-12 рядок 5 і SC-13 рядок 2 лишаються відкритими згідно з Q2/Q3, не породжують нових прав чи UC.

## Точкове виправлення після перегляду

Після точкового перегляду додано guards успіху до 11 сценаріїв D01, D03/D04, D07–D09, D26–D30. Усі 59 діаграм мають комбіновані фрагменти. 308 програмних викликів названо у форматі operation(parameters) з українським поясненням. Назви є логічними контрактами, не реалізованими API. Порядок викликів, усі return-повідомлення та очікувані результати сценаріїв збережені.

Guards походять з REQ-01–REQ-07, наскрізних REQ-11/12 та REQ-14/NFR-08. Вони обмежують успішне збереження й відповіді, не додаючи вигаданих відмов. Для бронювання немає перевірки фізичної доступності як умови дозволу. Первинні SC/REQ-теги та матриця покриття не змінюються.

## Фактично виконана перевірка Етапу 3

Mermaid 12.2.0 (версія з кореневого package-lock.json), mermaid.parse у локальному headless Chrome: 59/59 PASS. Використано окрему залежність у ігнорованому .cache/syntax, без зміни кореневих package-файлів. Перевірено відповідність 59 шляхам матриці, UC/SC/REQ/NFR-метадані, заплановані alt/opt/loop/par і баланс явних activation bars для кожної альтернативної гілки. Окремо перевірено ознаки атомарного fulfilled, обидва результати конкуренції та втрату відповіді після commit.

Це перевірка джерел діаграм, не виконання поведінки застосунку або NFR. Рендер SVG/PNG та візуальний огляд не виконувалися. Постійні скрипти й рендер належать наступному етапу, який ще не розпочато.
