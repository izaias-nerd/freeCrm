// src/team.js
const fs = require('fs');
const path = require('path');

const caminhoEquipe = path.join(__dirname, '../data/team.json');

// Paleta de cores para avatares gerados automaticamente (sem depender de upload)
const PALETA_CORES = ['#1bf668', '#3ba7ff', '#ff9f43', '#ff4d4f', '#a463f2', '#ffd23f', '#2ec4b6'];

function corParaId(id) {
  let soma = 0;
  for (const ch of String(id)) soma += ch.charCodeAt(0);
  return PALETA_CORES[soma % PALETA_CORES.length];
}

function lerEquipe() {
  try {
    if (fs.existsSync(caminhoEquipe)) {
      const dados = fs.readFileSync(caminhoEquipe, 'utf8');
      return dados ? JSON.parse(dados) : [];
    }
    return [];
  } catch (erro) {
    console.error('Erro ao ler equipe:', erro);
    return [];
  }
}

function salvarEquipe(membros) {
  try {
    fs.writeFileSync(caminhoEquipe, JSON.stringify(membros, null, 2), 'utf8');
  } catch (erro) {
    console.error('Erro ao salvar equipe:', erro);
  }
}

module.exports = {
  lerEquipe,
  salvarEquipe,
  corParaId,
};
