# Онлайн-запись — PWA для малого бизнеса

Статический шаблон (React + TypeScript + Vite + Tailwind), который публикуется на **GitHub Pages**.
Ни бэкенда, ни базы данных: заявка формируется в браузере и уходит в Telegram владельца.
Демо-режим показывает баннер «Демо-версия» и кабинет владельца (тариф «Бизнес»).

## Быстрый старт

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # прод-сборка в dist/
npm run preview    # проверить прод-сборку: http://localhost:4173
```

Требования: Node.js 20+ (в CI используется 22, см. `.nvmrc`).

## Публикация на GitHub Pages (5 шагов)

> **Важно:** репозиторий должен быть **публичным** — на приватных GitHub Pages требует платный план.

1. Создайте репозиторий: GitHub → **New repository** → имя (например `client-autolux`) → **Public** → Create.
2. Загрузите **содержимое этой папки**, а не саму папку:
   в репозитории нажмите **Add file → Upload files**, откройте папку проекта, выделите всё (`Ctrl+A`)
   и перетащите в окно. Убедитесь, что в списке есть `.github/workflows/deploy.yml`, `package.json`, `src/`.
   Не загружайте `node_modules/` и `dist/` — они не нужны (и есть в `.gitignore`).
3. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
4. Дождитесь запуска: вкладка **Actions** → workflow «Deploy to GitHub Pages» (стартует сам после загрузки).
   Зелёные job'ы `build` и `deploy` = сайт опубликован.
5. Откройте ссылку вида `https://<ваш-логин>.github.io/<имя-репозитория>/`
   (первый раз — с `Ctrl+F5`). Она же показана в Settings → Pages.

Дальше каждый `git push` в `main` автоматически пересобирает и переопубликовывает сайт.

**Если папка `.github` не загрузилась** (веб-загрузка иногда пропускает скрытые папки): в репозитории
**Add file → Create new file** → имя `.github/workflows/deploy.yml` → вставьте содержимое одноимённого файла
из проекта → Commit. После этого Actions → **Run workflow**.

**Более надёжная альтернатива веб-загрузке:** установить **GitHub Desktop** → `File → Add local repository`
→ выбрать эту папку → `Publish repository` (снять галочку «Keep this code private»). Тогда `.github`
и `.gitignore` попадут в репозиторий гарантированно.

## Структура

```
.github/workflows/deploy.yml   сборка и деплой на GitHub Pages
public/clients/demo.json       данные клиента: название, услуги, телефон, часы
public/images/demo/            картинки (hero, услуги, иконка PWA)
public/sw.js                   service worker (офлайн + свежий HTML после деплоя)
src/                           исходники приложения
scripts/new-client.mjs         генератор нового клиента (npm run client:new)
docs/NEW-CLIENT.md             чек-лист: новый клиент за 15 минут
docs/SECURITY.md               как уходят данные заявки и что с этим делать
```

## Смена клиента

Полный чек-лист — `docs/NEW-CLIENT.md`. Коротко:

```bash
npm run client:new -- --slug=autolux --data=scripts/clients/example.json
```

или вручную: отредактировать `public/clients/demo.json` и заменить картинки
в `public/images/demo/` (файлы с теми же именами).

## Полезные команды

| Команда | Что делает |
|---|---|
| `npm run dev` | дев-сервер с горячей перезагрузкой |
| `npm run build` | `tsc` + прод-сборка, печатает gzip-размеры |
| `npm run preview` | локальный сервер прод-сборки |
| `npm run typecheck` | проверка типов без сборки |
| `npm run client:new` | создать конфиг нового клиента |

## Если что-то не работает

| Симптом | Причина / решение |
|---|---|
| Сайт 404 | Pages Source ≠ GitHub Actions, либо деплой ещё не прошёл — проверьте вкладку Actions |
| Белый экран, 404 на `/assets/...` | сломан `base`: в workflow должна быть строка `VITE_BASE: /${{ github.event.repository.name }}/` |
| Старая версия сайта | service worker обновляется сам (network-first для HTML); жёсткое обновление — `Ctrl+F5` |
| `npm ci` падает в CI | `package-lock.json` не совпадает с `package.json` — выполните `npm install` и закоммитьте lock |
| `No artifacts named "github-pages"` | известный сбой GitHub — **Re-run failed jobs** |

## Лицензия

Шаблон внутреннего использования агентства; сторонние библиотеки — под своими лицензиями (MIT).
