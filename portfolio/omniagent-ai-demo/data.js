/**
 * ============================================================================
 * OMNIAGENT STUDIO — CENTRAL OMNICHANNEL DE INTELIGÊNCIA ARTIFICIAL
 * Módulo de Dados Demonstrativos Centralizados
 * 
 * NOTA: Todos os contatos, dados de empresas, faturamentos e eventos são
 * puramente fictícios e simulados para demonstração no portfólio AndréStudio.dev.
 * ============================================================================
 */

window.OmniDemoData = {
  // ----------------------------------------------------
  // MÉTRICAS OPERACIONAL (pt-BR)
  // ----------------------------------------------------
  demoMetrics: {
    conversasHoje: 286,
    tempoResposta: "0,8 s",
    taxaResolucao: "78%",
    leadsQualificados: 42
  },

  // ----------------------------------------------------
  // CANAIS DE ATENDIMENTO
  // ----------------------------------------------------
  demoChannels: [
    {
      id: "whatsapp",
      name: "WhatsApp Business API",
      account: "Linha Comercial (+55 11 98877-6655)",
      status: "Conectado em modo demonstração",
      active: true,
      iconType: "whatsapp",
      colorClass: "green"
    },
    {
      id: "instagram",
      name: "Instagram Direct",
      account: "@andrestudio.dev",
      status: "Conectado em modo demonstração",
      active: true,
      iconType: "instagram",
      colorClass: "purple"
    },
    {
      id: "webchat",
      name: "Web Chat Widget",
      account: "Portal Corporativo • andrestudio.dev.br",
      status: "Ativo no ambiente demonstrativo",
      active: true,
      iconType: "web",
      colorClass: "blue"
    },
    {
      id: "email",
      name: "E-mail Corporativo",
      account: "andreaparecidor08@gmail.com",
      status: "Conectado em modo demonstração",
      active: true,
      iconType: "email",
      colorClass: "slate"
    }
  ],

  // ----------------------------------------------------
  // IDENTIDADE DOS AGENTES DE IA (Sem fotos humanas)
  // ----------------------------------------------------
  demoAgents: {
    sales: {
      id: "luna",
      name: "Luna AI",
      role: "Agente Comercial",
      fullName: "Luna AI — Agente Comercial da AndréStudio.dev",
      status: "Luna AI atendendo",
      channel: "WhatsApp Business API",
      avatarSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><circle cx="12" cy="12" r="4" fill="#3b82f6" stroke="none"/></svg>`
    },
    support: {
      id: "atlas",
      name: "Atlas AI",
      role: "Suporte Técnico",
      fullName: "Atlas AI — Suporte Técnico e Contratos N1/N2",
      status: "Atlas AI atendendo",
      channel: "Web Chat Widget",
      avatarSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/><circle cx="12" cy="12" r="2" fill="#10b981" stroke="none"/></svg>`
    },
    triage: {
      id: "nina",
      name: "Nina AI",
      role: "Agendamentos & CRM",
      fullName: "Nina AI — Especialista em Agendamentos e Pipeline",
      status: "Nina AI atendendo",
      channel: "Instagram Direct",
      avatarSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="2" fill="#8b5cf6" stroke="none"/></svg>`
    }
  },

  // ----------------------------------------------------
  // BASE DOCUMENTAL (RAG CORPORATIVO)
  // ----------------------------------------------------
  demoDocuments: {
    services2026: {
      id: "services2026",
      title: "Tabela de Serviços e Prazos 2026.pdf",
      type: "PDF",
      pages: 14,
      updated: "Há 2 dias",
      status: "Indexado (100%)",
      snippetsFound: 12,
      isCurrentSource: true,
      description: "Contém honorários, arquitetura de sistemas de IA, prazos de entrega e escopo comercial de produtos SaaS."
    },
    apiManual: {
      id: "apiManual",
      title: "Manual de Integração API e Webhooks.md",
      type: "Markdown",
      pages: 8,
      updated: "Há 5 dias",
      status: "Indexado (100%)",
      snippetsFound: 7,
      isCurrentSource: false,
      description: "Especificações de endpoints POST, sincronização bidirecional com Lead Flow Studio e autenticação de webhooks."
    },
    slaPolicy: {
      id: "slaPolicy",
      title: "Políticas de SLA e Resolução N1.docx",
      type: "DOCX",
      pages: 22,
      updated: "Ontem",
      status: "Indexado (100%)",
      snippetsFound: 19,
      isCurrentSource: false,
      description: "Normas de conformidade para atendimento 24/7, redefinição segura de credenciais e acionamento de consultores humanos."
    }
  },

  // ----------------------------------------------------
  // CONTATO SIMULADO INICIAL
  // ----------------------------------------------------
  initialContact: {
    nome: "Aguardando informação",
    empresa: "Aguardando informação",
    telefone: "+55 (11) 98844-3210 (Simulado)",
    email: "Aguardando informação",
    canal: "WhatsApp Business API",
    segmento: "Aguardando informação",
    necessidade: "Aguardando informação",
    solucao: "Aguardando avaliação...",
    orcamento: "Aguardando informação",
    prazo: "Aguardando informação",
    usuarios: "Aguardando informação",
    interesse: "Em engajamento",
    score: 35,
    statusComercial: "Triagem Inicial"
  },

  // ----------------------------------------------------
  // CENÁRIOS E FLUXOS CONVERSACIONAIS (STATE MACHINE)
  // ----------------------------------------------------
  demoScenarios: {
    sales: {
      id: "sales",
      name: "Qualificação Comercial B2B",
      agentId: "sales",
      defaultDoc: "services2026",
      description: "Veja a IA recepcionar um lead do WhatsApp, qualificar porte/orçamento, agendar reunião e sincronizar com o Lead Flow Studio.",
      initialMessage: "Olá, gostaria de saber quanto custa desenvolver um sistema para minha empresa.",
      agentGreeting: "Olá! Seja bem-vindo à Central da AndréStudio.dev. Eu sou a <strong>Luna AI</strong> e posso ajudar com isso! Para te apresentar a melhor proposta e arquitetura, qual é o principal objetivo do sistema que você precisa?",
      quickReplies: [
        { label: "Gerenciar clientes", nextStep: "collectingCompanyData", val: "Gerenciar clientes e funil de vendas" },
        { label: "Automatizar atendimento com IA", nextStep: "collectingCompanyData", val: "Automatizar atendimento omnichannel 24h" },
        { label: "Controlar vendas e contratos", nextStep: "collectingCompanyData", val: "Controlar vendas e emitir cobranças" },
        { label: "Outro sistema personalizado", nextStep: "collectingCompanyData", val: "Plataforma SaaS sob medida" }
      ],
      stepsScript: {
        collectingCompanyData: {
          stepNum: 2,
          stepTitle: "Necessidade",
          userTextPrompt: "O objetivo é: {option}. Atuamos no ramo de tecnologia e serviços.",
          aiResponse: "Perfeito! Soluções para <strong>{option}</strong> costumam gerar um ganho imediato de eficiência operacional de até 75%.<br><br>Para eu personalizar nossa demonstração e identificar o porte adequado dos servidores, <strong>como é o seu nome, o nome da sua empresa e quantos colaboradores/usuários utilizarão a plataforma?</strong>",
          quickReplies: [
            { label: "Carlos Mendes | TechSolutions | 15 usuários", nextStep: "collectingBudget", data: { nome: "Carlos Mendes", empresa: "TechSolutions B2B", segmento: "Tecnologia & Serviços", usuarios: "15 colaboradores" } },
            { label: "Fernanda Lima | NovaVarejo | 50 usuários", nextStep: "collectingBudget", data: { nome: "Fernanda Lima", empresa: "NovaVarejo Corp", segmento: "Varejo & Distribuição", usuarios: "50 usuários simultâneos" } },
            { label: "Lucas Souza | GrupoApex | 5 usuários", nextStep: "collectingBudget", data: { nome: "Lucas Souza", empresa: "Grupo Apex", segmento: "Consultoria Empresarial", usuarios: "5 especialistas" } }
          ],
          sourceDoc: "services2026",
          eventJson: { event: "lead.need_identified", intent: "request_system_architecture", confidence: 0.99 }
        },
        collectingBudget: {
          stepNum: 3,
          stepTitle: "Orçamento",
          userTextPrompt: "Meu nome é {nome}, da {empresa}. Serão aproximadamente {usuarios} utilizando o sistema.",
          aiResponse: "Prazer, <strong>{nome}</strong>! A <strong>{empresa}</strong> tem o perfil exato para nossa linha de desenvolvimento Enterprise.<br><br>Consultando a <em>Tabela de Serviços e Prazos 2026</em>, sistemas desse escopo possuem entrega ágil por blocos. Para alinharmos com o time de engenheiros, <strong>qual é o prazo desejado para colocarmos a primeira versão no ar e a faixa de orçamento estimada para este projeto?</strong>",
          quickReplies: [
            { label: "Até 60 dias | Orçamento de R$ 15 mil a R$ 25 mil", nextStep: "qualifying", data: { prazo: "Até 60 dias", orcamento: "R$ 15.000 a R$ 25.000", solucao: "SaaS Customizado + Automação IA", email: "carlos@techsolutions.dev.br" } },
            { label: "Urgente (30 dias) | Orçamento acima de R$ 30 mil", nextStep: "qualifying", data: { prazo: "30 dias (Fast-Track)", orcamento: "Acima de R$ 30.000", solucao: "Ecossistema Omnichannel Completo", email: "diretoria@empresa.com.br" } },
            { label: "90 dias | Orçamento até R$ 10 mil (MVP)", nextStep: "qualifying", data: { prazo: "Até 90 dias", orcamento: "R$ 8.000 a R$ 12.000 (MVP)", solucao: "MVP Demonstrativo + Funil", email: "contato@empresa.com.br" } }
          ],
          sourceDoc: "services2026",
          eventJson: { event: "lead.profile_enriched", status: "collecting_budget", score: 65 }
        },
        qualifying: {
          stepNum: 4,
          stepTitle: "Agenda",
          userTextPrompt: "Nosso prazo ideal é {prazo}, com orçamento previsto entre {orcamento}.",
          aiResponse: "⚡ <strong>Análise da Inteligência Artificial concluída com sucesso!</strong><br><br>O seu perfil foi classificado como <strong>Lead Quente (Score: 88/100 🔥)</strong> e já separei nossa melhor arquitetura de software para a {empresa}.<br><br>Como próximo passo ideal, gostaria de agendar uma breve reunião de alinhamento técnico com nosso Arquiteto de Software sênior. <strong>Qual destas opções de horário na nossa agenda você prefere?</strong>",
          quickReplies: [
            { label: "📅 Quinta-feira, 07/08 às 10h00", nextStep: "transferring", dateStr: "Quinta-feira, 07/08 às 10h00" },
            { label: "📅 Quinta-feira, 07/08 às 15h00", nextStep: "transferring", dateStr: "Quinta-feira, 07/08 às 15h00" },
            { label: "📅 Sexta-feira, 08/08 às 14h00", nextStep: "transferring", dateStr: "Sexta-feira, 08/08 às 14h00" }
          ],
          sourceDoc: "apiManual",
          eventJson: { event: "lead.qualified", lead_score: 88, sentiment: "highly_interested", recommended_action: "schedule_technical_meeting" }
        },
        transferring: {
          stepNum: 5,
          stepTitle: "CRM",
          userTextPrompt: "Podemos confirmar para {dateStr}, por favor.",
          aiResponse: "✓ <strong>Reunião técnica confirmada para {dateStr}</strong> no modo demonstrativo!<br><br>Para garantir uma transição suave, criei o resumo executivo desta conversa e acabei de sincronizar os dados com o CRM <strong>Lead Flow Studio</strong> (coluna <em>Lead Qualificado</em>). O consultor humano responsável já foi notificado e pode assumir este canal a qualquer instante.<br><br>💡 <em>Explore as abas à direita para ver o Lead Score, o payload JSON e o card criado no CRM!</em>",
          quickReplies: [],
          sourceDoc: "apiManual",
          eventJson: { event: "crm.card.created", crm_pipeline: "Comercial B2B", column: "Lead Qualificado", sync_status: "200 OK_COMPENSATED" }
        }
      }
    },

    support: {
      id: "support",
      name: "Suporte Técnico e Contratos",
      agentId: "support",
      defaultDoc: "slaPolicy",
      description: "Veja como a IA resolve chamados de nível N1/N2 consultando manuais e contratos reais da empresa em milissegundos.",
      initialMessage: "Olá, estou tentando acessar o portal da minha empresa mas preciso redefinir minha senha de administrador com segurança e baixar nossa 2ª via de contrato.",
      agentGreeting: "Olá! Aqui é o <strong>Atlas AI</strong>, assistente de Suporte Corporativo da AndréStudio.dev. Consigo resolver sua solicitação agora mesmo. Para iniciarmos o procedimento seguro de Resolução N1, qual das opções de suporte você quer priorizar?",
      quickReplies: [
        { label: "Redefinir senha de administrador", nextStep: "resolveSupport", val: "Redefinição segura de credenciais N1" },
        { label: "Baixar 2ª via do contrato SLA 2026", nextStep: "resolveSupport", val: "Envio de contrato SLA de Suporte" },
        { label: "Consultar métricas de disponibilidade", nextStep: "resolveSupport", val: "Relatório de Uptime 99.9%" }
      ],
      stepsScript: {
        resolveSupport: {
          stepNum: 4,
          stepTitle: "Resolução N1",
          userTextPrompt: "Preciso de auxílio com: {option}.",
          aiResponse: "Compreendido! Consultando o documento <em>Políticas de SLA e Resolução N1.docx</em>, localizei o procedimento corporativo para <strong>{option}</strong>.<br><br>1. O token de redefinição encriptado foi gerado para seu e-mail corporativo cadastrado.<br>2. O PDF da 2ª via autenticada do seu contrato já foi liberado no servidor seguro.<br><br>✔ <strong>Chamado encerrado automaticamente (SLA &lt; 1 segundo) sem necessidade de fila humana!</strong>",
          quickReplies: [
            { label: "Excelente, problema resolvido!", nextStep: "completedSupport", val: "Confirmado, obrigado." },
            { label: "Quero falar com o plantão humano (N2)", nextStep: "completedSupport", val: "Acionar plantão de engenharia" }
          ],
          sourceDoc: "slaPolicy",
          eventJson: { event: "support.ticket_resolved_n1", sla: "instant", kb_article_matched: "SLA_SECTION_4_CREDENTIALS", status: "closed_success" }
        },
        completedSupport: {
          stepNum: 5,
          stepTitle: "Concluído",
          userTextPrompt: "{val}",
          aiResponse: "Perfeito! Foi um prazer atender. Registramos esta interação no histórico de compliance do seu painel e atualizamos o log operacional.<br><br>💡 <em>Sua empresa pode automatizar 80% dos chamados de clientes da mesma forma com nosso motor RAG!</em>",
          quickReplies: [],
          sourceDoc: "slaPolicy",
          eventJson: { event: "support.session_concluded", resolution_by: "AI_AUTONOMOUS" }
        }
      }
    },

    triage: {
      id: "triage",
      name: "Integração com Lead Flow Studio",
      agentId: "triage",
      defaultDoc: "apiManual",
      description: "Acompanhe nos bastidores de que forma um lead recebido no Instagram ou site é triado e injetado diretamente no CRM em tempo real.",
      initialMessage: "Olá! Somos uma incorporadora imobiliária e queremos integrar nossos corretores com inteligência artificial.",
      agentGreeting: "Olá! Aqui é a <strong>Nina AI</strong>, responsável pelo fluxo de integração entre canais e o CRM <strong>Lead Flow Studio</strong>. Para configurar a injeção do seu lead demonstrativo em nossa pipeline, qual é o ticket médio dos imóveis ou projetos da sua empresa?",
      quickReplies: [
        { label: "Imóveis de Alto Padrão (> R$ 2 Milhões)", nextStep: "injectCrm", val: "Ticket Alto Padrão (> R$ 2M)" },
        { label: "Empreendimentos & Loteamentos (R$ 500 mil)", nextStep: "injectCrm", val: "Loteamentos e Empreendimentos" },
        { label: "Gestão de Franquias & Varejo", nextStep: "injectCrm", val: "Rede de Franquias" }
      ],
      stepsScript: {
        injectCrm: {
          stepNum: 4,
          stepTitle: "Sincronizando",
          userTextPrompt: "Trabalhamos com: {option}. Queremos testar a chegada deste lead ao CRM.",
          aiResponse: "Iniciando protocolo de sincronização via Webhook <code>POST /api/v1/leadflow/inject</code>...<br><br>⚡ <strong>Payload gerado com sucesso!</strong><br>• <strong>Origem:</strong> Instagram Direct<br>• <strong>Lead:</strong> Diretoria Comercial Imobiliária<br>• <strong>Estágio:</strong> Oportunidade VIP (Score: 94/100)<br>• <strong>Destino:</strong> Quadro Kanban • Coluna <em>Proposta Enviada</em>.<br><br>O card acaba de surgir de forma automática no painel do Lead Flow Studio!",
          quickReplies: [
            { label: "🌟 Ver card no Lead Flow Studio", nextStep: "finishTriage", val: "Abrir visualização no CRM" }
          ],
          sourceDoc: "apiManual",
          eventJson: { event: "crm.webhook_dispatched", target: "Lead Flow Studio Kanban", http_response_code: 201, card_id: "LFS_8911" }
        },
        finishTriage: {
          stepNum: 5,
          stepTitle: "Concluído",
          userTextPrompt: "{val}",
          aiResponse: "O card já está disponível para sua equipe de corretores e gerentes comerciais agirem com máxima velocidade. Esta integração elimina o erro de cadastros manuais em planilhas!",
          quickReplies: [],
          sourceDoc: "apiManual",
          eventJson: { event: "crm.sync_complete", status: "fully_integrated" }
        }
      }
    }
  }
};
