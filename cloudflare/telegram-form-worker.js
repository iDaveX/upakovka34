export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(env.ALLOWED_ORIGIN),
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse(
        { ok: false, error: 'method_not_allowed' },
        405,
        env.ALLOWED_ORIGIN,
      );
    }

    try {
      const payload = await request.json();
      const validationError = validatePayload(payload);

      if (validationError) {
        return jsonResponse(
          { ok: false, error: validationError },
          400,
          env.ALLOWED_ORIGIN,
        );
      }

      if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
        return jsonResponse(
          { ok: false, error: 'worker_not_configured' },
          500,
          env.ALLOWED_ORIGIN,
        );
      }

      const message = buildTelegramMessage(payload);
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        },
      );

      const telegramResult = await telegramResponse.json();

      if (!telegramResponse.ok || !telegramResult.ok) {
        return jsonResponse(
          {
            ok: false,
            error: 'telegram_send_failed',
            telegramResult,
          },
          502,
          env.ALLOWED_ORIGIN,
        );
      }

      return jsonResponse({ ok: true }, 200, env.ALLOWED_ORIGIN);
    } catch (error) {
      return jsonResponse(
        {
          ok: false,
          error: 'unexpected_error',
          details: error instanceof Error ? error.message : String(error),
        },
        500,
        env.ALLOWED_ORIGIN,
      );
    }
  },
};

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'invalid_payload';
  }

  if (!payload.name || !String(payload.name).trim()) {
    return 'missing_name';
  }

  if (!payload.contact || !String(payload.contact).trim()) {
    return 'missing_contact';
  }

  if (!payload.details || !String(payload.details).trim()) {
    return 'missing_details';
  }

  if (payload.consent !== true) {
    return 'consent_required';
  }

  return null;
}

function buildTelegramMessage(payload) {
  const lines = [
    '<b>Новая заявка с сайта Упаковка</b>',
    '',
    `<b>Имя:</b> ${escapeHtml(String(payload.name).trim())}`,
    `<b>Телефон / Telegram:</b> ${escapeHtml(String(payload.contact).trim())}`,
    `<b>Описание:</b> ${escapeHtml(String(payload.details).trim())}`,
  ];

  if (payload.source) {
    lines.push(`<b>Источник:</b> ${escapeHtml(String(payload.source).trim())}`);
  }

  return lines.join('\n');
}

function buildCorsHeaders(allowedOrigin = '*') {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(body, status, allowedOrigin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...buildCorsHeaders(allowedOrigin),
    },
  });
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
