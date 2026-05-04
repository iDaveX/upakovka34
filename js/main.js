const header = document.querySelector('.site-header');
const nav = document.querySelector('.site-nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.nav-links a, .nav-cta');
const contactForm = document.getElementById('contact-form');
const contactSuccess = document.getElementById('contact-success');

const syncHeaderState = () => {
  if (!header) {
    return;
  }

  header.classList.toggle('scrolled', window.scrollY > 8);
};

const closeMenu = () => {
  if (!nav || !navToggle) {
    return;
  }

  nav.classList.remove('menu-open');
  document.body.classList.remove('menu-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Открыть меню');
};

const resetSubmitButton = (button) => {
  button.disabled = false;
  button.textContent = 'Отправить заявку';
};

const handleSuccess = () => {
  contactForm.hidden = true;
  contactSuccess.hidden = false;
};

const sendViaTelegram = async (form) => {
  const payload = {
    name: form.querySelector('[name="name"]').value.trim(),
    contact: form.querySelector('[name="contact"]').value.trim(),
    details: form.querySelector('[name="details"]').value.trim(),
  };

  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('api-error');

  const result = await response.json();
  if (!result.ok) throw new Error('telegram-error');

  return true;
};

const sendViaFormSubmit = async (form) => {
  const data = new FormData(form);
  const ep = atob('Z2Fsb3lhbmRhdmlkOEBnbWFpbC5jb20=');
  const response = await fetch(`https://formsubmit.co/ajax/${ep}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: data,
  });

  return response.ok;
};

if (nav && navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('menu-open');
    document.body.classList.toggle('menu-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}

window.addEventListener('scroll', syncHeaderState, { passive: true });
syncHeaderState();

if (contactForm && contactSuccess) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Отправляем…';

    try {
      const sentToTelegram = await sendViaTelegram(contactForm);

      if (sentToTelegram) {
        handleSuccess();
        return;
      }

      const sentToEmail = await sendViaFormSubmit(contactForm);

      if (sentToEmail) {
        handleSuccess();
        return;
      }

      resetSubmitButton(btn);
      alert('Не удалось отправить заявку. Напишите нам напрямую в Telegram: +7 906 404 44 88');
    } catch {
      resetSubmitButton(btn);
      alert('Не удалось отправить заявку. Напишите нам в Telegram или WhatsApp: +7 906 404 44 88');
    }
  });
}
