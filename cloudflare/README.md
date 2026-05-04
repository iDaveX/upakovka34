# Cloudflare Worker relay for Telegram form submissions

Что это делает
- Статический сайт не хранит bot token во фронтенде.
- Форма отправляется в Cloudflare Worker.
- Worker пересылает заявку в Telegram Bot API через `sendMessage`.

Файлы
- `cloudflare/telegram-form-worker.js`
- `cloudflare/wrangler.toml`

## Что нужно подготовить

1. Bot token Telegram
2. Chat ID, куда слать заявки
3. Домен сайта, например `https://upakovka-site.ru`
4. Установленный Wrangler:
   `npm install -g wrangler`

## Как получить chat_id

Самый простой путь:
1. Напиши своему боту в Telegram любое сообщение.
2. Открой в браузере:
   `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Найди `chat.id` в ответе JSON.

## Настройка Worker

Из папки `cloudflare/`:

```bash
cd /Users/dave/Development/pakstor-site/cloudflare
wrangler login
```

Проверь `wrangler.toml`:
- `name` — имя worker
- `ALLOWED_ORIGIN` — домен сайта

Потом добавь секреты:

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

Деплой:

```bash
wrangler deploy
```

После деплоя получишь URL вида:
- `https://pakstor-telegram-form.<subdomain>.workers.dev`

## Подключение к сайту

Открой `index.html` и вставь URL worker в meta tag:

```html
<meta name="telegram-form-endpoint" content="https://pakstor-telegram-form.<subdomain>.workers.dev" />
```

Сейчас этот meta tag уже добавлен, но `content` пустой.

## Как работает фронтенд сейчас

`js/main.js` делает так:
1. Если `telegram-form-endpoint` заполнен — шлёт заявку в Worker
2. Если endpoint пустой — использует текущий fallback через FormSubmit на email

Это значит, что сайт не ломается до момента подключения Worker.

## Формат сообщений в Telegram

Worker присылает сообщение вида:

- Новая заявка с сайта Упаковка
- Имя
- Телефон / Telegram
- Описание
- Источник (URL страницы)

## Что проверить после запуска

1. Открой сайт на реальном домене
2. Заполни форму
3. Проверь, что заявка пришла в Telegram
4. Если не пришла:
   - проверь `TELEGRAM_BOT_TOKEN`
   - проверь `TELEGRAM_CHAT_ID`
   - проверь `ALLOWED_ORIGIN`
   - открой логи:
     `wrangler tail`
