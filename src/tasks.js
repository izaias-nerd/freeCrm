// src/tasks.js
const fs = require('fs');
const path = require('path');

const caminhoTarefas = path.join(__dirname, '../data/tasks.json');

function lerTarefas() {
  try {
    if (fs.existsSync(caminhoTarefas)) {
      const dados = fs.readFileSync(caminhoTarefas, 'utf8');
      return dados ? JSON.parse(dados) : [];
    }
    return [];
  } catch (erro) {
    console.error('Erro ao ler tarefas:', erro);
    return [];
  }
}

function salvarTarefas(tarefas) {
  try {
    fs.writeFileSync(caminhoTarefas, JSON.stringify(tarefas, null, 2), 'utf8');
  } catch (erro) {
    console.error('Erro ao salvar tarefas:', erro);
  }
}

module.exports = {
  lerTarefas,
  salvarTarefas,
};
