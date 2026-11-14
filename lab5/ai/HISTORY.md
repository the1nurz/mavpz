# Історія Lab 5

## Послідовність етапів і комітів

| Етап | Коміт | Зміст, підтверджений Git |
|---|---|---|
| 2 — специфікація | [`9eb4dfb`](https://github.com/the1nurz/mavpz/commit/9eb4dfb6d298d31ee7c8916104752f346153c85e) — `docs(lab5): define architecture specification` | Додано `lab5/spec.md` з вимогами та AC5-01–AC5-15 до UML |
| 3 — архітектура | [`c477a24`](https://github.com/the1nurz/mavpz/commit/c477a24e12cb54966b291fd28241f38a0c35c8ac) — `docs(lab5): design component architecture` | Додано `lab5/architecture.md`, компоненти, інтерфейси, трасування й NFR |
| 4 — Component Diagram | [`eb67f22`](https://github.com/the1nurz/mavpz/commit/eb67f2216120f7953a4420d85f976ed4d09d8608) — `feat(lab5): add UML component diagram` | Додано PlantUML-джерело та перший набір артефактів діаграми |
| 5 — виправлення аудиту | [`fd5c2fc`](https://github.com/the1nurz/mavpz/commit/fd5c2fcafed463203074b4c60bfb6a35d9e97c1a) — `fix(lab5): clarify interfaces and harden diagram checks` | Виправлено компонування, посилено перевірки графа, уточнено трасування SC-17/D31; рендер повторено |
| 5 — фінальний аудит | [`a2e240b`](https://github.com/the1nurz/mavpz/commit/a2e240b67061f48067e74e0ccd95ceb8e9c3a226) — `test(lab5): audit architecture consistency` | Додано незалежний аудит і машинні докази; статус 14 PASS, 0 FAIL, 1 PARTIAL (AC5-13) |

Скорочення в таблиці — перші сім символів SHA; точні коміти звірені через історію Git. Повні SHA: `9eb4dfb6d298d31ee7c8916104752f346153c85e`, `c477a24e12cb54966b291fd28241f38a0c35c8ac`, `eb67f2216120f7953a4420d85f976ed4d09d8608`, `fd5c2fcafed463203074b4c60bfb6a35d9e97c1a`, `a2e240b67061f48067e74e0ccd95ceb8e9c3a226`.

## Прийняті архітектурні рішення

- Один модульний вебзастосунок зі спільною БД; внутрішні модулі не моделюються як окремі мережеві сервіси.
- Вісім внутрішніх компонентів C1–C8; Access/Admission згруповані у C2, Availability/Queue — у C5.
- Видача повторно перевіряє доменні умови й атомарно створює Loan та за потреби виконує першу Reservation.
- Зовнішній A1 взаємодіє з C6 через INotificationGateway; помилка сповіщення не змінює доменні дані.
- AC5-13 не отримав PASS без завершеного візуального браузерного доказу.

Це зведення Git і наявних документів, а не повний експорт журналу AI. Для фактично доступних записів промптів див. [PROMPTS.md](PROMPTS.md), для результатів перевірок — [REVIEW.md](REVIEW.md).
