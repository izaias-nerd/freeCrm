<p align="center">
  <img src="public/assets/logo.png" alt="infoDevBrasil" width="180">
</p>

<h1 align="center">infoDevBrasil CRM</h1>

<p align="center">CRM minimalista com dashboard, notas, chat em tempo real e central de links — construído em Node.js + Express + EJS.</p>

---

## ✨ Funcionalidades

- **Dashboard** com acesso rápido às ferramentas do dia a dia.
- **Kanban e Team** (Novas funcionalidades)...
- **Tarefas/Notas**: criação, listagem e exclusão de notas (persistidas em `data/notes.json`).
- **Chat em tempo real** via Socket.IO.
- **Central de Links**: atalhos para redes sociais, e-mail e ferramentas de produtividade.
- Layout responsivo com menu lateral (sidebar) compartilhado entre todas as páginas.

## 🖥️ Instruções de Uso

```bash
# Clonar o projeto
git clone https://github.com/izaias-nerd/crm_new.git
cd crm_new

# Instalar as dependências
npm install

# Rodar em modo desenvolvimento (com reload automático)
npm run dev

# Rodar em modo produção
npm start
```

O servidor sobe por padrão na porta `3000` (configurável pela variável de ambiente `PORT`).

## 📁 Estrutura do projeto

```
crm_new/
├── data/               # Persistência simples em JSON (notas)
├── public/
│   ├── assets/         # Logo, favicon e imagens
│   ├── css/            # Estilos globais (style.css)
│   └── js/             # Scripts do cliente (sidebar.js)
├── src/
│   ├── index.js        # Servidor Express + rotas
│   ├── notes.js        # Leitura/escrita das notas
│   └── socket.js       # Configuração do Socket.IO
└── views/
    ├── partials/        # Componentes reutilizáveis (sidebar)
    ├── dashboard.ejs
    ├── notes.ejs
    ├── list_notes.ejs
    ├── chat.ejs
    ├── links.ejs
    └── list.ejs
```

## 🧩 Rotas principais

| Rota               | Método | Descrição                              |
|--------------------|--------|------------------------------------------|
| `/`                | GET    | Dashboard                               |
| `/notes`           | GET    | Formulário para adicionar nota          |
| `/add-note`        | POST   | Cria uma nova nota                      |
| `/list_notes`      | GET    | Lista as notas cadastradas              |
| `/delete-note/:id` | POST   | Remove uma nota pelo ID                 |
| `/chat`            | GET    | Chat em tempo real                      |
| `/links`           | GET    | Central de links (Web3/Nostr)           |
| `/list`            | GET    | Ferramentas gratuitas de produtividade  |

## ❓ Dúvidas ou Problemas

Se você estiver enfrentando dificuldades para configurar o projeto ou se os links não estiverem abrindo corretamente, entre em contato:

📧 <infodevbrasil@gmail.com>

🔗 [Demo online](https://crm-new-iusv.onrender.com)

---

<p align="center">Feito com 💚 por <b>infoDevBrasil</b></p>
