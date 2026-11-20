// Conteúdo por área. Exemplos descrevem o que as ferramentas FAZEM; nenhum número de resultado.
export const AREAS = {
  advocacia: {
    nome: 'Advocacia',
    titulo: 'Escritórios de advocacia',
    resumo: 'Consultas que chegam pelo WhatsApp, casos em várias etapas e honorários parcelados.',
    contato: 'Mensagem às 22h: “fui demitido e não recebi a rescisão”. A triagem identifica a área (trabalhista), pede só o necessário e agenda a conversa com quem cuida do assunto. Nenhuma orientação jurídica sai de forma automática.',
    acompanhar: 'Consulta inicial → documentos pendentes → proposta de honorários → contrato assinado. Cada caso numa coluna, com o próximo passo e a data.',
    receber: 'Honorários parcelados, parcelas em atraso e o caixa previsto do escritório. O lembrete de cobrança fica pronto para você revisar antes de enviar.',
    cuidado: 'A comunicação do escritório segue o Provimento 205/2021 da OAB: informativa e sóbria, sem promessa de resultado e sem captação indevida. Dados de clientes ficam sob sigilo e seguem a LGPD.',
  },
  contabilidade: {
    nome: 'Contabilidade',
    titulo: 'Escritórios de contabilidade',
    resumo: 'Muitas perguntas repetidas, propostas para empresas novas e mensalidades a acompanhar.',
    contato: '“Quanto custa abrir um MEI?” recebe a resposta padrão que você aprovou. “Quero trocar de contador” vai direto para você, com o porte e o regime da empresa já anotados.',
    acompanhar: 'Proposta → documentos da empresa → migração → cliente ativo. Fica claro quem está parado esperando documento.',
    receber: 'Mensalidades por cliente, quem está em atraso e o caixa previsto do escritório no mês.',
    cuidado: 'A resposta automática só usa informação que você aprovou. Dúvida fiscal específica é encaminhada para o contador.',
  },
  clinicas: {
    nome: 'Clínicas',
    titulo: 'Clínicas e consultórios',
    resumo: 'Perguntas sobre preço e horário a qualquer hora, orçamentos de tratamento e pacotes parcelados.',
    contato: '“Quanto custa a avaliação?” e “tem horário no sábado?” respondidas a qualquer hora, com a agenda que você liberar. Sintomas e diagnóstico ficam sempre com o profissional.',
    acompanhar: 'Avaliação → orçamento do tratamento → aprovação → sessões. Quem recebeu orçamento e não respondeu aparece na hora.',
    receber: 'Pacotes parcelados, pagamentos pendentes e a previsão do mês.',
    cuidado: 'A publicidade de saúde segue as regras do conselho de cada profissão, sem promessa de resultado. Dados de saúde são sensíveis pela LGPD e ficam protegidos.',
  },
  imobiliarias: {
    nome: 'Imobiliárias',
    titulo: 'Imobiliárias e corretores',
    resumo: 'Muitos interessados no mesmo imóvel, visitas a marcar e propostas em negociação.',
    contato: '“Esse apartamento ainda está disponível?” recebe os dados do imóvel e as perguntas certas: comprar ou alugar, faixa de valor, bairro. O corretor recebe o interessado já filtrado.',
    acompanhar: 'Interesse → visita → proposta → documentação → contrato. Cada imóvel com seus interessados e o próximo passo.',
    receber: 'Comissões a receber, aluguéis administrados em atraso e a previsão do mês.',
    cuidado: 'Preço e disponibilidade só como você cadastrou, e uma pessoa confirma antes de fechar qualquer coisa.',
  },
  outros: {
    nome: 'Outros serviços',
    titulo: 'Empresas que vendem por orçamento',
    resumo: 'Instalação, manutenção, reformas, eventos, consultorias: quem precisa ver, medir ou conversar antes de dar o preço.',
    contato: 'O pedido chega e a triagem pergunta o essencial: o quê, onde e para quando. O que é urgente aparece primeiro.',
    acompanhar: 'Pedido → visita técnica → orçamento → aprovação → execução. Orçamento parado vira lembrete, não esquecimento.',
    receber: 'Sinal, parcelas e serviços entregues ainda não pagos, com a previsão do mês.',
    cuidado: 'A resposta automática nunca dá preço fechado sem visita, a não ser que você tenha uma tabela aprovada.',
  },
};

export const ORDEM = ['advocacia', 'contabilidade', 'clinicas', 'imobiliarias', 'outros'];
