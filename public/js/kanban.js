document.addEventListener('DOMContentLoaded', () => {
  const membros = window.__MEMBROS__ || [];
  let tarefas = window.__TAREFAS_INICIAIS__ || [];

  const colunas = {
    todo: document.getElementById('col-todo'),
    doing: document.getElementById('col-doing'),
    done: document.getElementById('col-done'),
  };
  const contadores = {
    todo: document.getElementById('count-todo'),
    doing: document.getElementById('count-doing'),
    done: document.getElementById('count-done'),
  };

  const modalOverlay = document.getElementById('modal-overlay');
  const btnNovaTarefa = document.getElementById('btn-nova-tarefa');
  const btnCancelar = document.getElementById('btn-cancelar');
  const formNovaTarefa = document.getElementById('form-nova-tarefa');

  function membroPorId(id) {
    return membros.find((m) => m.id === id);
  }

  function criarCardElemento(tarefa) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.id = tarefa.id;

    const responsavel = membroPorId(tarefa.assigneeId);

    card.innerHTML = `
      <div class="kanban-card-top">
        <span class="tag prioridade-${tarefa.prioridade}">${tarefa.prioridade}</span>
        <button class="card-delete" title="Excluir tarefa" aria-label="Excluir tarefa">&times;</button>
      </div>
      <p class="kanban-card-title"></p>
      ${tarefa.descricao ? '<p class="kanban-card-desc"></p>' : ''}
      <div class="kanban-card-footer">
        <select class="assignee-select"></select>
      </div>
    `;

    card.querySelector('.kanban-card-title').textContent = tarefa.titulo;
    if (tarefa.descricao) {
      card.querySelector('.kanban-card-desc').textContent = tarefa.descricao;
    }

    const select = card.querySelector('.assignee-select');
    const optSemResp = document.createElement('option');
    optSemResp.value = '';
    optSemResp.textContent = 'Sem responsável';
    select.appendChild(optSemResp);
    membros.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.nome;
      if (responsavel && responsavel.id === m.id) opt.selected = true;
      select.appendChild(opt);
    });
    if (!responsavel) select.value = '';

    select.addEventListener('change', async () => {
      const assigneeId = select.value || null;
      await fetch(`/kanban/tasks/${tarefa.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId }),
      });
      tarefa.assigneeId = assigneeId;
    });

    card.querySelector('.card-delete').addEventListener('click', async () => {
      if (!confirm('Excluir esta tarefa?')) return;
      await fetch(`/kanban/tasks/${tarefa.id}/delete`, { method: 'POST' });
      tarefas = tarefas.filter((t) => t.id !== tarefa.id);
      renderizarQuadro();
    });

    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', tarefa.id);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));

    return card;
  }

  function renderizarQuadro() {
    Object.keys(colunas).forEach((status) => {
      colunas[status].innerHTML = '';
    });

    tarefas.forEach((tarefa) => {
      const coluna = colunas[tarefa.status] || colunas.todo;
      coluna.appendChild(criarCardElemento(tarefa));
    });

    Object.keys(contadores).forEach((status) => {
      contadores[status].textContent = tarefas.filter((t) => t.status === status).length;
    });
  }

  // Drag and drop entre colunas
  Object.entries(colunas).forEach(([status, coluna]) => {
    coluna.addEventListener('dragover', (e) => {
      e.preventDefault();
      coluna.classList.add('drag-over');
    });
    coluna.addEventListener('dragleave', () => coluna.classList.remove('drag-over'));
    coluna.addEventListener('drop', async (e) => {
      e.preventDefault();
      coluna.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const tarefa = tarefas.find((t) => t.id === id);
      if (!tarefa || tarefa.status === status) return;

      tarefa.status = status;
      renderizarQuadro();

      await fetch(`/kanban/tasks/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    });
  });

  // Modal de nova tarefa
  btnNovaTarefa.addEventListener('click', () => modalOverlay.classList.add('open'));
  btnCancelar.addEventListener('click', () => modalOverlay.classList.remove('open'));
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('open');
  });

  formNovaTarefa.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const prioridade = document.getElementById('prioridade').value;
    const assigneeId = document.getElementById('assigneeId').value || null;

    if (!titulo) return;

    const resposta = await fetch('/kanban/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descricao, prioridade, assigneeId }),
    });

    if (resposta.ok) {
      const novaTarefa = await resposta.json();
      tarefas.push(novaTarefa);
      renderizarQuadro();
      formNovaTarefa.reset();
      modalOverlay.classList.remove('open');
    } else {
      alert('Não foi possível criar a tarefa. Verifique os dados informados.');
    }
  });

  renderizarQuadro();
});
