export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { name, contact, details } = req.body || {};

  const trimmed = {
    name: (name || '').trim(),
    contact: (contact || '').trim(),
    details: (details || '').trim(),
  };

  if (!trimmed.name || !trimmed.contact) {
    return res.status(400).json({ ok: false, error: 'Missing required fields' });
  }

  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'Server misconfiguration' });
  }

  const lines = [
    '📦 Новая заявка с сайта Упаковка',
    '',
    `Имя: ${trimmed.name}`,
    `Контакт: ${trimmed.contact}`,
  ];
  if (trimmed.details) lines.push(`Задача: ${trimmed.details}`);

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n') }),
    });

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return res.status(500).json({ ok: false, error: 'Telegram error' });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: 'Network error' });
  }
}
