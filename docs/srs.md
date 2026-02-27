# Spaced Repetition System (FSRS)

## Обзор

Mentem использует алгоритм **FSRS (Free Spaced Repetition Scheduler)** для планирования повторений карточек. FSRS реализован в Rust-бэкенде через крейт `fsrs 5.2.0` и вызывается с фронтенда через Tauri commands.

---

## Архитектура

```
┌─────────────────────────────────────────────────────┐
│  Frontend (TypeScript)                              │
│                                                     │
│  learn.tsx ──► srs-service.ts ──► invoke() ─────────┤──► Rust Backend
│       │                                             │     srs.rs (fsrs 5.2.0)
│       ├── review-queue.ts   (очередь)               │
│       ├── review-log.ts     (JSONL лог)             │
│       └── statistics.ts     (статистика)            │
│                                                     │
│  settings store ── localStorage (persist)           │
│  memory store   ── .md файлы (YAML frontmatter)     │
└─────────────────────────────────────────────────────┘
```

### Ключевые файлы

| Файл | Назначение |
|------|------------|
| `src-tauri/src/srs.rs` | Rust FSRS команды |
| `src/entities/card/model/srs-types.ts` | TypeScript типы SRS |
| `src/entities/card/lib/srs-service.ts` | Обёртки над Tauri invoke |
| `src/entities/card/lib/review-queue.ts` | Построение очереди повторений |
| `src/entities/card/lib/review-log.ts` | Чтение/запись reviews.jsonl |
| `src/entities/card/lib/statistics.ts` | Вычисление статистики |
| `src/pages/learn/ui/learn.tsx` | Главный компонент страницы Learn |
| `src/entities/settings/model/store.ts` | Настройки SRS (persist в localStorage) |

---

## Данные

### SRS-данные карточки

Каждая `CardMemory` имеет опциональное поле `srs?: SrsData`:

```typescript
type SrsData = {
    stability: number;    // стабильность памяти
    difficulty: number;   // сложность карточки (0–10)
    due: string;          // дата следующего повторения "2026-03-01"
    interval: number;     // интервал в днях
    lapses: number;       // количество забываний (rating=1)
    reps: number;         // общее число повторений
    state: CardState;     // "new" | "learning" | "review" | "relearning"
    lastReview: string;   // дата последнего повторения "2026-02-27"
};
```

Если `srs` отсутствует — карточка считается **новой**.

### Хранение

SRS-данные сериализуются в `meta` поле YAML frontmatter `.md` файла карточки:

```yaml
---
kind: card
frontSide: "Что такое FSRS?"
backSide: "Free Spaced Repetition Scheduler"
meta:
  stability: 4.5
  difficulty: 5.2
  due: "2026-03-05"
  interval: 7
  lapses: 0
  reps: 3
  state: review
  lastReview: "2026-02-27"
---
```

Парсинг: `src/entities/memory/lib/kinds/card.ts` — если `meta.stability != null`, собирается объект `SrsData`.

### Лог ревью

`reviews.jsonl` — append-only файл в корне данных (рядом с `memories/`, `tags/`). Каждая строка — JSON:

```json
{"cardId":"abc123","rating":3,"date":"2026-02-27","elapsed":3,"state":"review","timestamp":1740700000000}
```

Используется для статистики (heatmap, streak) и обучения оптимизатора.

---

## Rust Backend

### Tauri-команды

Три команды в `src-tauri/src/srs.rs`:

#### `srs_get_next_states`

Превью интервалов для всех 4 рейтингов. Вызывается при показе карточки для отображения интервалов на кнопках.

```
Вход: { cardSrsData, desiredRetention?, parameters? }
Выход: { again: ScheduleResult, hard: ScheduleResult, good: ScheduleResult, easy: ScheduleResult }
```

#### `srs_schedule_review`

Расчёт нового состояния после выбора рейтинга.

```
Вход: { cardSrsData, rating (1-4), desiredRetention?, parameters? }
Выход: ScheduleResult { stability, difficulty, interval }
```

#### `srs_optimize`

Обучение модели на истории ревью. Принимает сырой JSONL, группирует по карточкам, вызывает `compute_parameters`.

```
Вход: { reviewLogJsonl: String }
Выход: Vec<f32> (оптимизированные параметры)
```

### Как работает FSRS внутри

```rust
let fsrs = FSRS::new(Some(&parameters));  // DEFAULT_PARAMETERS или кастомные
let next = fsrs.next_states(memory_state, desired_retention, elapsed_days)?;
// next.again / next.hard / next.good / next.easy — каждый с interval и memory state
```

`MemoryState { stability, difficulty }` — если карточка новая, передаётся `None`.

---

## Очередь повторений

`buildReviewQueue(cards, newCardLimit, today)` в `review-queue.ts`:

1. **Due-карточки** — `srs.due <= today`. Сортировка: самые просроченные первыми.
2. **Новые карточки** — без поля `srs`. Ограничены настройкой `newCardsPerDay` (по умолчанию 20).

Возвращает `{ queue: CardMemory[], dueCount, newCount }`.

---

## Страница Learn

### State machine

```
IDLE ──[Start]──► REVIEWING ──[все карточки]──► RESULTS ──[Done]──► IDLE
                                                         ──[Restart]──► REVIEWING
```

### Фаза IDLE

- `QueueSummary` — количество due/new карточек, кнопка "Start review". Если очередь пуста — "No cards to review".
- `Statistics` — счётчики по состояниям, streak, heatmap за 90 дней.

### Фаза REVIEWING

1. `CardStack` показывает стопку карточек (framer-motion).
2. Кнопка "Show answer" раскрывает обратную сторону.
3. После раскрытия появляются **4 кнопки рейтинга**:
   - **Again** (1) — забыл
   - **Hard** (2) — с трудом
   - **Good** (3) — нормально
   - **Easy** (4) — легко
4. Каждая кнопка показывает превью интервала (`<1m`, `10m`, `1d`, `4d`).
5. **Свайп влево** = Again, **свайп вправо** = Good.

#### Процесс оценки (`handleRate`)

```
Нажатие кнопки/свайп
  → scheduleReview(srs, rating, retention, parameters) → Rust FSRS
  → updateCard(id, { srs: newSrs })                   → Zustand store → .md файл
  → appendReviewLog(entry)                             → reviews.jsonl
  → следующая карточка или → фаза RESULTS
```

### Фаза RESULTS

- `SessionResults` — итоги: всего карточек, разбивка Again/Hard/Good/Easy, длительность.
- Кнопки "Restart" и "Done".

---

## Оптимизатор

FSRS может подстраивать параметры под конкретного пользователя на основе его истории повторений.

### Автоматический запуск

Оптимизация запускается **автоматически** при завершении сессии (переход в фазу `results`) при двух условиях:

1. **Минимум 50 ревью** в логе — иначе данных мало для обучения
2. **Не чаще раза в день** — проверяется `lastOptimizedAt` в настройках

### Процесс

```
Сессия завершена
  → readReviewLogRaw()                     → сырой JSONL
  → optimizeParameters(jsonl)              → Rust srs_optimize → compute_parameters
  → setFsrsParameters(params)              → Zustand → localStorage
  → setLastOptimizedAt(Date.now())         → throttle
```

После оптимизации все последующие вызовы `getNextStates` и `scheduleReview` передают кастомные параметры в Rust вместо дефолтных.

---

## Настройки

Хранятся в Zustand store с `persist` middleware → `localStorage` под ключом `app-settings`.

| Настройка | По умолчанию | Описание |
|-----------|-------------|----------|
| `newCardsPerDay` | 20 | Лимит новых карточек в день |
| `desiredRetention` | 0.9 | Целевая вероятность вспоминания (0–1) |
| `fsrsParameters` | null (default FSRS) | Кастомные параметры после оптимизации |
| `lastOptimizedAt` | null | Timestamp последней оптимизации |

---

## Обратная совместимость

- Поле `srs` в `CardMemory` опционально — старые карточки без него загружаются как новые
- `fsrsParameters: null` означает использование `DEFAULT_PARAMETERS` из крейта fsrs
- `reviews.jsonl` создаётся при первом ревью — отсутствие файла не вызывает ошибок
