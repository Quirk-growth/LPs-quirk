/* ============================================
   Quirk · Isca paga (R$ 27,90) — captura + redirect pro checkout
   ============================================ */

const CONFIG = {
  // Captura do lead ANTES do pagamento (cenário Make "Kit Pago R$27,90 - Captura" 4802778).
  WEBHOOK_URL: 'https://hook.us1.make.com/qmyn1t8o7a9e1h3uvj3friza5ow3sxso',
  // Checkout da Green (pagamento dos R$ 27,90).
  CHECKOUT_URL: 'https://payfast.greenn.com.br/tvj52m6/offer/KwxKhg',
  DEBUG_MODE: false, // true = não posta nem redireciona de verdade (só console.log)
};

const form = document.getElementById('lead-form');
const submitError = document.getElementById('submit-error');

// Máscara de WhatsApp
const wpp = document.getElementById('whatsapp');
wpp.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
  else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5}).*/, '($1) $2');
  else if (v.length > 0) v = v.replace(/(\d*)/, '($1');
  e.target.value = v;
});

function fail(msg) {
  submitError.textContent = msg;
  submitError.style.display = 'block';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitError.style.display = 'none';

  const fd = Object.fromEntries(new FormData(form).entries());
  const nome = (fd.nome || '').trim();
  const email = (fd.email || '').trim();
  const whatsapp = (fd.whatsapp || '').trim();

  if (!nome) return fail('Preenche seu nome pra continuar.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Coloca um email válido.');
  if (whatsapp.replace(/\D/g, '').length < 10) return fail('Coloca um WhatsApp com DDD.');
  if (!fd.lgpd) return fail('Você precisa aceitar pra continuar.');

  const payload = {
    nome, email, whatsapp,
    origem: 'isca-paga-kit-27',
    produto: 'Kit Quirk R$27,90',
    submitted_at: new Date().toISOString(),
    utm_source: new URLSearchParams(location.search).get('utm_source') || '',
    utm_campaign: new URLSearchParams(location.search).get('utm_campaign') || '',
  };

  const btn = form.querySelector('.btn-primary');
  btn.disabled = true; btn.textContent = 'Redirecionando...';

  // GTM: evento de lead (o GTM dispara Meta Lead + API de Conversão a partir daqui)
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'gerar_lead',
    produto: 'Kit Quirk R$27,90', valor: 27.90, moeda: 'BRL',
    lead: { nome: nome, email: email, telefone: whatsapp.replace(/\D/g, '') },
  });

  try {
    if (!CONFIG.DEBUG_MODE && CONFIG.WEBHOOK_URL.startsWith('http')) {
      await fetch(CONFIG.WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      console.log('[DEBUG] captura', payload);
    }
  } catch (_) { /* não bloqueia o pagamento se a captura falhar */ }

  // GTM: início de checkout (o GTM dispara Meta InitiateCheckout + API de Conversão a partir daqui)
  window.dataLayer.push({ event: 'iniciar_checkout', produto: 'Kit Quirk R$27,90', valor: 27.90, moeda: 'BRL' });

  const irProCheckout = () => {
    if (!CONFIG.DEBUG_MODE && CONFIG.CHECKOUT_URL.startsWith('http')) {
      window.location.href = CONFIG.CHECKOUT_URL;
    } else {
      console.log('[DEBUG] redirecionaria para', CONFIG.CHECKOUT_URL);
      btn.disabled = false; btn.textContent = 'Ir para o pagamento seguro →';
      fail('[modo teste] Captura ok. Configure WEBHOOK_URL e CHECKOUT_URL pra ativar de verdade.');
    }
  };
  // pequena folga pro GTM disparar as tags antes de sair da página
  setTimeout(irProCheckout, 400);
});
