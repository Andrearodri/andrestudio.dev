// Public configuration only. Never put API keys, Pix keys or private assets here.
export const commerce = Object.freeze({
  checkoutUrl: '', // Paste the approved product's https://pay.kiwify.com.br/... URL here.
  checkoutEnabled: false, // Enable only after materials, lessons and delivery are verified.
  pilotPrice: 97,
  regularPrice: 147,
  pilotLimit: 10,
  whatsapp: '5598981483900'
});
export function approvedCheckoutUrl(config = commerce) {
  if (!config.checkoutEnabled || !config.checkoutUrl) return null;
  try {
    const url = new URL(config.checkoutUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'pay.kiwify.com.br' || url.username || url.password || url.port || url.pathname === '/') return null;
    return url.href;
  } catch { return null; }
}
export function pilotWhatsappUrl(config = commerce) {
  const message = `Olá, AndreStudio! Tenho interesse no Kit Vídeo Pronto para Produzir, lote piloto de R$ ${config.pilotPrice}, limitado aos ${config.pilotLimit} primeiros compradores. Quero confirmar disponibilidade e conteúdo antes de comprar com atendimento via Pix.`;
  return `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`;
}
