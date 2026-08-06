/**
 * ============================================================================
 * OMNIAGENT STUDIO — CENTRAL OMNICHANNEL DE INTELIGÊNCIA ARTIFICIAL
 * Módulo de Lógica e Máquina de Estados (State Machine)
 * 
 * Arquitetura limpa modular sem dependências externas, focada em performance,
 * acessibilidade e experiência imersiva de portfólio.
 * ============================================================================
 */

(() => {
  'use strict';

  // ==========================================
  // ESTADO GLOBAL DA APLICAÇÃO (State Machine)
  // ==========================================
  const State = {
    currentScenario: 'sales', // 'sales' | 'support' | 'triage'
    currentStep: 1,           // 1 a 5
    machineState: 'greeting', // idle | onboarding | greeting | collectingCompanyData | collectingBudget | qualifying | transferring | completed
    mode: 'commercial',       // 'commercial' | 'technical'
    activeDocId: 'services2026',
    contactData: {},
    timelineEvents: [],
    isTyping: false
  };

  // Referência rápida ao módulo de dados centralizado
  const Data = window.OmniDemoData;
  if (!Data) {
    console.error("ERRO FATAL: Módulo OmniDemoData não encontrado!");
    return;
  }

  // ==========================================
  // INICIALIZAÇÃO DA APLICAÇÃO
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    initPersistence();
    initUIElements();
    setupEventListeners();
    loadScenario(State.currentScenario, false);
  });

  /**
   * Gerencia persistência local segura (Etapa 25)
   */
  function initPersistence() {
    try {
      const savedMode = sessionStorage.getItem('omni_mode_preference');
      if (savedMode && (savedMode === 'commercial' || savedMode === 'technical')) {
        State.mode = savedMode;
        applyModeSwitch(savedMode);
      }

      const onboardingShown = sessionStorage.getItem('omni_onboarding_shown');
      const modal = document.getElementById('onboarding-modal');
      if (onboardingShown === 'true' && modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
      } else if (modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        // Foco de teclado no botão principal para acessibilidade
        const btnStart = document.getElementById('btn-start-demo');
        if (btnStart) setTimeout(() => btnStart.focus(), 100);
      }
    } catch (e) {
      console.warn("Aviso: sessionStorage indisponível no navegador atual.", e);
    }
  }

  /**
   * Inicializa listas, canais, métricas e perfis (Etapa 6, 10, 16)
   */
  function initUIElements() {
    renderChannels();
    renderDocuments();
    resetLeadData();
    renderMetrics();
  }

  // ==========================================
  // RENDERIZADORES DE INTERFACE E CANAIS
  // ==========================================

  /**
   * Renderiza os 4 canais corporativos sem rolagem (Etapa 6)
   */
  function renderChannels() {
    const container = document.getElementById('channel-list-container');
    if (!container) return;

    const iconsMap = {
      whatsapp: '💬',
      instagram: '📸',
      web: '🌐',
      email: '✉️'
    };

    container.innerHTML = Data.demoChannels.map(ch => `
      <div class="channel-item ${ch.id === 'whatsapp' ? 'active' : ''}" data-channel="${ch.id}">
        <div class="channel-icon ${ch.colorClass}">${iconsMap[ch.iconType] || '📱'}</div>
        <div class="channel-info">
          <strong>${ch.name}</strong>
          <span><span class="status-dot-sm"></span> ${ch.status}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Renderiza métricas da operação com formatação pt-BR (Etapa 16)
   */
  function renderMetrics() {
    const met = Data.demoMetrics;
    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setEl('met-chats', met.conversasHoje);
    setEl('met-resp', met.tempoResposta);
    setEl('met-rate', met.taxaResolucao);
    setEl('met-leads', met.leadsQualificados);
  }

  /**
   * Renderiza a base de manuais RAG do painel (Etapa 12)
   */
  function renderDocuments() {
    const container = document.getElementById('documents-list-container');
    if (!container) return;

    const docs = Object.values(Data.demoDocuments);
    container.innerHTML = docs.map(doc => `
      <div class="doc-item-card" data-doc-id="${doc.id}">
        <span class="doc-type-tag">${doc.type}</span>
        <div>
          <strong>${doc.title}</strong>
          <span>${doc.pages} páginas • Atualizado ${doc.updated} • <strong>${doc.snippetsFound} trechos</strong></span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Reinicia o perfil estruturado dos dados coletados (Etapa 10)
   */
  function resetLeadData() {
    State.contactData = JSON.parse(JSON.stringify(Data.initialContact));
    updateProfileUI();
  }

  /**
   * Atualiza a tabela de 14 campos na aba "Dados Coletados"
   */
  function updateProfileUI() {
    const container = document.getElementById('collected-profile-list');
    if (!container) return;

    const keysMap = [
      { key: "nome", label: "Nome do contato" },
      { key: "empresa", label: "Empresa / Corporação" },
      { key: "telefone", label: "Telefone / Celular" },
      { key: "email", label: "E-mail corporativo" },
      { key: "canal", label: "Canal de origem" },
      { key: "segmento", label: "Segmento de mercado" },
      { key: "necessidade", label: "Principal necessidade" },
      { key: "solucao", label: "Solução recomendada" },
      { key: "orcamento", label: "Faixa de orçamento" },
      { key: "prazo", label: "Prazo desejado" },
      { key: "usuarios", label: "Quantidade de usuários" },
      { key: "interesse", label: "Nível de engajamento" },
      { key: "score", label: "Lead Score ponderado" },
      { key: "statusComercial", label: "Status Comercial" }
    ];

    container.innerHTML = keysMap.map(item => {
      const val = State.contactData[item.key] || "Aguardando informação";
      const isPending = typeof val === 'string' && val.includes("Aguardando");
      const isHighlight = typeof val === 'number' || (typeof val === 'string' && (val.includes("Quente") || val.includes("R$")));
      return `
        <div class="profile-item">
          <span class="profile-key">${item.label}</span>
          <span class="profile-val ${isPending ? 'pending' : ''} ${isHighlight ? 'highlight' : ''}">
            ${item.key === 'score' ? val + ' / 100 🔥' : val}
          </span>
        </div>
      `;
    }).join('');

    // Atualiza barras e badges no painel de Análise
    const scoreBar = document.getElementById('ana-score-bar');
    const scoreText = document.getElementById('ana-score-text');
    const scoreVal = State.contactData.score || 35;
    if (scoreBar) scoreBar.style.width = `${scoreVal}%`;
    if (scoreText) scoreText.textContent = `🔥 Lead Quente — ${scoreVal}/100`;
  }

  // ==========================================
  // GESTÃO DE CENÁRIOS E AGENTES (State Machine)
  // ==========================================

  /**
   * Carrega um cenário e sincroniza os canais de atendimento (Etapa 4, 7, 23)
   */
  function loadScenario(scenarioId, isReset = false) {
    const scen = Data.demoScenarios[scenarioId] || Data.demoScenarios.sales;
    State.currentScenario = scenarioId;
    State.currentStep = 1;
    State.machineState = 'greeting';
    State.timelineEvents = [];

    // Atualiza aba ativa na barra lateral
    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-scenario') === scenarioId);
    });

    // Sincroniza identidade do Agente de IA (Etapa 7)
    const agent = Data.demoAgents[scen.agentId] || Data.demoAgents.sales;
    const avatarContainer = document.getElementById('agent-avatar-container');
    if (avatarContainer) avatarContainer.innerHTML = agent.avatarSvg;

    const fullNameEl = document.getElementById('agent-fullname');
    if (fullNameEl) fullNameEl.textContent = agent.fullName;

    const chTagEl = document.getElementById('agent-channel-tag');
    if (chTagEl) chTagEl.textContent = `Operando em ${agent.channel} (Modo Demo)`;

    const statusLabelEl = document.getElementById('current-agent-status-label');
    if (statusLabelEl) statusLabelEl.textContent = `Atendimento atual: ${agent.status}`;

    // Sincroniza canal ativo na lista de canais
    document.querySelectorAll('.channel-item').forEach(item => {
      const isMatch = item.textContent.includes(agent.channel.split(' ')[0]);
      item.classList.toggle('active', isMatch);
    });

    // Atualiza cabeçalho do cenário e etapas
    const titleEl = document.getElementById('current-scenario-title');
    if (titleEl) titleEl.textContent = `Cenário em execução: ${scen.name}`;

    updateStepIndicators(1);

    // Limpa chat e injeta saudação
    clearChatStream();
    resetLeadData();
    State.contactData.canal = agent.channel;
    
    appendMessage('user', scen.initialMessage, agent.channel);
    setTimeout(() => {
      appendMessage('ai', scen.agentGreeting, agent.name);
      renderQuickReplies(scen.quickReplies);
      addTimelineEvent(`Sessão iniciada no ${agent.channel}`, `Intenção preliminar de ${scen.name}`);
      updateJsonPayload({ event: "conversation.started", scenario: scen.name, agent: agent.name, channel: agent.channel, status: "200 OK" });
    }, 400);

    if (isReset) {
      showToast("Demonstração reiniciada com sucesso!");
    }
  }

  /**
   * Atualiza indicadores de progresso da demonstração (Etapa 5)
   */
  function updateStepIndicators(stepNum) {
    State.currentStep = stepNum;
    const stepTextEl = document.getElementById('current-step-text');
    if (stepTextEl) stepTextEl.textContent = `Etapa ${stepNum} de 5`;

    document.querySelectorAll('.step-item').forEach(el => {
      const elStep = parseInt(el.getAttribute('data-step'), 10);
      el.classList.toggle('active', elStep === stepNum);
      el.classList.toggle('completed', elStep < stepNum);
    });
  }

  // ==========================================
  // MOTOR CONVERSACIONAL (CHAT DINÂMICO)
  // ==========================================

  function clearChatStream() {
    const stream = document.getElementById('chat-stream');
    if (stream) stream.innerHTML = '';
  }

  function getCurrentTimeStr() {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Adiciona mensagem à tela de chat e executa rolagem automática (Etapa 3)
   */
  function appendMessage(sender, textHtml, originLabel) {
    const stream = document.getElementById('chat-stream');
    if (!stream) return;

    const row = document.createElement('div');
    row.className = `chat-row ${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = `bubble ${sender}-bubble`;
    
    const meta = document.createElement('div');
    meta.className = 'bubble-meta';
    meta.innerHTML = `<span>${sender === 'user' ? 'Visitante' : originLabel}</span><span class="time">${getCurrentTimeStr()}</span>`;
    
    const content = document.createElement('div');
    content.innerHTML = textHtml;

    bubble.appendChild(meta);
    bubble.appendChild(content);
    row.appendChild(bubble);
    stream.appendChild(row);

    scrollToBottom();
  }

  function scrollToBottom() {
    const viewport = document.getElementById('chat-viewport');
    if (viewport) {
      setTimeout(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
  }

  function showTypingIndicator(agentName) {
    State.isTyping = true;
    const badge = document.getElementById('ai-typing-badge');
    const txt = document.getElementById('typing-agent-name');
    if (txt) txt.textContent = `${agentName || 'IA'} analisando dados e formulando resposta...`;
    if (badge) {
      badge.classList.remove('hidden');
      badge.setAttribute('aria-hidden', 'false');
    }
    scrollToBottom();
  }

  function hideTypingIndicator() {
    State.isTyping = false;
    const badge = document.getElementById('ai-typing-badge');
    if (badge) {
      badge.classList.add('hidden');
      badge.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Renderiza os botões de resposta rápida (Etapa 3)
   */
  function renderQuickReplies(replies) {
    const container = document.getElementById('quick-replies-container');
    if (!container) return;

    if (!replies || replies.length === 0) {
      container.innerHTML = `<span style="font-size:0.82rem;color:var(--text-dim);font-style:italic;">Nenhuma resposta rápida pendente nesta etapa.</span>`;
      return;
    }

    container.innerHTML = replies.map((rep, idx) => `
      <button class="quick-chip" data-idx="${idx}">${rep.label}</button>
    `).join('');

    container.querySelectorAll('.quick-chip').forEach((chip, idx) => {
      chip.addEventListener('click', () => {
        handleQuickReplyClick(replies[idx]);
      });
    });
  }

  /**
   * Processa clique em resposta rápida com transição na State Machine
   */
  function handleQuickReplyClick(replyObj) {
    if (State.isTyping) return;

    // Limpa respostas rápidas da tela
    renderQuickReplies([]);
    appendMessage('user', replyObj.label, State.contactData.canal);

    const scen = Data.demoScenarios[State.currentScenario];
    const agent = Data.demoAgents[scen.agentId];
    const nextStateKey = replyObj.nextStep;
    const stepDef = scen.stepsScript && scen.stepsScript[nextStateKey];

    showTypingIndicator(agent.name);

    setTimeout(() => {
      hideTypingIndicator();

      if (!stepDef) {
        // Transição genérica ou final de fluxo
        appendMessage('ai', "Obrigado pelas informações! Todas as suas preferências foram registradas no nosso sistema corporativo e sincronizadas no painel de inteligência à direita.", agent.name);
        return;
      }

      // Atualiza máquina de estados
      State.machineState = nextStateKey;
      updateStepIndicators(stepDef.stepNum);

      // Enriquecimento progressivo de dados do Lead (Etapa 10)
      if (replyObj.data) {
        Object.assign(State.contactData, replyObj.data);
        if (State.contactData.score < 80 && stepDef.stepNum >= 3) State.contactData.score = 88;
        updateProfileUI();
      } else if (replyObj.val) {
        State.contactData.necessidade = replyObj.val;
        updateProfileUI();
      }

      // Formata resposta da IA com variáveis
      let responseHtml = stepDef.aiResponse;
      responseHtml = responseHtml.replace(/\{option\}/g, replyObj.label);
      responseHtml = responseHtml.replace(/\{nome\}/g, State.contactData.nome || "Cliente");
      responseHtml = responseHtml.replace(/\{empresa\}/g, State.contactData.empresa || "sua corporação");
      responseHtml = responseHtml.replace(/\{usuarios\}/g, State.contactData.usuarios || "sua equipe");
      responseHtml = responseHtml.replace(/\{prazo\}/g, State.contactData.prazo || "no prazo ideal");
      responseHtml = responseHtml.replace(/\{orcamento\}/g, State.contactData.orcamento || "com honorários otimizados");
      if (replyObj.dateStr) {
        responseHtml = responseHtml.replace(/\{dateStr\}/g, replyObj.dateStr);
        State.contactData.statusComercial = `Reunião agendada (${replyObj.dateStr})`;
        updateProfileUI();
      }

      appendMessage('ai', responseHtml, agent.name);
      renderQuickReplies(stepDef.quickReplies);

      // Atualiza documentação RAG consultada (Etapa 12)
      if (stepDef.sourceDoc && Data.demoDocuments[stepDef.sourceDoc]) {
        setActiveRagDoc(Data.demoDocuments[stepDef.sourceDoc]);
      }

      // Registro na linha do tempo e payload JSON (Etapa 11 e 13)
      addTimelineEvent(`Etapa ${stepDef.stepNum}: ${stepDef.stepTitle}`, `Dados validados pelo motor de IA corporativo`);
      if (stepDef.eventJson) updateJsonPayload(stepDef.eventJson);

      // Efeitos especiais em etapas de CRM e Agendamento (Etapa 14)
      if (nextStateKey === 'transferring' || nextStateKey === 'injectCrm') {
        showFinalCTACard();
        addTimelineEvent(`✓ Card criado com sucesso`, `Pipeline Comercial B2B • Coluna: Lead Qualificado`);
        showToast("✓ Oportunidade sincronizada com o Lead Flow Studio!");
      }
    }, 700);
  }

  /**
   * Apresenta o CTA Final completo de oportunidade (Etapa 18)
   */
  function showFinalCTACard() {
    const stream = document.getElementById('chat-stream');
    if (!stream) return;

    const row = document.createElement('div');
    row.className = 'chat-row ai';
    row.innerHTML = `
      <div class="final-cta-box animate-fade-up">
        <h3>🌟 Oportunidade Qualificada com Sucesso!</h3>
        <p>A inteligência artificial realizou a triagem em 0,8 segundo, documentou todas as necessidades empresariais e enviou o card em tempo real para o quadro Kanban do CRM.</p>
        <div class="cta-buttons-row">
          <button class="btn-cta-primary" id="btn-cta-view-crm">Ver oportunidade no CRM ↗</button>
          <button class="btn-ghost" id="btn-cta-restart">Reiniciar demonstração</button>
          <a href="/contato/" class="btn-primary-header">Solicitar uma solução semelhante ↗</a>
        </div>
      </div>
    `;
    stream.appendChild(row);
    scrollToBottom();

    // Bind de eventos dos botões no CTA Final
    const btnView = document.getElementById('btn-cta-view-crm');
    if (btnView) btnView.addEventListener('click', () => openCrmModal());

    const btnRestart = document.getElementById('btn-cta-restart');
    if (btnRestart) btnRestart.addEventListener('click', () => loadScenario(State.currentScenario, true));
  }

  /**
   * Aciona a simulação de transição e resumo de Handoff Humano (Etapa 8)
   */
  function triggerHumanHandoff() {
    if (State.isTyping) return;

    const stream = document.getElementById('chat-stream');
    if (!stream) return;

    showTypingIndicator("Motor de Resumo IA");
    
    setTimeout(() => {
      hideTypingIndicator();

      const row = document.createElement('div');
      row.className = 'chat-row system-summary';
      row.innerHTML = `
        <div class="handoff-summary-box">
          <div class="handoff-top">
            <strong>🔄 Transferência de Atendimento Solicitada</strong>
            <span class="lfs-tag">SLA Plantão Técnico</span>
          </div>
          <p class="onboarding-sub" style="font-size:0.88rem;color:#cbd5e1;">A IA encerrou o atendimento autônomo e gerou o seguinte resumo executivo para o consultor humano:</p>
          <div class="handoff-body">
            <p>"Cliente procura arquitetura SaaS e CRM customizado para substituir operações em planilhas na empresa ${State.contactData.empresa !== 'Aguardando informação' ? State.contactData.empresa : 'da sua marca'}. Orçamento informado em torno de ${State.contactData.orcamento !== 'Aguardando informação' ? State.contactData.orcamento : 'R$ 15.000+'}, com equipe de ${State.contactData.usuarios !== 'Aguardando informação' ? State.contactData.usuarios : 'múltiplos colaboradores'}. Reunião técnica altamente recomendada."</p>
          </div>
          <div class="handoff-details">
            <div><span>Atendente Sugerido:</span> <strong>André Rodrigues (Engenheiro Sênior)</strong></div>
            <div><span>Prioridade:</span> <strong style="color:#fbbf24;">Quente (Hot Deal) 🔥</strong></div>
            <div><span>Motivo:</span> <strong>Negociação de contrato Enterprise</strong></div>
            <div><span>Ação Recomendada:</span> <strong>Apresentação de arquitetura técnica</strong></div>
          </div>
        </div>
      `;
      stream.appendChild(row);
      scrollToBottom();

      addTimelineEvent("Resumo preparado para consultor", "Transferência solicitada no ambiente demonstrativo");
      showToast("✓ Resumo executivo enviado ao consultor!");
    }, 600);
  }

  // ==========================================
  // ATUALIZAÇÃO DO PAINEL INSPECTOR (RAG / JSON)
  // ==========================================

  function setActiveRagDoc(docObj) {
    const bannerTitle = document.getElementById('active-doc-title');
    if (bannerTitle) bannerTitle.textContent = docObj.title;

    // Highlights the current document in the list
    document.querySelectorAll('.doc-item-card').forEach(el => {
      const isCurr = el.getAttribute('data-doc-id') === docObj.id;
      el.style.borderColor = isCurr ? '#3b82f6' : 'var(--border-color)';
      el.style.background = isCurr ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)';
    });
  }

  function addTimelineEvent(title, subtitle) {
    const feed = document.getElementById('timeline-feed');
    if (!feed) return;

    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <span class="check-icon">✓</span>
      <div>
        <strong>${title}</strong>
        <span>${subtitle} • <small style="font-family:var(--font-mono);color:var(--text-dim);">${getCurrentTimeStr()}</small></span>
      </div>
    `;
    feed.insertBefore(item, feed.firstChild);
  }

  function updateJsonPayload(dataObj) {
    const block = document.getElementById('tech-json-payload');
    if (block) {
      const formatted = JSON.stringify(dataObj, null, 2);
      block.innerHTML = `<code>${formatted}</code>`;
    }
  }

  function applyModeSwitch(newMode) {
    State.mode = newMode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
      const isCurrent = btn.getAttribute('data-mode') === newMode;
      btn.classList.toggle('active', isCurrent);
      btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
    });

    const isComm = newMode === 'commercial';
    const subtitle = document.getElementById('mode-subtitle');
    if (subtitle) subtitle.textContent = isComm ? "Visualização executiva para negócios" : "Métricas técnicas, Webhooks e vetores RAG";

    // Mostra/oculta botões de aba correspondentes
    const commBtnIds = ['tab-btn-analysis', 'tab-btn-data', 'tab-btn-sources', 'tab-btn-timeline'];
    const techBtnIds = ['tab-btn-telemetry', 'tab-btn-payload', 'tab-btn-ragtech'];

    commBtnIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', !isComm);
    });
    techBtnIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', isComm);
    });

    // Seleciona primeira aba apropriada ao modo
    const targetId = isComm ? 'tab-btn-analysis' : 'tab-btn-payload';
    const btnToClick = document.getElementById(targetId);
    if (btnToClick) btnToClick.click();
  }

  // ==========================================
  // MODAIS E LISTENERS GERAIS
  // ==========================================

  function setupEventListeners() {
    // 1. Onboarding Modal
    const btnStart = document.getElementById('btn-start-demo');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        const modal = document.getElementById('onboarding-modal');
        if (modal) {
          modal.classList.add('hidden');
          modal.setAttribute('aria-hidden', 'true');
        }
        try { sessionStorage.setItem('omni_onboarding_shown', 'true'); } catch (e) {}
        showToast("✨ Demonstração interativa iniciada!");
      });
    }

    // 2. Seletor de Cenários
    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const scen = btn.getAttribute('data-scenario');
        loadScenario(scen, true);
      });
    });

    // 3. Botões de Controle no Console
    const btnReset = document.getElementById('btn-reset-demo');
    if (btnReset) btnReset.addEventListener('click', () => loadScenario(State.currentScenario, true));

    const btnHandoff = document.getElementById('btn-handoff');
    if (btnHandoff) btnHandoff.addEventListener('click', triggerHumanHandoff);

    // 4. Modo Comercial / Modo Técnico
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = btn.getAttribute('data-mode');
        applyModeSwitch(m);
        try { sessionStorage.setItem('omni_mode_preference', m); } catch (e) {}
      });
    });

    // 5. Abas do Inspector
    document.querySelectorAll('.ins-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ins-tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const targetPaneId = 'pane-' + btn.getAttribute('data-tab');
        const targetPane = document.getElementById(targetPaneId);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // 6. Envio de Chat Personalizado
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
      chatForm.addEventListener('submit', e => {
        e.preventDefault();
        const input = document.getElementById('custom-user-input');
        if (!input || !input.value.trim()) return;

        const text = input.value.trim();
        input.value = '';
        appendMessage('user', text, State.contactData.canal);

        const scen = Data.demoScenarios[State.currentScenario];
        const agent = Data.demoAgents[scen.agentId];

        showTypingIndicator(agent.name);
        setTimeout(() => {
          hideTypingIndicator();
          // Resposta determinística educada para inputs avulsos
          appendMessage('ai', `Compreendo perfeitamente sua dúvida sobre <strong>"${text}"</strong>. Nosso ecossistema processa solicitações customizadas como esta conectando APIs ao seu banco de dados na AWS ou Supabase de forma nativa e segura.<br><br>💡 <em>Para ver a automação de funil em tempo real, recomendamos clicar em uma das respostas rápidas abaixo ou assumir o atendimento com o consultor!</em>`, agent.name);
          addTimelineEvent("Consulta customizada analisada", "Processado via NLP demonstrativo");
        }, 650);
      });
    }

    // 7. Modal de Integração Lead Flow Studio
    const btnOpenCrm = document.getElementById('btn-open-crm-modal');
    if (btnOpenCrm) btnOpenCrm.addEventListener('click', openCrmModal);

    const btnCloseCrm = document.getElementById('btn-close-crm');
    const btnCloseCrm2 = document.getElementById('btn-close-crm-2');
    [btnCloseCrm, btnCloseCrm2].forEach(btn => {
      if (btn) btn.addEventListener('click', closeCrmModal);
    });

    // 8. Botão Copiar JSON
    const btnCopyJson = document.getElementById('btn-copy-json');
    if (btnCopyJson) {
      btnCopyJson.addEventListener('click', () => {
        const block = document.getElementById('tech-json-payload');
        if (block) {
          navigator.clipboard.writeText(block.innerText).then(() => {
            showToast("📋 JSON copiado para a área de transferência!");
          }).catch(() => {
            showToast("📋 JSON pronto para inspeção técnica!");
          });
        }
      });
    }
  }

  function openCrmModal() {
    const modal = document.getElementById('crm-modal');
    if (modal) {
      // Atualiza preview no card com dados da conversa atual
      const compEl = document.getElementById('lfs-company');
      const contEl = document.getElementById('lfs-contact');
      const budgEl = document.getElementById('lfs-budget');
      if (compEl) compEl.textContent = State.contactData.empresa !== 'Aguardando informação' ? State.contactData.empresa : 'TechSolutions B2B';
      if (contEl) contEl.textContent = `${State.contactData.nome !== 'Aguardando informação' ? State.contactData.nome : 'Carlos Mendes'} • ${State.contactData.usuarios !== 'Aguardando informação' ? State.contactData.usuarios : '15 usuários'}`;
      if (budgEl) budgEl.textContent = State.contactData.orcamento !== 'Aguardando informação' ? State.contactData.orcamento : 'R$ 15.000 a R$ 25.000';

      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      const closeBtn = document.getElementById('btn-close-crm');
      if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
    }
  }

  function closeCrmModal() {
    const modal = document.getElementById('crm-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const box = document.createElement('div');
    box.className = 'toast-box';
    box.innerHTML = `<span>${msg}</span>`;
    container.appendChild(box);

    setTimeout(() => {
      box.style.opacity = '0';
      box.style.transform = 'translateY(10px)';
      box.style.transition = 'all 0.3s ease';
      setTimeout(() => box.remove(), 300);
    }, 3500);
  }

})();
