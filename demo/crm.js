const cards = [...document.querySelectorAll('.crm .lead-card')];
const columns = [...document.querySelectorAll('.crm-column')];
const search = document.querySelector('#crm-search');
const source = document.querySelector('#crm-source');
const status = document.querySelector('#crm-status');
let draggedCard;

function normalize(text) {
  return text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function updateBoard() {
  const terms = normalize(search.value).trim().split(/\s+/);
  for (const card of cards) {
    const content = normalize(card.dataset.search);
    card.hidden = !terms.every(term => content.includes(term)) || Boolean(source.value && source.value !== card.dataset.source);
  }
  let total = 0;
  for (const column of columns) {
    const count = column.querySelectorAll('.lead-card:not([hidden])').length;
    total += count;
    column.querySelector('.col-count').textContent = count;
    column.querySelector('.empty').hidden = count > 0;
    const metric = document.querySelector(`[data-count="${column.dataset.stage}"]`);
    if (metric) metric.textContent = count;
  }
  document.querySelector('[data-count="total"]').textContent = total;
}

async function save(form, payload, done) {
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled) return;
  button.disabled = true;
  status.textContent = 'Salvando…';
  try {
    const response = await fetch(location.pathname, { method: 'POST', body: payload, headers: { Accept: 'application/json' } });
    if (response.status !== 204) throw new Error('Alteração recusada');
    done();
    status.textContent = 'Alteração salva.';
  } catch {
    status.textContent = 'Não foi possível salvar. Confira a conexão e tente novamente.';
  } finally {
    button.disabled = false;
  }
}

function move(card, stage) {
  const column = columns.find(item => item.dataset.stage === stage);
  if (!column || column.contains(card)) return;
  const form = card.querySelector('.crm-stage-form');
  const payload = new URLSearchParams(new FormData(form));
  payload.set('stage', stage);
  save(form, payload, () => {
    column.querySelector('.col-cards-container').append(card);
    form.elements.stage.value = stage;
    updateBoard();
  });
}

document.querySelector('.crm-filters').hidden = false;
search.addEventListener('input', updateBoard);
source.addEventListener('change', updateBoard);
for (const card of cards) {
  card.draggable = true;
  const stageForm = card.querySelector('.crm-stage-form');
  stageForm.addEventListener('submit', event => {
    event.preventDefault();
    move(card, stageForm.elements.stage.value);
  });
  const notes = card.querySelector('.crm-notes');
  const noteForm = notes.querySelector('form');
  noteForm.addEventListener('submit', event => {
    event.preventDefault();
    const payload = new URLSearchParams(new FormData(noteForm));
    save(noteForm, payload, () => {
      notes.querySelector('summary').textContent = payload.get('note').trim()
        ? 'Ver nota de acompanhamento'
        : 'Adicionar nota';
    });
  });
  card.addEventListener('dragstart', event => {
    draggedCard = card;
    card.classList.add('dragging');
    event.dataTransfer.setData('text/plain', 'contato');
    event.dataTransfer.effectAllowed = 'move';
  });
  card.addEventListener('dragend', () => {
    draggedCard = null;
    card.classList.remove('dragging');
    for (const column of columns) column.classList.remove('drag-over');
  });
}
for (const column of columns) {
  column.addEventListener('dragover', event => {
    if (!draggedCard) return;
    event.preventDefault();
    column.classList.add('drag-over');
  });
  column.addEventListener('dragleave', event => {
    if (!column.contains(event.relatedTarget)) column.classList.remove('drag-over');
  });
  column.addEventListener('drop', event => {
    if (!draggedCard) return;
    event.preventDefault();
    column.classList.remove('drag-over');
    move(draggedCard, column.dataset.stage);
  });
}
