# Новый клиент за 15 минут

Шаблон статический: ни бэкенда, ни базы. Всё, что меняется под клиента — это **один JSON + картинки + (опционально) иконка**.

```
public/clients/demo.json          ← тексты, услуги, телефон, часы работы
public/images/demo/               ← hero.jpg, srv1..3.jpg, icon-192.png
src/                              ← код, не трогаем
.github/workflows/deploy.yml      ← деплой на GitHub Pages
```

---

## Вариант A — отдельный репозиторий на клиента (рекомендую для продаж)

Так у каждого клиента своя ссылка `https://<user>.github.io/<repo>/` и свой деплой — правки одного не ломают другого.

1. На GitHub: **Use this template → Create a new repository**, имя `client-<slug>` (например `client-autolux`).
2. Локально:
   ```powershell
   git clone https://github.com/<ваш-аккаунт>/client-autolux.git
   cd client-autolux
   npm install
   ```
3. Сгенерировать конфиг клиента:
   ```powershell
   # кириллицу на Windows надёжнее передавать файлом (cmd.exe ломает кодировку аргументов)
   Copy-Item scripts/clients/example.json scripts/clients/autolux.json
   notepad scripts/clients/autolux.json      # вписать название, телефон, адрес, accent, telegram

   npm run client:new -- --slug=autolux --data=scripts/clients/autolux.json
   ```
   Скрипт создаст `public/clients/autolux.json` и папку `public/images/clients/autolux/` с заглушками.
   <br>*(На macOS/Linux можно и инлайн: `npm run client:new -- --slug=autolux --name="Автолюкс" --phone="+7 ..."`.)*
4. Сделать репозиторий одноклиентным (самый простой путь):
   ```powershell
   Copy-Item public/clients/autolux.json public/clients/demo.json -Force
   ```
   Либо оставить `autolux.json` и задать переменную репозитория (шаг 7).
5. Заменить картинки (5 минут) — размеры и лимиты:
   | Файл | Размер | Вес |
   |---|---|---|
   | `hero.jpg` | 1600×1200 | ≤ 250 КБ |
   | `srv1.jpg`, `srv2.jpg`, `srv3.jpg` | 800×600 | ≤ 120 КБ каждая |
   | `icon-192.png` (иконка PWA) | 192×192 PNG | ≤ 20 КБ |
6. Проверить и собрать:
   ```powershell
   npm run dev        # посмотреть на телефоне в той же Wi-Fi: npm run dev -- --host
   npm run build      # tsc + vite build, должен быть зелёный
   ```
7. GitHub: **Settings → Pages → Source: GitHub Actions**. Если оставили отдельный `slug.json` — **Settings → Secrets and variables → Actions → Variables → New variable**: `VITE_CLIENT = autolux`.
8. `git add -A; git commit -m "client: autolux"; git push` → Actions соберёт и опубликует сайт.
9. Проверить по QA-чек-листу ниже и отправить ссылку клиенту.

**Итого: 12–18 минут.** Из них 5 — картинки.

---

## Вариант B — один репозиторий на всех (быстрые демо-ссылки)

`VITE_CLIENT` читается в `src/hooks/useConfig.ts`: сборка кладёт в `dist/clients/<slug>.json` нужный конфиг.

```powershell
$env:VITE_CLIENT='autolux'; npm run dev      # локально
$env:VITE_CLIENT='autolux'; npm run build    # сборка под клиента
```
```bash
VITE_CLIENT=autolux npm run dev              # bash/macOS
```

На GitHub: **Settings → Secrets and variables → Actions → Variables → `VITE_CLIENT=autolux`** → Actions → **Run workflow**.
Одна ссылка `.../test-client/` показывает выбранного клиента. Минус: одновременно только один клиент. Для параллельных демо — вариант A.

---

## QA-чек-лист перед отправкой (3 минуты, с телефона)

- [ ] Название, логотип, телефон, адрес — **клиента**, нигде не осталось «Ваша Студия».
- [ ] Телефон кликается (`tel:`), Telegram-ник ведёт в нужный чат, адрес открывает Яндекс.Карты.
- [ ] Услуги: названия, цены, длительности; слоты времени = рабочие часы (`working_hours`).
- [ ] Пройдена вся запись: услуга → данные → дата/время → подтверждение.
- [ ] Маска телефона: ввод 10 цифр даёт `+7 (999) 123-45-67`, кнопка «Выбрать время» активна.
- [ ] «Отправить заявку в Telegram» открывает чат с заполненным текстом.
- [ ] Кабинет: статусы «Приехал / Не приехал / Ожидается» переключаются, выручка и конверсия меняются.
- [ ] Нет горизонтального скролла на 360×640 и на 390×844.
- [ ] Иконка на домашнем экране (manifest) и `images/demo/icon-192.png` не дают 404.
- [ ] Ссылка открывается в инкогнито (без кэша) и в Telegram in-app браузере.

---

## После продажи (подписка 300–500 ₽/мес)

| Задача | Как | Время |
|---|---|---|
| Поменять цены/тексты | правка `demo.json` → push | 2 мин + 1–2 мин деплой |
| Заменить фото | файл с тем же именем → push | 1 мин |
| Свой домен | Settings → Pages → Custom domain + DNS у регистратора (`CNAME → <user>.github.io`) | 10 мин |
| Откат правок | `git revert` / тег перед правкой (`git tag client-2026-11`) | 2 мин |
| Клиент просит CRM | тариф «Бизнес»: кабинет уже в шаблоне, данные демо | — |

Стоимость эксплуатации: GitHub Pages — бесплатно (публичный репозиторий), домен 200–800 ₽/год, хостинга и БД нет.

---

## Полезные команды

```powershell
npm run client:new -- --slug=<slug> --name="<Название>"   # новый клиент
npm run typecheck                                        # только проверка типов
npm run build                                            # прод-сборка
npm run preview                                          # проверить прод-сборку локально
```

## Что нельзя делать

- Класть `dist/` и `node_modules/` в репозиторий (есть `.gitignore`).
- Менять `vite.config.ts: base` вручную: на Pages база подставляется из `VITE_BASE=/<repo>/` в workflow.
- Использовать `motion` из `framer-motion` напрямую — только `m as motion` из `src/motion.tsx`, иначе фичи анимаций вернутся в основной бандл (см. комментарий в файле).
