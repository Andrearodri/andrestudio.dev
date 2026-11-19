// Presets realistas por nicho de PME brasileira + adaptação inteligente para nicho customizado.

export const NICHES = Object.freeze([
  {
    id: 'clinica',
    label: 'Clínica / Consultório',
    shortTag: 'Saúde, Estética & Odontologia',
    description: 'Pacientes que pedem preço no WhatsApp, faltas na agenda e triagem manual.',
    exampleCompany: 'Clínica Vida & Sorriso'
  },
  {
    id: 'comercio',
    label: 'Comércio / Loja Física & Online',
    shortTag: 'Varejo, Moda & Eletrônicos',
    description: 'Taxas de maquininha/marketplace corroendo o markup e dúvidas de estoque no direct.',
    exampleCompany: 'Casa & Estilo Store'
  },
  {
    id: 'restaurante',
    label: 'Restaurante / Delivery',
    shortTag: 'Gastronomia, iFood & Cardápio Próprio',
    description: 'Comissão de apps engolindo o lucro de pratos carro-chefe e demora no pedido.',
    exampleCompany: 'Braseiro Express'
  },
  {
    id: 'servicos',
    label: 'Prestador de Serviços / Oficina',
    shortTag: 'Climatização, Automotiva & Manutenção',
    description: 'Orçamentos técnicos parados sem follow-up e horas perdidas em propostas manuais.',
    exampleCompany: 'ClimaTech Serviços'
  },
  {
    id: 'escritorio',
    label: 'Escritório Contábil / Jurídico',
    shortTag: 'Contabilidade, Advocacia & B2B',
    description: 'Triagem lenta de documentos, atendimento repetitivo e propostas consultivas manuais.',
    exampleCompany: 'Silva & Associados'
  },
  {
    id: 'custom',
    label: 'Outro Nicho',
    shortTag: 'Personalizado para seu segmento',
    description: 'Adapta cenários, planilhas e recomendações automaticamente para o seu ramo.',
    exampleCompany: 'Minha Empresa'
  }
]);

const NICHE_PRESETS = {
  clinica: {
    whatsapp: {
      leadsPerMonth: 240,
      eligibleQuotes: 40,
      recoveryRatePct: 5,
      currentConversionPct: 18,
      averageTicket: 420,
      grossMarginPct: 68,
      avgResponseMinutes: 55,
      followUpSteps: 1,
      conversationsSample: [
        'Paciente: "Oi, qual o valor da limpeza e avaliação?" -> Equipe responde só 1h depois: "R$ 420,00. Quer agendar?" -> Paciente visualiza e some.',
        'Objeções mais comuns: "Vou ver minha agenda e te retorno", "Aceita convênio ou parcela no cartão?", "Achei mais barato na clínica do bairro".',
        'Horário de pico: 40% das mensagens chegam entre 18h30 e 22h quando a recepção já fechou.'
      ].join('\n')
    },
    pricing: {
      cardFeePct: 4.9,
      taxRatePct: 11.3,
      hiddenCostsPct: 3.5,
      fixedMonthlyOverhead: 18500,
      targetNetMarginPct: 24,
      items: [
        { name: 'Avaliação + Limpeza Ultrassônica', unitCost: 115, currentPrice: 220, monthlyQty: 52 },
        { name: 'Sessão Bioestimulador / Estética', unitCost: 620, currentPrice: 840, monthlyQty: 14 },
        { name: 'Clareamento Combinado', unitCost: 340, currentPrice: 890, monthlyQty: 22 },
        { name: 'Protocolo Pacote 3 Sessões (Promoção)', unitCost: 480, currentPrice: 540, monthlyQty: 18 },
        { name: 'Manutenção Mensal Recorrente', unitCost: 75, currentPrice: 260, monthlyQty: 60 }
      ]
    },
    automation: {
      teamSize: 4,
      avgMonthlySalary: 2350,
      chargesMultiplier: 1.38,
      productiveHoursPerMonth: 160,
      repetitiveHoursPerWeekPerPerson: 9.5,
      workflowDescription: 'Recepção confirma consultas manualmente no WhatsApp uma a uma, envia lista de preços repetida, preenche ficha de anamnese em PDF/Word e faz cobrança manual de retornos sem CRM.'
    }
  },
  comercio: {
    whatsapp: {
      leadsPerMonth: 380,
      eligibleQuotes: 55,
      recoveryRatePct: 5,
      currentConversionPct: 14,
      averageTicket: 265,
      grossMarginPct: 44,
      avgResponseMinutes: 40,
      followUpSteps: 0,
      conversationsSample: [
        'Cliente: "Tem esse modelo no M? Faz entrega hoje e quanto fica em 6x?" -> Vendedor demora para checar estoque físico e responde seco sem link ou foto no corpo.',
        'Objeções comuns: "Frete ficou caro", "Vou pensar e depois volto", "No marketplace está R$ 15 mais barato".',
        'Carrinhos e orçamentos iniciados no WhatsApp ficam sem nenhum retorno após 24 horas.'
      ].join('\n')
    },
    pricing: {
      cardFeePct: 6.2,
      taxRatePct: 7.5,
      hiddenCostsPct: 4.5,
      fixedMonthlyOverhead: 14200,
      targetNetMarginPct: 18,
      items: [
        { name: 'Produto Âncora (Camisa Premium)', unitCost: 72, currentPrice: 169.9, monthlyQty: 85 },
        { name: 'Kit Promoção Leve 3 Pague 2', unitCost: 138, currentPrice: 165, monthlyQty: 42 },
        { name: 'Tênis Linha Casual (Parcelado 10x)', unitCost: 168, currentPrice: 279, monthlyQty: 55 },
        { name: 'Acessório Entrada (Frete Grátis)', unitCost: 39, currentPrice: 44.9, monthlyQty: 90 },
        { name: 'Jaqueta Coleção Inverno', unitCost: 125, currentPrice: 349, monthlyQty: 26 }
      ]
    },
    automation: {
      teamSize: 5,
      avgMonthlySalary: 2100,
      chargesMultiplier: 1.38,
      productiveHoursPerMonth: 160,
      repetitiveHoursPerWeekPerPerson: 8.5,
      workflowDescription: 'Vendedores digitam descrições e preços manualmente para cada cliente no WhatsApp, conferem estoque olhando prateleira/sistema antigo e copiam dados de endereço um a um para emitir etiqueta.'
    }
  },
  restaurante: {
    whatsapp: {
      leadsPerMonth: 620,
      eligibleQuotes: 65,
      recoveryRatePct: 5,
      currentConversionPct: 26,
      averageTicket: 84,
      grossMarginPct: 54,
      avgResponseMinutes: 18,
      followUpSteps: 0,
      conversationsSample: [
        'Cliente: "Oi, qual o cardápio de hoje e taxa para o bairro Cohama?" -> Atendente manda PDF pesado de 8MB difícil de abrir no celular; cliente desiste e pede no app concorrente.',
        'Sexta e sábado à noite mensagens acumulam 25 minutos sem resposta durante o pico da cozinha.',
        'Clientes antigos que pediam todo fim de semana não recebem disparo de reativação ou combo direto.'
      ].join('\n')
    },
    pricing: {
      cardFeePct: 14.5,
      taxRatePct: 6.0,
      hiddenCostsPct: 5.5,
      fixedMonthlyOverhead: 16000,
      targetNetMarginPct: 18,
      items: [
        { name: 'Burger Smash Duplo + Fritas (App)', unitCost: 19.5, currentPrice: 36, monthlyQty: 260 },
        { name: 'Combo Família 4 Pessoas (Promocional)', unitCost: 68, currentPrice: 89, monthlyQty: 75 },
        { name: 'Prato Executivo Almoço (Marmita)', unitCost: 17.8, currentPrice: 23.5, monthlyQty: 310 },
        { name: 'Pizza Grande Artesanal', unitCost: 22.0, currentPrice: 68, monthlyQty: 180 },
        { name: 'Sobremesa da Casa + Bebida', unitCost: 6.5, currentPrice: 24, monthlyQty: 210 }
      ]
    },
    automation: {
      teamSize: 4,
      avgMonthlySalary: 1900,
      chargesMultiplier: 1.38,
      productiveHoursPerMonth: 160,
      repetitiveHoursPerWeekPerPerson: 10,
      workflowDescription: 'Atendente fica presa respondendo "qual o cardápio", "quanto é a entrega" e anotando pedidos do WhatsApp na mão para redigitar no PDV e conferir comprovante Pix.'
    }
  },
  servicos: {
    whatsapp: {
      leadsPerMonth: 135,
      eligibleQuotes: 24,
      recoveryRatePct: 5,
      currentConversionPct: 21,
      averageTicket: 780,
      grossMarginPct: 62,
      avgResponseMinutes: 95,
      followUpSteps: 1,
      conversationsSample: [
        'Cliente: "Preciso de instalação/manutenção para 2 equipamentos ainda essa semana, quanto fica?" -> Técnico em campo só vê a mensagem no fim do dia.',
        'Orçamentos enviados em texto solto sem garantia clara ou opções (Básico vs Completo) fazem o cliente comparar só pelo menor preço.',
        'Mais de 60 orçamentos enviados no mês nunca receberam segunda mensagem de acompanhamento.'
      ].join('\n')
    },
    pricing: {
      cardFeePct: 4.5,
      taxRatePct: 6.0,
      hiddenCostsPct: 6.5,
      fixedMonthlyOverhead: 9500,
      targetNetMarginPct: 25,
      items: [
        { name: 'Visita Técnica + Diagnóstico (Descontada)', unitCost: 95, currentPrice: 100, monthlyQty: 35 },
        { name: 'Manutenção Preventiva Completa', unitCost: 145, currentPrice: 390, monthlyQty: 44 },
        { name: 'Instalação Padrão com Material Incluso', unitCost: 390, currentPrice: 620, monthlyQty: 24 },
        { name: 'Reparo Emergencial Fim de Semana', unitCost: 190, currentPrice: 220, monthlyQty: 18 },
        { name: 'Contrato Mensal Empresa (Preventiva)', unitCost: 260, currentPrice: 790, monthlyQty: 16 }
      ]
    },
    automation: {
      teamSize: 3,
      avgMonthlySalary: 2800,
      chargesMultiplier: 1.38,
      productiveHoursPerMonth: 160,
      repetitiveHoursPerWeekPerPerson: 9,
      workflowDescription: 'Sócio e técnicos param o serviço para redigir orçamentos no Word/WhatsApp, buscar histórico de equipamentos do cliente em conversas antigas e cobrar aprovações manualmente.'
    }
  },
  escritorio: {
    whatsapp: {
      leadsPerMonth: 95,
      eligibleQuotes: 16,
      recoveryRatePct: 5,
      currentConversionPct: 19,
      averageTicket: 1350,
      grossMarginPct: 74,
      avgResponseMinutes: 70,
      followUpSteps: 1,
      conversationsSample: [
        'Lead: "Quero abrir CNPJ / revisar situação contratual, quanto custa a assessoria?" -> Equipe pede 8 documentos de uma vez de forma fria e lead trava.',
        'Objeções comuns: "Vou conversar com meu sócio", "Já tenho profissional mas estou avaliando trocar", "Achei a mensalidade alta no início".',
        'Propostas demoram até 2 dias para serem montadas e enviadas após a primeira conversa.'
      ].join('\n')
    },
    pricing: {
      cardFeePct: 2.2,
      taxRatePct: 13.5,
      hiddenCostsPct: 4.0,
      fixedMonthlyOverhead: 19500,
      targetNetMarginPct: 30,
      items: [
        { name: 'Honorário Mensal MEI / Micro (Básico)', unitCost: 195, currentPrice: 230, monthlyQty: 38 },
        { name: 'Assessoria Simples Nacional Padrão', unitCost: 310, currentPrice: 780, monthlyQty: 32 },
        { name: 'Abertura / Regularização Completa', unitCost: 420, currentPrice: 690, monthlyQty: 12 },
        { name: 'Parecer / Consultoria Pontual', unitCost: 380, currentPrice: 1250, monthlyQty: 14 },
        { name: 'Pacote Completo Retainer + BPO', unitCost: 620, currentPrice: 2200, monthlyQty: 10 }
      ]
    },
    automation: {
      teamSize: 5,
      avgMonthlySalary: 3200,
      chargesMultiplier: 1.38,
      productiveHoursPerMonth: 160,
      repetitiveHoursPerWeekPerPerson: 11,
      workflowDescription: 'Analistas gastam horas conferindo documentos enviados soltos por foto no WhatsApp, resumindo contratos extensos manualmente, redigindo e-mails de cobrança e preenchendo propostas.'
    }
  }
};

/**
 * Retorna preset realista completo para qualquer um dos 5 nichos ou adapta dinamicamente para nicho customizado.
 * @param {string} nicheId
 * @param {string} [customNicheName]
 */
export function getPresetForNiche(nicheId, customNicheName = '') {
  const safeCustom = String(customNicheName || '').trim().slice(0, 60);
  const meta = NICHES.find((n) => n.id === nicheId) || NICHES[NICHES.length - 1];

  if (NICHE_PRESETS[meta.id]) {
    const base = NICHE_PRESETS[meta.id];
    return {
      nicheId: meta.id,
      nicheLabel: meta.label,
      exampleCompany: meta.exampleCompany,
      whatsapp: { ...base.whatsapp },
      pricing: {
        ...base.pricing,
        items: base.pricing.items.map((item) => ({ ...item }))
      },
      automation: { ...base.automation }
    };
  }

  const label = safeCustom || 'Negócio Customizado';
  const slugRef = safeCustom ? `de ${safeCustom}` : 'do negócio';
  return {
    nicheId: 'custom',
    nicheLabel: label,
    exampleCompany: safeCustom ? `${safeCustom} Studio` : 'Empresa Modelo PME',
    whatsapp: {
      leadsPerMonth: 180,
      eligibleQuotes: 30,
      recoveryRatePct: 5,
      currentConversionPct: 17,
      averageTicket: 490,
      grossMarginPct: 60,
      avgResponseMinutes: 50,
      followUpSteps: 1,
      conversationsSample: [
        `Cliente ${slugRef}: "Oi, como funciona e qual o investimento?" -> Equipe responde tarde e envia tabela sem conduzir próximo passo.`,
        'Objeções frequentes: "Vou pensar e te aviso", "Precisa fechar agora?", "Qual a diferença para o concorrente mais barato?".',
        'Falta cadência automática de follow-up em 24h e 48h para orçamentos não fechados.'
      ].join('\n')
    },
    pricing: {
      cardFeePct: 4.8,
      taxRatePct: 8.5,
      hiddenCostsPct: 4.0,
      fixedMonthlyOverhead: 12000,
      targetNetMarginPct: 22,
      items: [
        { name: `Oferta Entrada ${slugRef}`, unitCost: 95, currentPrice: 110, monthlyQty: 40 },
        { name: `Serviço/Produto Principal ${slugRef}`, unitCost: 180, currentPrice: 340, monthlyQty: 45 },
        { name: `Combo Promocional ${slugRef}`, unitCost: 260, currentPrice: 360, monthlyQty: 22 },
        { name: `Plano Premium / Recorrente ${slugRef}`, unitCost: 220, currentPrice: 680, monthlyQty: 18 }
      ]
    },
    automation: {
      teamSize: 4,
      avgMonthlySalary: 2500,
      chargesMultiplier: 1.38,
      productiveHoursPerMonth: 160,
      repetitiveHoursPerWeekPerPerson: 9,
      workflowDescription: `Equipe de ${label} repete explicações manuais no WhatsApp, monta orçamentos do zero copiando modelos antigos e lança dados manualmente entre planilhas e mensagens.`
    }
  };
}
