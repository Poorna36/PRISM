let io = null;

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function emitAlert(alert) {
  if (io) {
    io.emit('alert:new', alert);
  }
}

function emitSurveySummary(payload) {
  if (io) {
    io.emit('survey:summary', payload);
  }
}

function getIO() {
  return io;
}

module.exports = { initSocket, emitAlert, emitSurveySummary, getIO };
