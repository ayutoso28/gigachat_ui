# GigaChat UI

Оболочка веб-приложения для диалога с публичным API **GigaChat** —
ChatGPT-подобный интерфейс на React + TypeScript с поддержкой
стриминга ответов, локальной персистентности и настраиваемого
системного промпта.

## Демо

- **Публичная ссылка:** https://gigachat-ui.vercel.app
- **Скриншоты:**
![Image alt](https://github.com/ayutoso28/gigachat_ui/blob/main/screenshots/image_2026-04-22_14-48-32.png)
![Image alt](https://github.com/ayutoso28/gigachat_ui/blob/main/screenshots/image_2026-04-22_14-48-32.png)
![Image alt](https://github.com/ayutoso28/gigachat_ui/blob/main/screenshots/image_2026-04-22_14-48-32%20(3).png)
![Image alt](https://github.com/ayutoso28/gigachat_ui/blob/main/screenshots/image_2026-04-22_14-48-32%20(4).png)

## Стек

| Слой | Технология | Версия |
|------|------------|-------:|
| UI-фреймворк | React | 19.2 |
| Язык | TypeScript | 6.0 |
| Сборка / dev-сервер | Vite | 8.0 |
| Роутинг | React Router | 7.14 |
| Состояние | `useReducer` + Context API | — |
| Персистентность | `window.localStorage` | — |
| Стили | CSS Modules + CSS-переменные (светлая / тёмная тема) | — |
| Рендер сообщений | react-markdown + remark-gfm | 10.1 / 4.0 |
| Тесты | Vitest + React Testing Library + jsdom | 4.1 / 16.3 / 29 |
| Хостинг | Vercel (static + serverless) | — |

## Запуск локально

```bash
# 1. Клонируем
git clone <repo-url>
cd gigachat_ui

# 2. Ставим зависимости
npm install

# 3. (опционально) создаём .env на основе шаблона
cp .env.example .env

# 4. Dev-сервер
npm run dev             # http://localhost:5173
```

На экране входа введите **Authorization Key** из личного кабинета
GigaChat и выберите **Scope** (`GIGACHAT_API_PERS` / `B2B` / `CORP`).
Ключ используется только для получения OAuth-токена и хранится в
памяти вкладки — в `localStorage` он не сохраняется.

### Прочие скрипты

```bash
npm run build           # production-сборка в ./dist
npm run preview         # локальный preview собранной версии
npm run lint            # ESLint
npm test                # однократный прогон тестов
npm run test:watch      # watch-режим тестов
```

## Переменные окружения

| Переменная | Обязательная | Значение по умолчанию | Описание |
|------------|:------------:|-----------------------|----------|
| `VITE_GIGACHAT_AUTH_URL` | нет | `/api/ngw?path=/v2/oauth` | URL OAuth-сервиса. В dev резолвится через Vite-proxy на `ngw.devices.sberbank.ru:9443/api/v2/oauth`; в проде — через serverless-функцию [api/ngw.ts](api/ngw.ts), которая читает `?path=` и проксирует на тот же upstream. |
| `VITE_GIGACHAT_API_URL` | нет | `/api/giga` | Базовый URL прокси чат-комплишенов. Клиент сам подставляет `?path=/v1/chat/completions` и т.п. В проде — [api/giga.ts](api/giga.ts) → `https://gigachat.devices.sberbank.ru/api/...`. |

> **Секреты в `.env` класть не нужно.** Authorization Key вводится
> пользователем в форме входа — это позволяет публиковать сборку
> без риска утечки ключа через бандл или DevTools.

См. [.env.example](.env.example) — там те же поля с подробными
комментариями.

## Архитектура и решения

### Роутинг

- `/` — главная; если чаты есть, редирект на `/chat/:activeId`, иначе — пустой layout с полем ввода (создаёт чат «на лету»).
- `/chat/:id` — активный чат; при несуществующем id — редирект на `/`.
- `*` — fallback на `/`.

Оба роута разнесены по lazy-чанкам (`HomeRoute`, `ChatRoute`) через
`React.lazy` + `Suspense` — см. [src/app/router/routes.tsx](src/app/router/routes.tsx).

### Code splitting (отдельные чанки)

- [src/app/router/HomeRoute.tsx](src/app/router/HomeRoute.tsx), [src/app/router/ChatRoute.tsx](src/app/router/ChatRoute.tsx) — собственные чанки роутов;
- [src/components/sidebar/Sidebar.tsx](src/components/sidebar/Sidebar.tsx) — ленивая загрузка внутри `AppLayout` (пока грузится — показывается skeleton-заглушка);
- [src/components/settings/SettingsPanel.tsx](src/components/settings/SettingsPanel.tsx) — открывается редко, рендерится только когда `isSettingsOpen === true`, поэтому чанк тянется по клику на «Настройки»;
- **AppLayout-чанк** содержит всё дерево `react-markdown` / `micromark` / `remark-gfm` — они не попадают в инициализационный `index.js`.

### Error boundaries

[src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx) — классовый компонент с `getDerivedStateFromError` + `componentDidCatch`. Используется:

- как **глобальный boundary** вокруг всего приложения в [src/App.tsx](src/App.tsx) (любая ошибка рендера показывает fallback с кнопкой «Повторить», не роняя страницу);
- как **локальный boundary** вокруг `MessageList` в [src/components/chat/ChatWindow.tsx](src/components/chat/ChatWindow.tsx) — ошибка рендера сообщения (например, битый markdown) не ломает сайдбар и поле ввода.

API-ошибки и отмены стрима ловятся в `try/catch` внутри `ChatWindow.handleSend`, пишутся в reducer (`SET_ERROR` по `chatId`) и показываются через `ErrorMessage` под полем ввода.

### Оптимизация ререндеров

- [ChatItem](src/components/sidebar/ChatItem.tsx) обёрнут в `React.memo` — элементы списка не перерисовываются, когда меняется содержимое другого чата;
- обработчики `onSelect` / `onRename` / `onDelete` в [Sidebar](src/components/sidebar/Sidebar.tsx) стабилизированы через `useCallback`, чтобы `memo` действительно срабатывал;
- отфильтрованный список чатов — `useMemo` от `state.chats` + `searchQuery`.

### Анализ бандла

После `npm run build` — `npx vite-bundle-visualizer --output docs/bundle-analysis.html`.

- Скриншот текущего размера: [docs/bundle-analysis.png](docs/bundle-analysis.png)
- Интерактивный treemap: [docs/bundle-analysis.html](docs/bundle-analysis.html) (открыть в браузере)

Ключевое наблюдение: `react-markdown` и его поддерево (`mdast-util-*`,
`micromark-*`) вынесены в чанк `AppLayout`, не попадают в initial bundle.

## Тесты

Конфиг: [vitest.config.ts](vitest.config.ts) (jsdom, `globals: true`), setup — [src/test/setup.ts](src/test/setup.ts).

Текущее покрытие (5 файлов, 55 тестов):

| Файл | Что покрыто |
|------|-------------|
| [src/store/chatReducer.test.ts](src/store/chatReducer.test.ts) | reducer: `CREATE_CHAT`, `SELECT_CHAT`, `RENAME_CHAT` (включая fallback на дефолтное название при пустой строке), `DELETE_CHAT` (переключение `activeChatId`, очистка `loadingByChat`/`errorByChat`), `APPEND_MESSAGE` (обновление `lastMessageAt`, игнор несуществующего `chatId`), `UPDATE_MESSAGE`, `REMOVE_MESSAGE`, `SET_LOADING`, `SET_ERROR`, неизвестный action |
| [src/utils/storage.test.ts](src/utils/storage.test.ts) | персистентность: `savePersistedState` → `localStorage`, корректное восстановление через `loadPersistedState`, устойчивость к невалидному JSON, фильтрация битых чатов, нормализация нестрокового `activeChatId`, round-trip save→load. `localStorage` мокируется через `vi.stubGlobal` |
| [src/components/chat/InputArea.test.tsx](src/components/chat/InputArea.test.tsx) | отправка по клику, отправка по Enter, Shift+Enter — новая строка (без отправки), блокировка кнопки при пустом/только-пробельном вводе, очистка поля после отправки, кнопка Стоп при `isLoading`, отображение `error` |
| [src/components/chat/Message.test.tsx](src/components/chat/Message.test.tsx) | варианты `user` / `assistant`: контент, применяемые CSS-классы (`bubbleUser` / `bubbleAssistant`), автор («Вы» / «GigaChat»), кнопка «Копировать» только у ассистента, override через проп `variant` |
| [src/components/sidebar/Sidebar.test.tsx](src/components/sidebar/Sidebar.test.tsx) | поиск в реальном времени: фильтрация по названию (регистронезависимо), по содержимому сообщений, empty-state при отсутствии совпадений; диалог подтверждения удаления (открытие, confirm удаляет чат, cancel оставляет); создание чата по кнопке |

## Деплой на Vercel

Конфиг: [vercel.json](vercel.json) — включает SPA-rewrite для `/chat/:id` → `/`.

Serverless-прокси: [api/ngw.ts](api/ngw.ts) и [api/giga.ts](api/giga.ts) — single-file функции (`runtime: "nodejs"`). Читают upstream-путь из query-параметра `?path=`, проксируют запрос на реальные эндпоинты GigaChat. TLS-проверка отключена на уровне модуля (`NODE_TLS_REJECT_UNAUTHORIZED=0`), потому что GigaChat использует корневой сертификат Минцифры, отсутствующий в стандартном CA-bundle Node.

Шаги (первый деплой):

```bash
# 1. Установить CLI (один раз)
npm i -g vercel

# 2. Залогиниться
vercel login

# 3. Из корня репозитория
vercel                  # интерактивная привязка к новому проекту
vercel --prod           # production-деплой
```

Проверка на проде:

- открыть сайт в режиме инкогнито;
- ввести Authorization Key и scope → форма должна перейти на главную;
- отправить сообщение → ответ стримится с GigaChat;
- обновить страницу на `/chat/<id>` — SPA-rewrite возвращает `index.html`, роут восстанавливается;
- быстрый тест прокси в адресной строке: `/api/ngw?path=/v2/oauth` — должен вернуть ответ от SynGX / Сбера (а не Vercel `NOT_FOUND`).

## Структура проекта

```
├── api/                        # Serverless-прокси для Vercel
│   ├── ngw.ts                  # OAuth (ngw.devices.sberbank.ru:9443)
│   └── giga.ts                 # Chat completions (gigachat.devices.sberbank.ru)
├── docs/
│   ├── bundle-analysis.html    # интерактивный treemap
│   └── bundle-analysis.png     # скриншот для README
├── src/
│   ├── api/                    # auth + chat completions (стриминг SSE)
│   ├── app/
│   │   ├── providers/          # ChatProvider (Context + useReducer)
│   │   └── router/             # routes.tsx, HomeRoute.tsx, ChatRoute.tsx
│   ├── components/
│   │   ├── auth/               # AuthForm
│   │   ├── chat/               # ChatWindow, MessageList, Message, InputArea
│   │   ├── layout/             # AppLayout
│   │   ├── settings/           # SettingsPanel (lazy)
│   │   ├── sidebar/            # Sidebar, ChatList, ChatItem, SearchInput
│   │   ├── ui/                 # общие кнопки, Slider, Toggle, ConfirmDialog
│   │   └── ErrorBoundary.tsx   # классовый компонент с componentDidCatch
│   ├── data/                   # mockData, дефолтные настройки
│   ├── store/                  # chatReducer (+ тесты)
│   ├── styles/                 # глобальные стили, CSS-переменные тем
│   ├── test/                   # setup.ts для Vitest
│   ├── types/                  # доменные типы (Chat, Message, Settings)
│   └── utils/                  # storage (localStorage) + тесты
├── .env.example                # шаблон переменных окружения
├── vercel.json                 # SPA-rewrite /chat/:id → /
├── vite.config.ts              # dev-сервер + прокси /api/ngw и /api/giga
└── vitest.config.ts            # jsdom + setup + css
```
