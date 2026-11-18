// Configuração centralizada da marca, contatos reais e verticais da André Studio.
// Contém apenas dados institucionais públicos. Nunca armazene chaves de API ou segredos aqui.

const freezeDeep = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    freezeDeep(obj[key]);
  }
  return obj;
};

export const BRAND_CONFIG = freezeDeep({
  brandName: 'André Studio',
  siteName: 'AndreStudio.dev',
  siteUrl: 'https://andrestudio.dev.br',
  founder: 'André Rodrigues',
  roleLabel: 'Desenvolvimento Full-Stack, Sistemas Web & IA Aplicada',
  location: 'São Luís — MA',
  coverage: 'Atendimento remoto para todo o Brasil',
  whatsappNumber: '5598981483900',
  whatsappFormatted: '+55 (98) 98148-3900',
  whatsappUrl: 'https://wa.me/5598981483900',
  email: 'andre@andrestudio.dev.br',
  githubUrl: 'https://github.com/Andrearodri',
  linkedinUrl: 'https://www.linkedin.com/in/andreaparecidorodrigues-dev/',
  links: {
    home: '/',
    auditorHome: '/#auditor-ia',
    auditorPage: '/ferramentas/auditor-ia/',
    tools: '/ferramentas/',
    kits: '/kits/',
    services: '/servicos/',
    web: '/servicos/sites-premium/',
    automation: '/servicos/automacao-com-ia/',
    video: '/servicos/edicao-de-video-profissional/',
    briefing: '/contato/#briefing',
    privacy: '/privacidade/'
  },
  portfolio: [
    {
      name: 'Sou Fé e Ação',
      url: 'https://soufeeacao.com.br',
      kind: 'Projeto web publicado'
    },
    {
      name: 'Lead Flow Studio (Demo Edge)',
      url: 'https://lead-flow-studio.vetoropus.workers.dev/',
      kind: 'Showcase em Cloudflare Workers'
    },
    {
      name: 'OmniAgent Studio',
      url: '/portfolio/omniagent-ai-demo/',
      kind: 'Demonstração local de triagem IA'
    },
    {
      name: 'Cardápio Digital',
      url: '/portfolio/cardapio-digital-demo/',
      kind: 'MVP demonstrativo'
    },
    {
      name: 'Lead Flow CRM (Local)',
      url: '/demo/',
      kind: 'Demonstração interativa'
    },
    {
      name: 'Sistema André Studio (GitHub)',
      url: 'https://github.com/Andrearodri/sistemandrestudio',
      kind: 'Repositório técnico'
    },
    {
      name: 'AndreStudio.dev (GitHub)',
      url: 'https://github.com/Andrearodri/andrestudio.dev',
      kind: 'Repositório oficial do site'
    }
  ],
  verticals: [
    {
      id: 'educacao-ia',
      index: 'FRENTE 01 · EDUCAÇÃO & CAPACITAÇÃO',
      title: 'Treinamento Prático em IA para Equipes e Empresários',
      summary: 'Cursos práticos, mentoria aplicada e capacitação in-company para quem nunca usou IA aprender do zero com foco em venda, atendimento e produtividade real.',
      outcomes: [
        'Aprendizado prático do zero com casos reais da sua empresa',
        'Playbooks e prompts prontos para comercial, atendimento e financeiro',
        'Autonomia em dias para reduzir retrabalho sem depender de terceiros'
      ],
      ctaLabel: 'Quero capacitar minha equipe',
      ctaHref: '/kits/'
    },
    {
      id: 'engenharia-ia',
      index: 'FRENTE 02 · ENGENHARIA FULL-STACK & IA',
      title: 'Sites de Alta Performance, Sistemas Web e Agentes Sob Medida',
      summary: 'Arquitetura e desenvolvimento completo de landing pages rápidas, sistemas internos, painéis operacionais e agentes de IA integrados ao WhatsApp do negócio.',
      outcomes: [
        'Sites e sistemas rápidos no ecossistema Cloudflare com zero gargalo',
        'Agentes de IA no WhatsApp para triagem, orçamento e recuperação de leads',
        'Painéis financeiros, CRMs enxutos e integrações sob medida para PMEs'
      ],
      ctaLabel: 'Quero construir meu sistema',
      ctaHref: '/servicos/'
    }
  ]
});

/**
 * Normaliza dígitos de WhatsApp brasileiro (remove DDI 55 quando colado completo).
 * @param {unknown} value
 * @returns {string}
 */
export function extractBrPhoneDigits(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 11);
}

/**
 * Formata entrada de telefone/WhatsApp no padrão brasileiro (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX.
 * @param {unknown} value
 * @returns {string}
 */
export function formatPhoneMaskBr(value) {
  const digits = extractBrPhoneDigits(value);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Monta link seguro para o WhatsApp da André Studio com truncamento seguro de mensagem.
 * @param {string} message
 * @param {string} [phone]
 * @returns {string}
 */
export function buildWhatsappLink(message, phone = BRAND_CONFIG.whatsappNumber) {
  const safeDigits = String(phone ?? '').replace(/\D/g, '');
  const targetPhone = /^\d{10,15}$/.test(safeDigits) ? safeDigits : BRAND_CONFIG.whatsappNumber;
  const cleanMessage = String(message ?? '')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .trim();
  if (!cleanMessage) {
    return `https://wa.me/${targetPhone}`;
  }
  const maxLen = 1750;
  const bounded = cleanMessage.length > maxLen
    ? `${cleanMessage.slice(0, maxLen - 1).trimEnd()}…`
    : cleanMessage;
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(bounded)}`;
}
