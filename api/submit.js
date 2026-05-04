export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { name, contact, details } = req.body || {};

  if (!name || !contact) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const text = [
    '📦 *Новая заявка с сайта Упаковка*',
    '',
    `*Имя:* ${name}`,
    `*Контакт:* ${contact}`,
    details ? `*Задача:* ${details}` : null,
  ].filter(Boolean).join('\n');

  const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });

  const tgData = await tgRes.json();

  if (!tgData.ok) {
    return res.status(500).json({ ok: false, error: 'Telegram error' });
  }

  return res.status(200).json({ ok: true });
}
