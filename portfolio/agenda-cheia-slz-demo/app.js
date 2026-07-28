/* ============================================
   LeadFlow CRM — Interactive Demo System Logic
   ============================================ */

// State tracking
let activeView = 'landing'; // 'landing' | 'demo'
let activeDemoPage = 'dashboard';
let leadsData = [
  { id: '1', name: 'Marcos Souza', service: 'Harmonização Facial', price: 1800, stage: 'novo', tag: 'Instagram Ads', tagClass: 'tag-blue' },
  { id: '2', name: 'Camila Silva', service: 'Botox + Preenchimento', price: 1100, stage: 'novo', tag: 'Site Direct', tagClass: 'tag-blue' },
  { id: '3', name: 'Renata Alves', service: 'Limpeza de Pele Profunda', price: 380, stage: 'atendimento', tag: 'Robô Ativo', tagClass: 'tag-purple' },
  { id: '4', name: 'Rodrigo Santos', service: 'Bioestimulador de Colágeno', price: 2200, stage: 'atendimento', tag: 'Qualificado', tagClass: 'tag-purple' },
  { id: '5', name: 'Joana Mendes', service: 'Peeling Químico + Retorno', price: 820, stage: 'proposta', tag: 'Aguardando Aceite', tagClass: 'tag-yellow' },
  { id: '6', name: 'Patrícia Rocha', service: 'Lifting Facial sem Corte', price: 3500, stage: 'proposta', tag: 'Encaixe Oferecido', tagClass: 'tag-yellow' },
  { id: '7', name: 'Ana Costa', service: 'Botox • Horário de Encaixe', price: 850, stage: 'fechado', tag: 'Pago / Agendado', tagClass: 'tag-green' },
  { id: '8', name: 'Maria Silva', service: 'Limpeza de Pele + Dermaroller', price: 450, stage: 'fechado', tag: 'Pago / Agendado', tagClass: 'tag-green' }
];

let nextLeadId = 9;

// Open Demo System
function openDemoSystem(targetPage = 'dashboard') {
  document.getElementById('landing-view').classList.remove('active');
  document.getElementById('demo-view').classList.add('active');
  activeView = 'demo';
  showPage(targetPage);
  window.scrollTo(0, 0);
}

// Back to Landing Presentation
function backToLanding() {
  document.getElementById('demo-view').classList.remove('active');
  document.getElementById('landing-view').classList.add('active');
  activeView = 'landing';
  window.scrollTo(0, 0);
}

// Show Specific Page inside Demo System
function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));

  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add('active');
    activeDemoPage = pageId;
  }

  const navLinks = document.querySelectorAll('.sidebar-nav a');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-page') === pageId) {
      link.classList.add('active');
    }
  });

  const mainContent = document.querySelector('.main-content');
  if (mainContent) mainContent.scrollTop = 0;
  
  // Close sidebar on mobile after selection
  document.querySelector('.sidebar').classList.remove('open');
}

// Mobile Sidebar Toggle
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}

// Move Kanban Card to Next Column
function moveCardNext(cardId) {
  const item = leadsData.find(l => l.id === cardId);
  if (!item) return;

  const stageOrder = ['novo', 'atendimento', 'proposta', 'fechado'];
  const currentIndex = stageOrder.indexOf(item.stage);
  
  if (currentIndex < stageOrder.length - 1) {
    item.stage = stageOrder[currentIndex + 1];
    
    // Update tag based on stage
    if (item.stage === 'atendimento') { item.tag = 'Atendimento IA'; item.tagClass = 'tag-purple'; }
    else if (item.stage === 'proposta') { item.tag = 'Proposta Enviada'; item.tagClass = 'tag-yellow'; }
    else if (item.stage === 'fechado') { item.tag = 'Pago / Agendado'; item.tagClass = 'tag-green'; }

    renderKanbanCards();
    updateKanbanStats();
  }
}

// Render Kanban Cards dynamically
function renderKanbanCards() {
  const stages = ['novo', 'atendimento', 'proposta', 'fechado'];

  stages.forEach(stage => {
    const colElement = document.getElementById(`col-${stage}`);
    const stageItems = leadsData.filter(l => l.stage === stage);
    
    if (!colElement) return;

    colElement.innerHTML = stageItems.map(item => `
      <div class="kanban-card ${stage === 'fechado' ? 'card-win' : ''}" data-id="${item.id}">
        <div class="card-tag ${item.tagClass}">${item.tag}</div>
        <h4 class="card-name">${item.name}</h4>
        <p class="card-desc">${item.service}</p>
        <div class="card-footer">
          <span class="card-price">R$ ${item.price.toLocaleString('pt-BR')}</span>
          ${stage !== 'fechado' ? `<button class="btn-card-action" onclick="moveCardNext('${item.id}')">Mover →</button>` : '<span class="badge badge-success">Venda Fechada</span>'}
        </div>
      </div>
    `).join('');

    const countElement = document.getElementById(`count-${stage}`);
    if (countElement) countElement.innerText = stageItems.length;
  });
}

// Update Kanban & Dashboard Statistics
function updateKanbanStats() {
  const totalLeads = leadsData.length;
  const totalRevenue = leadsData.reduce((acc, curr) => acc + curr.price, 0);

  const badgeEl = document.getElementById('leads-count-badge');
  if (badgeEl) badgeEl.innerText = totalLeads;

  const statLeadsEl = document.getElementById('stat-total-leads');
  if (statLeadsEl) statLeadsEl.innerText = totalLeads;

  const statRevEl = document.getElementById('stat-total-revenue');
  if (statRevEl) statRevEl.innerText = `R$ ${totalRevenue.toLocaleString('pt-BR')}`;
}

// Modal Handlers for "+ Criar Lead Demo"
function openNewLeadModal() {
  document.getElementById('new-lead-modal').classList.add('active');
}

function closeNewLeadModal() {
  document.getElementById('new-lead-modal').classList.remove('active');
}

function handleCreateLead(event) {
  event.preventDefault();

  const name = document.getElementById('lead-name').value.trim();
  const service = document.getElementById('lead-service').value.trim();
  const price = parseFloat(document.getElementById('lead-price').value) || 1000;
  const stage = document.getElementById('lead-stage').value;

  if (!name || !service) return;

  const newLead = {
    id: String(nextLeadId++),
    name: name,
    service: service,
    price: price,
    stage: stage,
    tag: 'Lead Criado',
    tagClass: stage === 'novo' ? 'tag-blue' : stage === 'atendimento' ? 'tag-purple' : stage === 'proposta' ? 'tag-yellow' : 'tag-green'
  };

  leadsData.push(newLead);
  renderKanbanCards();
  updateKanbanStats();
  closeNewLeadModal();
  document.getElementById('new-lead-form').reset();

  showPage('kanban');
}

// WhatsApp Multiatendimento Chat Handlers
const chatData = {
  marcos: {
    name: 'Marcos Souza',
    avatar: 'MS',
    status: '🟢 Online • Atendido por Agente IA LeadFlow',
    badge: 'Lead Qualificado',
    messages: [
      { text: 'Olá! Vi o anúncio no Instagram e gostaria de saber como funciona a Harmonização Facial na clínica de vocês.', type: 'received', time: '11:40' },
      { text: 'Olá Marcos! Seja muito bem-vindo à Clínica Belle Face SLZ. ✨<br><br>A Harmonização Facial é personalizada para cada rosto. Temos horários com nossa especialista ainda para esta semana.<br><br>Você gostaria de agendar uma avaliação cortesia ou prefere receber a tabela de valores no WhatsApp?', type: 'sent', ai: true, time: '11:41' },
      { text: 'Gostaria de ver os valores primeiro e saber se tem horário na quinta-feira à tarde!', type: 'received', time: '11:42' }
    ]
  },
  ana: {
    name: 'Ana Costa',
    avatar: 'AC',
    status: '🟢 Online • Encaixe Confirmado',
    badge: 'Venda Fechada',
    messages: [
      { text: 'Olá Ana! Surgiu uma vaga de encaixe hoje às 11:00 para Botox. Gostaria de ocupar?', type: 'sent', ai: true, time: '11:22' },
      { text: 'SIM, posso ocupar o horário de 11:00!', type: 'received', time: '11:30' },
      { text: 'Excelente Ana! Agendamento confirmado para às 11:00 na Clínica Belle Face. Te esperamos! 😊', type: 'sent', ai: true, time: '11:31' }
    ]
  },
  joana: {
    name: 'Joana Mendes',
    avatar: 'JM',
    status: '🟡 Aguardando Resposta',
    badge: 'Proposta Enviada',
    messages: [
      { text: 'Olá Joana! Notamos que seu orçamento para Peeling Químico está pendente há alguns dias. Temos uma condição especial para fechamento hoje!', type: 'sent', ai: true, time: '10:10' },
      { text: 'Consegue enviar o orçamento detalhado em PDF?', type: 'received', time: '10:15' }
    ]
  }
};

let currentChatKey = 'marcos';

function selectChatThread(key) {
  currentChatKey = key;
  const data = chatData[key];
  if (!data) return;

  document.querySelectorAll('.chat-thread-item').forEach(el => el.classList.remove('active'));
  event.currentTarget.classList.add('active');

  document.getElementById('active-chat-avatar').innerText = data.avatar;
  document.getElementById('active-chat-name').innerText = data.name;
  document.getElementById('active-chat-status').innerText = data.status;

  renderChatMessages();
}

function renderChatMessages() {
  const container = document.getElementById('chat-messages-body');
  const data = chatData[currentChatKey];
  if (!container || !data) return;

  container.innerHTML = '<div class="chat-divider"><span>Hoje • Conversa em Tempo Real</span></div>' +
    data.messages.map(m => `
      <div class="chat-bubble ${m.type} ${m.ai ? 'ai-bubble' : ''}">
        ${m.ai ? '<div class="ai-badge">🤖 Agente IA LeadFlow</div>' : ''}
        ${m.text}
        <div class="bubble-time">${m.time} ${m.type === 'sent' ? '<span class="checkmarks">✓✓</span>' : ''}</div>
      </div>
    `).join('');

  container.scrollTop = container.scrollHeight;
}

function sendDemoChatMessage() {
  const input = document.getElementById('chat-text-input');
  const text = input.value.trim();
  if (!text) return;

  const data = chatData[currentChatKey];
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  data.messages.push({ text: text, type: 'sent', ai: false, time: timeStr });
  input.value = '';
  renderChatMessages();
}

function handleChatKeyPress(event) {
  if (event.key === 'Enter') sendDemoChatMessage();
}

function simulateAiReply() {
  const data = chatData[currentChatKey];
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  const replies = [
    'Entendido! Nosso Agente de IA verificou o sistema e reservou a sua solicitação. Gostaria de confirmar a forma de pagamento?',
    'Com certeza! Enviamos todos os detalhes do procedimento no seu WhatsApp. Posso agendar o melhor horário para você?',
    'Ótimo! Nosso sistema registrou seu interesse e já notificou a equipe comercial.'
  ];
  const randomReply = replies[Math.floor(Math.random() * replies.length)];

  data.messages.push({ text: randomReply, type: 'sent', ai: true, time: timeStr });
  renderChatMessages();
}

function toggleAiBot(checkbox) {
  const label = document.getElementById('ai-status-label');
  if (checkbox.checked) {
    label.innerText = 'ATIVO';
    label.style.color = 'var(--color-primary)';
  } else {
    label.innerText = 'PAUSADO';
    label.style.color = 'var(--text-dim)';
  }
}

// AI Agent Prompt Simulator
function runSimulatedAiPrompt() {
  const inputVal = document.getElementById('ai-test-input').value;
  const outputEl = document.getElementById('ai-test-output');

  outputEl.innerText = '🤖 Processando mensagem com Agente de IA LeadFlow...';
  
  setTimeout(() => {
    outputEl.innerHTML = `
      <strong>[ANÁLISE DE INTENÇÃO]:</strong> Agendamento &amp; Preço Botox<br>
      <strong>[AÇÃO AUTOMÁTICA]:</strong> Consulta de horários vagos no banco de dados da clínica.<br>
      <strong>[RESPOSTA GERADA VIA IA]:</strong><br>
      "Olá! Na sexta-feira temos horários disponíveis às 14:30 e às 16:00 para aplicação de Botox. O valor promocional da sessão fica R$ 850 ou 3x de R$ 295. Qual horário fica melhor para você?"
    `;
  }, 700);
}

function testPromptAi(type) {
  showPage('agentes-ia');
  const inputEl = document.getElementById('ai-test-input');
  if (type === 'Qualificador') inputEl.value = 'Quais são os horários para botox na sexta-feira?';
  else if (type === 'Encaixe') inputEl.value = 'Surgiu alguma vaga por cancelamento hoje?';
  else if (type === 'Reativação') inputEl.value = 'Quero saber se aquele desconto do orçamento ainda vale.';

  runSimulatedAiPrompt();
}

// Keyboard shortcuts for quick demo presentation (1-6 keys)
document.addEventListener('keydown', function(e) {
  if (activeView !== 'demo') return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

  const keyMap = {
    '1': 'dashboard',
    '2': 'kanban',
    '3': 'mensagens',
    '4': 'agentes-ia',
    '5': 'reativacao',
    '6': 'resultado'
  };

  if (keyMap[e.key]) {
    showPage(keyMap[e.key]);
  }
});

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  renderKanbanCards();
  updateKanbanStats();

  // Check URL parameters for direct demo launch (?demo=true or #demo)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'true' || window.location.hash === '#demo') {
    openDemoSystem('dashboard');
  }
});
