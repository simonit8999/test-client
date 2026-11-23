#!/usr/bin/env node
/**
 * Генератор нового клиента для demo-template.
 *
 * Что делает за один запуск:
 *   1) создаёт public/clients/<slug>.json на основе demo.json с подставленными данными;
 *   2) копирует картинки-заглушки в public/images/clients/<slug>/;
 *   3) переписывает пути к картинкам в JSON;
 *   4) печатает чек-лист, что осталось заменить вручную.
 *
 * Пример:
 *   npm run client:new -- --slug=autolux --name="Автолюкс" --phone="+7 (999) 111-22-33" \
 *     --address="Москва, Ленинградский пр-т, 1" --accent=#C5F015 --telegram=autolux_msk
 *
 * Никаких зависимостей — только стандартная библиотека Node 18+.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CLIENTS_DIR = join(ROOT, 'public', 'clients')
const IMAGES_DIR = join(ROOT, 'public', 'images')
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,30}$/

function parseArgs(argv) {
  const out = {}
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)(?:=(.*))?$/)
    if (!m) continue
    out[m[1]] = m[2] ?? ''
  }
  return out
}

function fail(message) {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

const args = parseArgs(process.argv.slice(2))

/**
 * --data=<файл.json> — надёжный способ передать кириллицу на Windows.
 * cmd.exe конвертирует аргументы в кодовую страницу консоли, из-за чего
 * «Автолюкс» может превратиться в «втолюкс». Через файл (UTF-8) такой
 * проблемы нет.
 *
 * Поля файла: name, logo, phone, address, accent, telegram.
 */
if (args.data) {
  const dataPath = join(ROOT, args.data)
  if (!existsSync(dataPath)) fail(`Не найден файл данных: ${args.data}`)
  let data
  try {
    data = JSON.parse(readFileSync(dataPath, 'utf8'))
  } catch (e) {
    fail(`Не удалось прочитать ${args.data}: ${e instanceof Error ? e.message : e}`)
  }
  for (const key of ['name', 'logo', 'phone', 'address', 'accent', 'telegram']) {
    if (data[key] && !args[key]) args[key] = String(data[key])
  }
}

const slug = (args.slug ?? '').trim()
if (!SLUG_RE.test(slug)) {
  fail('Укажите --slug латиницей (2–31 символов: a-z, 0-9, дефис). Пример: --slug=autolux')
}
if (slug === 'demo') fail('slug "demo" занят шаблоном — выберите другое имя.')

const targetJson = join(CLIENTS_DIR, `${slug}.json`)
if (existsSync(targetJson) && !('force' in args)) {
  fail(`Файл ${targetJson} уже существует. Добавьте --force, чтобы перезаписать.`)
}

const templatePath = join(CLIENTS_DIR, 'demo.json')
if (!existsSync(templatePath)) fail('Не найден public/clients/demo.json — запустите скрипт из корня проекта.')

const config = JSON.parse(readFileSync(templatePath, 'utf8'))

// --- данные клиента -------------------------------------------------------
config.business_name = args.name || `${slug}`
config.logo_text = args.logo || (args.name ? args.name.toUpperCase() : config.logo_text)
config.phone = args.phone || config.phone
config.address = args.address || config.address
config.accent_color = args.accent || config.accent_color
config.telegram_username = args.telegram || ''
config.isDemo = true // демо-баннер + демо-кабинет; для «боевой» версии поставьте false

// --- картинки -------------------------------------------------------------
const imageFolder = join(IMAGES_DIR, 'clients', slug)
mkdirSync(imageFolder, { recursive: true })

const demoImages = join(IMAGES_DIR, 'demo')
const toCopy = readdirSync(demoImages).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
for (const file of toCopy) {
  copyFileSync(join(demoImages, file), join(imageFolder, file))
}

const base = `/images/clients/${slug}`
const pick = (preferred, fallback) => (existsSync(join(imageFolder, preferred)) ? `${base}/${preferred}` : fallback)

config.hero_image = pick('hero.jpg', config.hero_image)
config.services = config.services.map((service, i) => ({
  ...service,
  image: pick(`srv${i + 1}.jpg`, service.image),
}))

writeFileSync(targetJson, `${JSON.stringify(config, null, 2)}\n`, 'utf8')

// --- отчёт ----------------------------------------------------------------
const rel = (p) => p.replace(ROOT, '.').replace(/\\/g, '/')

console.log(`
✔ Клиент «${config.business_name}» создан

  конфиг:    ${rel(targetJson)}
  картинки:  ${rel(imageFolder)}/  (${toCopy.join(', ')})

Дальше по шагам:

  1. Замените картинки в ${rel(imageFolder)}/
       hero.jpg   — 1600×1200, до 250 КБ (главный экран)
       srv1..3.jpg — 800×600, до 120 КБ (услуги)
  2. Проверьте тексты в ${rel(targetJson)}
       hero_title, hero_subtitle, услуги (name/price/duration_minutes), working_hours
  3. Иконка приложения (если нужна своя): public/images/demo/icon-192.png (192×192, PNG)
  4. Локальная проверка:
       npm run dev -- --host          → открыть со телефона по localhost-адресу
       npm run build                  → должен пройти без ошибок
  5. Деплой (см. docs/NEW-CLIENT.md):
       вариант A — отдельный репозиторий: скопируйте ${rel(targetJson)} поверх public/clients/demo.json
       вариант B — один репозиторий: задайте переменную репозитория VITE_CLIENT=${slug}
`)
