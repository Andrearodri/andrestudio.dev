import { approvedCheckoutUrl, pilotWhatsappUrl } from '/data/commerce.mjs';
const checkout = document.getElementById('checkout-button');
const status = document.getElementById('checkout-status');
const url = approvedCheckoutUrl();
if (url) {
  checkout.href = url;
  checkout.removeAttribute('aria-disabled');
  checkout.textContent = 'Comprar agora no checkout';
  status.textContent = 'Pagamento e entrega pelo checkout externo. Confira as condições antes de concluir.';
} else {
  checkout.addEventListener('click', event => event.preventDefault());
}
document.getElementById('pilot-button').href = pilotWhatsappUrl();
