# Початкова відповідь першої генерації

Нижче наведено ER-модель за lab1-redo/spec.md із коміту 12ea998. Атрибути й типи є рішеннями AI-генерації, а не додатковими вимогами студента. Генерацію виконано в поточній сесії Codex із наявним попереднім контекстом; вона не є технічно ізольованою.

```mermaid
erDiagram
    Publisher ||--o{ Book : publishes
    Author }|--o{ Book : writes
    Book ||--|{ Copy : includes
    Reader ||--o{ Loan : receives
    Copy ||--o{ Loan : records
    Reader ||--o{ Reservation : places
    Book ||--o{ Reservation : concerns

    Publisher {
        int id PK
        string name
    }
    Author {
        int id PK
        string full_name
    }
    Book {
        int id PK
        string title
        string isbn UK
        int publication_year
        int publisher_id FK
    }
    Copy {
        int id PK
        int book_id FK
        string inventory_number UK
        string physical_condition
    }
    Reader {
        int id PK
        string full_name
        string email
    }
    Loan {
        int id PK
        int reader_id FK
        int copy_id FK
        datetime issued_at
        datetime due_at
        datetime returned_at
    }
    Reservation {
        int id PK
        int reader_id FK
        int book_id FK
        datetime created_at
        string status
    }

    %% Loan.returned_at is NULL while the loan is open.
    %% At most one open Loan per Copy; historical loans remain stored.
    %% Reservations concern Book and do not require all copies to be on loan.
    %% Reservation.id is assigned in increasing creation order.
    %% Pending reservations for a Book are served by ascending Reservation.id.

```

Рішення генерації:

- Ідентифікатори сутностей — цілі числа; FK мають такий самий тип, як відповідні PK.
- ISBN та інвентарний номер позначено альтернативними унікальними ключами.
- Author–Book представлено прямим M:N без додаткової сутності.
- Формулювання K2 «книга може щонайменше один фізичний примірник» витлумачено як мінімум один примірник у книги.
- Loan зберігає історію видач. returned_at допускає NULL до повернення; для Copy дозволена максимум одна відкрита видача. Це обмеження не виражається самою кардинальністю історії.
- Reservation зберігає бронювання Book незалежно від наявності вільних Copy. Для status запропоновано pending, fulfilled, cancelled. Активна черга складається з pending-записів, упорядкованих за зростанням id; id призначається в порядку створення бронювань.

Це початковий вихід генерації. Аудит, рендер, тести та виправлення не виконувалися. Специфікацію не змінено.
