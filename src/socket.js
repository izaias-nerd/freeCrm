// src/socket.js
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const { salvarMensagem } = require('./messages');
const { chatMessageSchema } = require('./validation');

// Throttle simples por socket para reduzir flood de mensagens
const INTERVALO_MINIMO_MS = 300;

function initSocketIO(server) {
  const io = new Server(server);
  const usuariosOnline = new Map(); // socket.id -> username

  function emitirListaUsuarios() {
    io.emit('users online', Array.from(new Set(usuariosOnline.values())));
  }

  io.on('connection', (socket) => {
    console.log('Um usuário se conectou');
    let ultimaMensagemEm = 0;

    socket.on('register', (username) => {
      if (typeof username !== 'string') return;
      const nomeLimpo = username.trim().slice(0, 40);
      if (!nomeLimpo) return;

      socket.username = nomeLimpo;
      usuariosOnline.set(socket.id, nomeLimpo);
      console.log(`Usuário registrado: ${nomeLimpo}`);
      emitirListaUsuarios();
    });

    socket.on('chat message', (msg) => {
      const agora = Date.now();
      if (agora - ultimaMensagemEm < INTERVALO_MINIMO_MS) return; // anti-flood
      ultimaMensagemEm = agora;

      const { error, value } = chatMessageSchema.validate({
        username: socket.username || 'Anon',
        msg,
      });
      if (error) return; // mensagem inválida (vazia, longa demais etc.) é descartada

      const mensagem = {
        id: uuidv4(),
        username: value.username,
        msg: value.msg,
        timestamp: new Date().toISOString(),
      };

      salvarMensagem(mensagem);
      io.emit('chat message', mensagem);
    });

    socket.on('typing', () => {
      if (socket.username) {
        socket.broadcast.emit('typing', { username: socket.username });
      }
    });

    socket.on('stop typing', () => {
      if (socket.username) {
        socket.broadcast.emit('stop typing', { username: socket.username });
      }
    });

    socket.on('disconnect', () => {
      console.log('Um usuário se desconectou');
      usuariosOnline.delete(socket.id);
      emitirListaUsuarios();
    });
  });

  return io;
}

module.exports = { initSocketIO };
