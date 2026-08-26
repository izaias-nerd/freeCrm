// src/messages.js
const fs = require('fs');
const path = require('path');

const caminhoMensagens = path.join(__dirname, '../data/messages.json');
const LIMITE_HISTORICO = 200; // evita crescimento ilimitado do arquivo

function lerMensagens() {
  try {
    if (fs.existsSync(caminhoMensagens)) {
      const dados = fs.readFileSync(caminhoMensagens, 'utf8');
      return dados ? JSON.parse(dados) : [];
    }
    return [];
  } catch (erro) {
    console.error('Erro ao ler mensagens:', erro);
    return [];
  }
}

function salvarMensagem(mensagem) {
  try {
    const mensagens = lerMensagens();
    mensagens.push(mensagem);
    // Mantém apenas as últimas N mensagens
    const recortadas = mensagens.slice(-LIMITE_HISTORICO);
    fs.writeFileSync(caminhoMensagens, JSON.stringify(recortadas, null, 2), 'utf8');
    return recortadas;
  } catch (erro) {
    console.error('Erro ao salvar mensagem:', erro);
    return lerMensagens();
  }
}

module.exports = {
  lerMensagens,
  salvarMensagem,
};
