# План миграции на веб-first архитектуру

## Цель
Преобразовать приложение из Tauri-десктопной версии в веб-приложение с поддержкой Vercel, сохранив основные функции и упростив деплой.

## Текущее состояние
- Tauri используется для файловых операций и работы с PDF
- Структура FSD полностью сохранена
- Статический экспорт уже настроен (`output: 'export'`)
- Данные хранятся в markdown файлах на диске

## Требования к веб-версии
1. **Хранение данных**: localStorage (демо-режим)
2. **PDF**: Client-side с pdfjs, без рендеринга
3. **Файловая система**: File System Access API (persistent access)
4. **Deep links**: Сохранить функциональность
5. **UI**: Требовать постоянный доступ к папке

## Структура изменений

### 1. Новая файловая система (web)
```
src/shared/lib/fs/web/
├── index.ts              # Общий API
├── localStorage.ts       # Хранение в localStorage
├── fileSystem.ts        # File System Access API
├── pdf-handler.ts       # Обработка PDF клиентской стороной
└── types.ts             # TypeScript типы
```

### 2. Обновленная файловая система (universal)
```
src/shared/lib/fs/
├── index.ts              # Динамический импорт в зависимости от окружения
├── web/                  # Веб-реализация (новый модуль)
├── tauri.ts              # Tauri-реализация (для backward compatibility)
└── index.ts              # Переопределенный экспорт
```

### 3. Обновленный providers
```
src/app/providers.tsx    # Добавить webFileSystemProvider
```

### 4. Обновленный PDF viewer
```
src/pages/reading/ui/pdf-viewer.tsx    # Поддержка webEnvironment
```

## Реализация по шагам

### Шаг 1: Создать web файловую систему
**Файлы**: `src/shared/lib/fs/web/index.ts`, `src/shared/lib/fs/web/types.ts`

Функции:
- `getDataRoot()`: Спрашивает о папке при первом использовании
- `getMemoriesDir()`: Получает директорию памяти
- `writeMarkdownFile()`: Пишет в localStorage
- `readMarkdownFile()`: Читает из localStorage
- `listFiles()`: Перечисляет все файлы
- `deleteFile()`: Удаляет файл
- `fileExists()`: Проверяет существование

### Шаг 2: Создать localStorage persistence layer
**Файлы**: `src/shared/lib/fs/web/localStorage.ts`

Логика:
- Хранить структуру данных в localStorage под ключом `mentem_data`
- Поддерживать загрузку/сохранение файлов
- Создать индекс файлов для быстрого поиска

### Шаг 3: Создать File System Access API layer
**Файлы**: `src/shared/lib/fs/web/fileSystem.ts`

Функции:
- `requestPersistentDirectory()`: Запрашивает доступ к папке с требованием persistent
- `getDirectoryHandle()`: Получает handle директории
- Сохранять handle в localStorage для восстановления
- Реализовать retry-логику при отказе от доступа

### Шаг 4: Создать PDF handler
**Файлы**: `src/shared/lib/fs/web/pdf-handler.ts`

Функции:
- `parsePdfFile(file)`: Читает файл и извлекает текст через pdfjs
- `extractTextFromPdf()`: Основная логика парсинга
- Сохранять извлеченный текст в localStorage
- Визуализация текста вместо PDF

### Шаг 5: Обновить общий fs module
**Файл**: `src/shared/lib/fs/index.ts`

Логика:
```typescript
const isWeb = typeof window !== 'undefined' && !('TAURI' in window);

export const fs = isWeb ? 
    (await import('./web')).fs : 
    (await import('./tauri')).fs;
```

### Шаг 6: Обновить providers
**Файл**: `src/app/providers.tsx`

Изменения:
- Добавить провайдер webFileSystemProvider
- Реализовать логику deep links для web (через URLSearchParams)
- Убрать зависимость от Tauri deep-link плагина
- Добавить обработку ошибки если FS API недоступен

### Шаг 7: Обновить PDF viewer
**Файл**: `src/pages/reading/ui/pdf-viewer.tsx`

Изменения:
- Добавить флаг `isWebEnvironment`
- Заменить `invoke('fs_any_read_binary_file')` на `parsePdfFile()`
- Убрать `window.URL.createObjectURL()` для Blob URL
- Отображать текстовый контент вместо PDF страниц
- Добавить кнопку "Просмотр PDF" с внешним сервисом (Google Docs Viewer)

### Шаг 8: Обновить settings tab
**Файл**: `src/pages/home/ui/settings-tab.tsx`

Изменения:
- Заменить `@tauri-apps/plugin-dialog` на `window.showDirectoryPicker()`
- Добавить проверку поддержки File System Access API
- Обновить UI для web версии

### Шаг 9: Удалить Tauri зависимости
**Файлы**:
- Удалить `src-tauri/` полностью
- Обновить `package.json` - убрать `@tauri-apps/*`
- Обновить `next.config.js` - убрать `assetPrefix` для dev
- Обновить `tsconfig.json` - убрать `src-tauri` из exclude

### Шаг 10: Обновить build scripts
**Файл**: `package.json`

Изменить:
```json
{
  "scripts": {
    "dev": "next dev --turbopack --port 4250",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx --fix"
  }
}
```

### Шаг 11: Создать файл для Vercel
**Файл**: `vercel.json` (новый)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "out"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### Шаг 12: Обновить README
**Файл**: `README.md`

Добавить:
- Инструкции по деплою на Vercel
- Описание новых функций
- Информацию о поддерживаемых браузерах (File System Access API)
- Примечания о localStorage для демо-режима

## Обратная совместимость

### Хранение данных
- Для миграции добавить конвертер из localStorage → localStorage
- В первом запуске web-версии предложить миграцию из Tauri-данных если они есть

### PDF-файлы
- Сохраним структуру хранения PDF-данных
- PDF будут храниться в localStorage как текст (или base64 для больших файлов)

### Deep links
- Web версия поддерживает `?note=content&title=...&url=...` в URL
- Добавить обработку при загрузке страницы

## Тестирование

### Web-only тесты
1. Работа с localStorage
2. Хранение файлов
3. Deep links через query parameters
4. Файловый picker для папки
5. PDF parsing клиентской стороной

### Vercel деплой
1. Локальное тестирование `npm run build`
2. Деплой на Vercel
3. Проверка статического экспорта
4. Тестирование всех функций в браузере

## Особенности

### File System Access API
- Требует HTTPS или localhost
- Требует современного браузера (Chrome 86+, Firefox 77+, Safari 15.4+)
- При отказе от доступа показывать информативное сообщение

### PDF parsing
- Использовать pdfjs-dist из CDN
- Извлекать текст страницы за страницей
- Сохранять позиции строк для навигации

### Deep links
- В web: `https://yourdomain.com/?note=content&title=title&url=url`
- В desktop: `mentem://note?content=...&title=...&url=...`

## Риски и решения

### Риск 1: localStorage ограничен
**Решение**: Сообщить пользователю о лимитах, предложить интеграцию с реальным хранилищем позже

### Риск 2: File System Access API не поддерживается
**Решение**: Добавить fallback на `<input type="file">` для выбора отдельных файлов

### Риск 3: PDF large files не влезут в localStorage
**Решение**: Ограничить размер PDF, показывать сообщение, предложить внешний просмотр

### Риск 4: Deep links не работают в браузере без расширений
**Решение**: Добавить инструкцию о возможностях браузерных URL

## Next Steps

После завершения миграции:
1. Тестирование на разных браузерах
2. Оптимизация производительности localStorage
3. Добавление возможности экспорта данных
4. Добавление возможности импорта данных
