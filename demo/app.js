(() => {
  'use strict';

  // ==========================================
  // INITIAL MOCK DATA — REALISTIC LEADS
  // ==========================================
  let leads = [
    { id: 101, name: 'Carolina Silva', company: 'Tech Solutions', value: 15000, stage: 'novos', tag1: 'ADS', tag2: 'HOT', time: 'Há 10 min' },
    { id: 102, name: 'Pedro Alves', company: 'Innovate Corp', value: 28500, stage: 'novos', tag1: 'REFERRAL', tag2: 'URGENTE', time: 'Há 45 min' },
    { id: 103, name: 'Lucas Ferreira', company: 'Nexus Digital', value: 9800, stage: 'novos', tag1: 'SAAS', tag2: 'COLD', time: 'Há 2 h' },
    
    { id: 104, name: 'Juliana Mendes', company: 'Apex Consulting', value: 42000, stage: 'contato', tag1: 'REFERRAL', tag2: 'HOT', time: 'Ontem' },
    { id: 105, name: 'Roberto Campos', company: 'Fintech Lab', value: 18400, stage: 'contato', tag1: 'ORGANIC', tag2: 'SAAS', time: '2 dias atrás' },

    { id: 106, name: 'Mariana Costa', company: 'DevCorp Software', value: 34000, stage: 'proposta', tag1: 'ORGANIC', tag2: 'SAAS', time: 'Há 3 dias' },
    { id: 107, name: 'Fernanda Lima', company: 'Grupo Ícone', value: 55000, stage: 'proposta', tag1: 'ADS', tag2: 'HOT', time: 'Há 5 dias' },

    { id: 108, name: 'Carlos Eduardo', company: 'Logística Total', value: 68000, stage: 'fechado', tag1: 'REFERRAL', tag2: 'SAAS', time: 'Convertido em 02/08' },
    { id: 109, name: 'Beatriz Ramos', company: 'Studio Criativo', value: 21500, stage: 'fechado', tag1: 'ORGANIC', tag2: 'HOT', time: 'Convertido em 28/07' }
  ];

  let currentFilter = 'all';
  let searchQuery = '';
  let draggedCardId = null;

  // ==========================================
  // DOM REFERENCES
  // ==========================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const searchInput = $('#search-input');
  const filterPills = $$('.filter-pill');
  const btnAddLead = $('#btn-add-lead');
  const modalLead = $('#modal-lead');
  const formNewLead = $('#form-new-lead');
  const modalWa = $('#modal-whatsapp');
  const toastContainer = $('#toast-container');

  // KPI elements
  const totalRevEl = $('#total-revenue');
  const totalLeadsEl = $('#total-leads-count');
  const convRateEl = $('#conversion-rate');
  const navLeadsCount = $('#nav-leads-count');

  // ==========================================
  // INITIALIZATION & RENDER
  // ==========================================
  function init() {
    renderKanban();
    setupEventListeners();
    showToast('✨ Demonstração do Lead Flow Studio pronta! Arraste os cards.');
  }

  function renderKanban() {
    // Clear containers
    ['novos', 'contato', 'proposta', 'fechado'].forEach(stage => {
      const cont = $(`#cards-${stage}`);
      if (cont) cont.innerHTML = '';
    });

    let counts = { novos: 0, contato: 0, proposta: 0, fechado: 0 };
    let revs = { novos: 0, contato: 0, proposta: 0, fechado: 0 };
    let totalValue = 0;

    const filtered = leads.filter(lead => {
      const matchSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          lead.company.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (currentFilter === 'all') return true;
      return lead.tag1.toUpperCase() === currentFilter || lead.tag2.toUpperCase() === currentFilter;
    });

    filtered.forEach(lead => {
      counts[lead.stage]++;
      revs[lead.stage] += lead.value;
      totalValue += lead.value;

      const card = createCardElement(lead);
      const targetCol = $(`#cards-${lead.stage}`);
      if (targetCol) targetCol.appendChild(card);
    });

    // Update Columns stats
    ['novos', 'contato', 'proposta', 'fechado'].forEach(stage => {
      $(`#count-${stage}`).textContent = counts[stage];
      $(`#rev-${stage}`).textContent = formatBRL(revs[stage]);
    });

    // Update KPI Bar
    totalRevEl.textContent = formatBRL(totalValue);
    totalLeadsEl.textContent = leads.length;
    if (navLeadsCount) navLeadsCount.textContent = leads.length;

    const totalDeals = leads.length;
    const closedDeals = leads.filter(l => l.stage === 'fechado').length;
    const rate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 0;
    convRateEl.textContent = `${rate}%`;
  }

  function createCardElement(lead) {
    const el = document.createElement('div');
    el.className = 'lead-card';
    el.setAttribute('draggable', 'true');
    el.dataset.id = lead.id;

    // Get initials
    const initials = lead.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    // Determine target stages for mobile click-to-move
    const nextStage = getNextStage(lead.stage);

    el.innerHTML = `
      <div class="card-top">
        <div class="client-info">
          <div class="client-avatar">${initials}</div>
          <strong class="client-name">${lead.name}</strong>
        </div>
        <button class="btn-wa" title="Simular conversa no WhatsApp" data-wa-name="${lead.name}" data-wa-initials="${initials}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.57 20.16 9.12 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.98 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.71 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16Z"/></svg>
        </button>
      </div>
      <div class="card-company">🏢 ${lead.company}</div>
      <div class="card-value">${formatBRL(lead.value)}</div>
      <div class="card-footer">
        <div class="tags-group">
          <span class="tag ${getTagClass(lead.tag1)}">${lead.tag1}</span>
          <span class="tag ${getTagClass(lead.tag2)}">${lead.tag2}</span>
        </div>
        ${nextStage ? `<button class="btn-move" data-move-id="${lead.id}" data-target="${nextStage.key}">Avançar ➔</button>` : `<span style="font-size:0.75rem; color:#10b981; font-weight:600;">✓ Concluído</span>`}
      </div>
    `;

    // Drag events
    el.addEventListener('dragstart', (e) => {
      draggedCardId = lead.id;
      el.classList.add('dragging');
      e.dataTransfer.setData('text/plain', lead.id);
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      draggedCardId = null;
      $$('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    });

    // WhatsApp Button Click
    const btnWa = el.querySelector('.btn-wa');
    btnWa.addEventListener('click', (e) => {
      e.stopPropagation();
      openWhatsAppModal(lead.name, initials);
    });

    // Mobile Move Button Click
    const btnMove = el.querySelector('.btn-move');
    if (btnMove) {
      btnMove.addEventListener('click', (e) => {
        e.stopPropagation();
        moveLead(lead.id, nextStage.key, nextStage.label);
      });
    }

    return el;
  }

  function getNextStage(current) {
    if (current === 'novos') return { key: 'contato', label: 'Em Contato' };
    if (current === 'contato') return { key: 'proposta', label: 'Proposta Enviada' };
    if (current === 'proposta') return { key: 'fechado', label: 'Fechado' };
    return null;
  }

  function getTagClass(tag) {
    const t = tag.toUpperCase();
    if (t === 'HOT') return 'hot';
    if (t === 'URGENTE') return 'urgente';
    if (t === 'SAAS') return 'saas';
    return '';
  }

  function formatBRL(val) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // ==========================================
  // EVENT LISTENERS & DRAG-AND-DROP ZONES
  // ==========================================
  function setupEventListeners() {
    // Columns Drag Zones
    $$('.kanban-column').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });
      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const stage = col.dataset.stage;
        if (draggedCardId && stage) {
          moveLead(draggedCardId, stage, getStageName(stage));
        }
      });
    });

    // Search input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderKanban();
    });

    // Filter pills
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.dataset.filter.toUpperCase();
        renderKanban();
      });
    });

    // Modals open/close
    btnAddLead.addEventListener('click', () => openModal(modalLead));
    $$('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = $(`#${btn.dataset.close}`);
        closeModal(target);
      });
    });

    // Form New Lead submit
    formNewLead.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#lead-name').value;
      const company = $('#lead-company').value;
      const value = parseFloat($('#lead-value').value) || 0;
      const stage = $('#lead-stage').value;
      const tags = $('#lead-tag').value.split('|');

      const newLead = {
        id: Date.now(),
        name,
        company,
        value,
        stage,
        tag1: tags[0],
        tag2: tags[1],
        time: 'Agora mesmo'
      };

      leads.unshift(newLead);
      renderKanban();
      closeModal(modalLead);
      formNewLead.reset();
      showToast(`🚀 Novo lead "${name}" adicionado ao funil de vendas!`);
    });

    // WhatsApp send simulate
    const waBtnSend = $('#wa-btn-send');
    const waInput = $('#wa-input-text');
    const waHistory = $('#wa-message-history');
    if (waBtnSend) {
      waBtnSend.addEventListener('click', () => {
        const text = waInput.value.trim();
        if (!text) return;
        const div = document.createElement('div');
        div.className = 'wa-bubble sent';
        div.innerHTML = `<p>${text}</p><span class="wa-time">Agora • ✓✓</span>`;
        waHistory.appendChild(div);
        waInput.value = '';
        waHistory.scrollTop = waHistory.scrollHeight;

        setTimeout(() => {
          const reply = document.createElement('div');
          reply.className = 'wa-bubble received';
          reply.innerHTML = `<p>Perfeito! Acabei de verificar a notificação aqui no WhatsApp Business. Vamos prosseguir com o fechamento!</p><span class="wa-time">Agora</span>`;
          waHistory.appendChild(reply);
          waHistory.scrollTop = waHistory.scrollHeight;
        }, 1200);
      });
    }

    // Sidebar navigation simulation
    $$('.nav-item').forEach(nav => {
      nav.addEventListener('click', () => {
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        nav.classList.add('active');
        const view = nav.dataset.view;
        if (view === 'analytics') {
          showToast('📊 Módulo Relatórios AI: Gráficos gerados com base em 47 negociações.');
        } else if (view === 'settings') {
          showToast('⚙️ Configurações: Webhooks do WhatsApp Business API operando normalmente.');
        } else if (view === 'leads') {
          showToast('👥 Lista Geral de Clientes carregada com sucesso.');
        }
      });
    });
  }

  function moveLead(id, newStage, stageName) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    if (lead.stage === newStage) return;

    lead.stage = newStage;
    renderKanban();
    showToast(`🔄 Lead "${lead.name}" movido para a coluna "${stageName}"!`);
  }

  function getStageName(stage) {
    const names = {
      novos: 'Novos Leads',
      contato: 'Em Contato',
      proposta: 'Proposta Enviada',
      fechado: 'Fechado'
    };
    return names[stage] || stage;
  }

  function openWhatsAppModal(name, initials) {
    $('#wa-chat-name').textContent = name;
    $('#wa-chat-avatar').textContent = initials;
    openModal(modalWa);
  }

  function openModal(modal) {
    if (modal) modal.classList.add('open');
  }

  function closeModal(modal) {
    if (modal) modal.classList.remove('open');
  }

  // ==========================================
  // TOAST FEEDBACK SYSTEM
  // ==========================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Run on start
  document.addEventListener('DOMContentLoaded', init);
})();
