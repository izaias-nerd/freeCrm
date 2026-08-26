// src/index.js
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { createServer } = require('node:http');
const { v4: uuidv4 } = require('uuid');

const { lerNotas, salvarNotas } = require('./notes');
const { lerEquipe, salvarEquipe, corParaId } = require('./team');
const { lerTarefas, salvarTarefas } = require('./tasks');
const { lerMensagens } = require('./messages');
const { initSocketIO } = require('./socket');
const {
  noteSchema,
  teamMemberSchema,
  taskSchema,
  taskStatusSchema,
  taskAssignSchema,
  validateBody,
} = require('./validation');

// Inicializando o app e o servidor
const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);

// Inicializa o Socket.IO
const io = initSocketIO(server);

// ---------- Segurança de perímetro ----------

// Helmet: headers de segurança padrão (oculta X-Powered-By, mitiga clickjacking/XSS)
app.use(helmet());

// CORS restrito: apenas origens explicitamente permitidas via env (lista separada por vírgula).
// Sem ALLOWED_ORIGINS definido, nenhuma origem cross-site é liberada (mais seguro por padrão).
const origensPermitidas = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Gera um nonce novo a cada requisição
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Helmet configurado para aceitar esse nonce em script-src
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
      },
    },
  })
);

// Rate limiting nas rotas que escrevem dados, para mitigar abuso/força bruta
const limiteEscrita = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em instantes.' },
});

// Limitação de payload: evita corpos de requisição grandes (DoS)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

// Configuração para arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, '../public')));

// Configuração do mecanismo de visualização
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ---------- Rotas de páginas ----------

app.get('/', (req, res) => {
  res.render('dashboard');
});

app.get('/list', (req, res) => {
  res.render('list');
});

app.get('/notes', (req, res) => {
  res.render('notes');
});

app.get('/links', (req, res) => {
  res.render('links');
});

app.get('/list_notes', (req, res) => {
  const notas = lerNotas();
  res.render('list_notes', { notas });
});

app.get('/chat', (req, res) => {
  const mensagens = lerMensagens();
  res.render('chat', { mensagens });
});

// ---------- Notas ----------

app.post('/add-note', limiteEscrita, validateBody(noteSchema), (req, res) => {
  const { nota } = req.body;
  const notesId = uuidv4();
  const notas = lerNotas();

  notas.push({ id: notesId, nota });
  salvarNotas(notas);

  res.redirect('/list_notes');
});

app.post('/delete-note/:id', limiteEscrita, (req, res) => {
  const notaId = req.params.id;
  let notas = lerNotas();

  notas = notas.filter((nota) => nota.id !== notaId);

  salvarNotas(notas);
  res.redirect('/list_notes');
});

// ---------- Equipe ----------

app.get('/team', (req, res) => {
  const membros = lerEquipe();
  const tarefas = lerTarefas();
  // Conta quantas tarefas cada membro tem, para exibir na lista
  const membrosComContagem = membros.map((m) => ({
    ...m,
    totalTarefas: tarefas.filter((t) => t.assigneeId === m.id).length,
  }));
  res.render('team', { membros: membrosComContagem });
});

app.post('/team/add', limiteEscrita, validateBody(teamMemberSchema), (req, res) => {
  const { nome, email, papel } = req.body;
  const id = uuidv4();
  const membros = lerEquipe();

  membros.push({
    id,
    nome,
    email: email || '',
    papel: papel || 'Membro',
    cor: corParaId(id),
    criadoEm: new Date().toISOString(),
  });

  salvarEquipe(membros);
  res.redirect('/team');
});

app.post('/team/delete/:id', limiteEscrita, (req, res) => {
  const { id } = req.params;
  let membros = lerEquipe();
  membros = membros.filter((m) => m.id !== id);
  salvarEquipe(membros);

  // Desatribui tarefas do membro removido, em vez de deixar um assigneeId órfão
  const tarefas = lerTarefas().map((t) =>
    t.assigneeId === id ? { ...t, assigneeId: null } : t
  );
  salvarTarefas(tarefas);

  res.redirect('/team');
});

// ---------- Kanban ----------

app.get('/kanban', (req, res) => {
  const tarefas = lerTarefas();
  const membros = lerEquipe();
  res.render('kanban', { tarefas, membros });
});

app.post('/kanban/tasks', limiteEscrita, validateBody(taskSchema), (req, res) => {
  const { titulo, descricao, prioridade, assigneeId } = req.body;
  const membros = lerEquipe();

  // Só aceita assigneeId se o membro realmente existir
  const assigneeValido = membros.some((m) => m.id === assigneeId) ? assigneeId : null;

  const tarefas = lerTarefas();
  const novaTarefa = {
    id: uuidv4(),
    titulo,
    descricao: descricao || '',
    status: 'todo',
    prioridade: prioridade || 'media',
    assigneeId: assigneeValido,
    criadoEm: new Date().toISOString(),
  };
  tarefas.push(novaTarefa);
  salvarTarefas(tarefas);

  res.status(201).json(novaTarefa);
});

app.post(
  '/kanban/tasks/:id/status',
  limiteEscrita,
  validateBody(taskStatusSchema),
  (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const tarefas = lerTarefas();
    const tarefa = tarefas.find((t) => t.id === id);

    if (!tarefa) {
      return res.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    tarefa.status = status;
    salvarTarefas(tarefas);
    res.json(tarefa);
  }
);

app.post(
  '/kanban/tasks/:id/assign',
  limiteEscrita,
  validateBody(taskAssignSchema),
  (req, res) => {
    const { id } = req.params;
    const { assigneeId } = req.body;
    const membros = lerEquipe();
    const tarefas = lerTarefas();
    const tarefa = tarefas.find((t) => t.id === id);

    if (!tarefa) {
      return res.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    const assigneeValido = membros.some((m) => m.id === assigneeId) ? assigneeId : null;
    tarefa.assigneeId = assigneeValido;
    salvarTarefas(tarefas);
    res.json(tarefa);
  }
);

app.post('/kanban/tasks/:id/delete', limiteEscrita, (req, res) => {
  const { id } = req.params;
  let tarefas = lerTarefas();
  tarefas = tarefas.filter((t) => t.id !== id);
  salvarTarefas(tarefas);
  res.status(204).end();
});

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

// ---------- Middleware de erro global ----------
// Centraliza respostas de falha; em produção nunca vaza stack trace ou
// detalhes internos do banco de dados/infraestrutura.
app.use((err, req, res, next) => {
  console.error(err);
  const emProducao = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    erro: emProducao ? 'Erro interno do servidor' : err.message,
  });
});

// Iniciar o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
