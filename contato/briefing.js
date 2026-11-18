(() => {
  'use strict';

  const form = document.getElementById('briefing-form');
  const preview = document.getElementById('briefing-preview');
  const message = document.getElementById('briefing-message');
  const emailLink = document.getElementById('briefing-email');
  const copyButton = document.getElementById('briefing-copy');
  const status = document.getElementById('briefing-status');
  if (!form || !preview || !message || !emailLink || !copyButton || !status) return;

  const name = document.getElementById('briefing-name');
  const business = document.getElementById('briefing-business');
  const objective = document.getElementById('briefing-objective');
  const deadline = document.getElementById('briefing-deadline');

  form.addEventListener('input', (event) => {
    if (typeof event.target.setCustomValidity === 'function') {
      event.target.setCustomValidity('');
    }
    if (!preview.hidden) {
      preview.hidden = true;
      message.value = '';
      emailLink.removeAttribute('href');
      status.textContent = 'Você alterou o briefing. Prepare a mensagem novamente para revisar a versão atualizada.';
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    name.setCustomValidity(name.value.trim() ? '' : 'Informe seu nome.');
    objective.setCustomValidity(objective.value.trim() ? '' : 'Conte o que você precisa criar ou melhorar.');
    if (!form.reportValidity()) return;

    const lines = [
      'Olá, André. Quero conversar sobre um projeto.',
      '',
      `Nome: ${name.value.trim()}`,
    ];
    if (business.value.trim()) lines.push(`Negócio: ${business.value.trim()}`);
    lines.push('', 'O que preciso:', objective.value.trim());
    if (deadline.value.trim()) lines.push('', `Prazo desejado: ${deadline.value.trim()}`);

    const text = lines.join('\n');
    message.value = text;
    emailLink.href = 'mailto:andre@andrestudio.dev.br?subject=' +
      encodeURIComponent('Briefing de projeto — AndreStudio.dev') +
      '&body=' + encodeURIComponent(text);
    preview.hidden = false;
    status.textContent = 'Mensagem preparada para revisão. Nada foi enviado. Abra seu aplicativo de e-mail ou copie o texto para continuar.';
    message.focus();
  });

  copyButton.addEventListener('click', async () => {
    if (preview.hidden || !message.value) return;
    const text = message.value;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('clipboard-unavailable');
      await navigator.clipboard.writeText(text);
      if (!preview.hidden && message.value === text) {
        status.textContent = 'Texto copiado. Cole no seu e-mail ou no WhatsApp e conclua o envio por lá.';
      }
    } catch {
      if (!preview.hidden && message.value === text) {
        message.focus();
        message.select();
        status.textContent = 'Não foi possível copiar automaticamente. O texto está selecionado: use a opção Copiar do seu dispositivo.';
      }
    }
  });

  form.hidden = false;
})();
