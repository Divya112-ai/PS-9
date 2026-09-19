const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.IO attached to the HTTP server.
 * Called once from server.js.
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Reliability settings
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id });

    // Client can request to join a "room" (e.g., 'operators', 'responders')
    socket.on('join:room', (roomName) => {
      if (typeof roomName === 'string' && roomName.length < 50) {
        socket.join(roomName);
        logger.debug(`Socket ${socket.id} joined room: ${roomName}`);
      }
    });

    socket.on('leave:room', (roomName) => {
      socket.leave(roomName);
      logger.debug(`Socket ${socket.id} left room: ${roomName}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, reason });
    });

    // Immediately inform client they're connected
    socket.emit('connected', { socketId: socket.id, timestamp: new Date() });
  });

  logger.info('Socket.IO initialized');
  return io;
};

/**
 * Get the initialized io instance.
 * Throws if accessed before initSocket() ran.
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket(server) first.');
  }
  return io;
};

/**
 * Safe emit helper — silently no-ops if Socket.IO isn't ready.
 * Useful during early phases or tests.
 */
const safeEmit = (eventName, payload, room = null) => {
  if (!io) {
    logger.warn(`Socket.IO not ready, dropping event: ${eventName}`);
    return;
  }

  try {
    if (room) {
      io.to(room).emit(eventName, payload);
    } else {
      io.emit(eventName, payload);
    }
    logger.debug(`Emitted ${eventName}${room ? ` to room ${room}` : ' (global)'}`);
  } catch (err) {
    logger.error(`Socket emit failed for ${eventName}`, err);
  }
};

module.exports = { initSocket, getIO, safeEmit };