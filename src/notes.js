const fs = require('fs');
const path = require('path');

// Caminho para o arquivo JSON
const caminhoNotas = path.join(__dirname, '../data/notes.json');

// Função para ler notas do arquivo JSON
function lerNotas() {
    try {
        // Verifica se o arquivo existe
        if (fs.existsSync(caminhoNotas)) {
            const dados = fs.readFileSync(caminhoNotas, 'utf8');
            // Verifica se o arquivo está vazio ou contém dados inválidos
            return dados ? JSON.parse(dados) : [];
        } else {
            return []; // Retorna um array vazio se o arquivo não existir
        }
    } catch (erro) {
        console.error('Erro ao ler o arquivo:', erro);
        return []; // Retorna um array vazio em caso de erro
    }
}

// Função para salvar notas no arquivo JSON
function salvarNotas(notes) {
    try {
        // Escreve as notas no arquivo
        fs.writeFileSync(caminhoNotas, JSON.stringify(notes, null, 2), 'utf8');
    } catch (erro) {
        console.error('Erro ao salvar as notas:', erro);
    }
}

// Exportando as funções
module.exports = {
    lerNotas,
    salvarNotas
};
