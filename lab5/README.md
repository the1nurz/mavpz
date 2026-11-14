# Лабораторна робота №5 — UML Component Diagram

Ця папка містить специфікацію, архітектурний опис, UML Component Diagram для інформаційної системи «Бібліотека», результати аудиту та матеріали для захисту. Діаграма моделює один модульний вебзастосунок зі спільною БД; це не реалізований застосунок.

## Структура

| Файл або папка | Призначення |
|---|---|
| [spec.md](spec.md) | 15 критеріїв прийняття та вимоги до моделі |
| [architecture.md](architecture.md) | Компоненти, контракти, транзакційна межа, NFR і трасування до Lab 1–4 |
| [component.puml](component.puml) | Джерело UML Component Diagram у PlantUML |
| [render/component.svg](render/component.svg), [render/component.png](render/component.png) | Відтворені векторне й растрове зображення |
| [render/manifest.json](render/manifest.json) | Хеші джерела, середовища та рендерів |
| [validation.md](validation.md) | Команди, середовище й історія перевірок |
| [AUDIT.md](AUDIT.md), [audit-results.json](audit-results.json) | Детальний аудит і машинні докази етапу 5 |
| [adr/](adr/0001-modular-monolith.md) | Чотири архітектурні рішення у форматі MADR |
| [ai/](ai/HISTORY.md) | Журнал доступних промптів, перевірок/виправлень та історії етапів |
| [DEFENSE.md](DEFENSE.md) | Стислий матеріал для усного захисту |
| [tools/render.mjs](tools/render.mjs) | Перевірка структури, PlantUML-синтаксису й відтворення рендерів |
| [tools/test-structure.mjs](tools/test-structure.mjs) | Регресійні тести структурного валідатора |
| [tools/audit.mjs](tools/audit.mjs) | Збір повторних машинних доказів аудиту; оновлює `audit-results.json` |

## Перегляд діаграми

Відкрий [SVG](render/component.svg) у браузері для масштабування або [PNG](render/component.png) у переглядачі зображень. Перевір підписи, системну межу, provided/required інтерфейси та можливі перетини з текстом. Особистий ручний перегляд SVG ще потрібен: статус AC5-13 не PASS.

## Генерація і перевірки

Команди виконуються з кореня репозиторію. Потрібні Node.js, Java, Graphviz і PlantUML 1.2026.9; наявні в цьому середовищі шляхи зафіксовані у [validation.md](validation.md). Підстав власні абсолютні шляхи до встановлених Java/JAR/Graphviz, якщо вони відрізняються:

```powershell
$env:LAB5_JAVA='D:/proga2kyrs/mavpz/4lab/mavpz/.cache/lab4/jdk-21.0.13+9-jre/bin/java.exe'
$env:LAB5_JAR='D:/proga2kyrs/mavpz/4lab/mavpz/.cache/lab4/plantuml-1.2026.9.jar'
$env:GRAPHVIZ_DOT='C:/Program Files/Graphviz/bin/dot.exe'
node lab5/tools/render.mjs --render
node lab5/tools/render.mjs --check
node --test lab5/tools/test-structure.mjs
```

`--render` перевіряє структуру й PlantUML та створює SVG/PNG і manifest. `--check` повторно генерує їх у пам'яті й порівнює байти, не переписуючи збережені файли. Запуск тестів має показати 12 успішних регресій. `node lab5/tools/audit.mjs` повторно збирає ширші докази та перезаписує `lab5/audit-results.json`; переглянь diff цього JSON після запуску.

## Definition of Done

Аудит зафіксував **14 PASS, 0 FAIL, 1 PARTIAL з 15 критеріїв**. Відкритим лишається AC5-13, бо браузерний перегляд SVG не завершений. Реальний застосунок не реалізований, тому його поведінкові, конкурентні, HTTP/TLS та навантажувальні тести — **NOT RUN**. Повний DoD ще не закритий. Перед остаточним підтвердженням студенту потрібно вручну відкрити SVG, оглянути читабельність і межі та зафіксувати результат; статус змінюється лише за відповідним доказом.
