// server/server.js
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { app, connectDB } = require('./app');

// CORS configuration - allow multiple localhost ports for development
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all localhost variants for development
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin === 'http://localhost:5173') {
      callback(null, true);
    } else {
      callback(null, process.env.CORS_ORIGIN || origin);
    }
  },
  credentials: true
};

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const createServer = (port) => {
  const server = http.createServer(app);
  const io = new Server(server, { cors: corsOptions });

  io.on('connection', (socket) => {
    socket.on('join',        (userId)  => socket.join(userId));
    socket.on('sendMessage', async ({ senderId, receiverId, text }) => {
      const Message = require('./models/Message');
      const msg = await Message.create({ sender: senderId, receiver: receiverId, text });
      io.to(receiverId).emit('newMessage', msg);
      io.to(senderId).emit('newMessage',   msg);
    });
    socket.on('typing',     ({ receiverId }) => io.to(receiverId).emit('typing'));
    socket.on('stopTyping', ({ receiverId }) => io.to(receiverId).emit('stopTyping'));
    socket.on('disconnect', () => console.log('User disconnected'));
  });

  return server;
};

const startServer = async (port = parseInt(process.env.PORT, 10) || 5000, attempt = 0) => {
  const server = createServer(port);

  server.listen(port)
    .on('listening', () => {
      const actualPort = server.address().port;
      console.log(`🚀 Server on http://localhost:${actualPort}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE' && attempt < 20) {
        const nextPort = port + 1;
        console.warn(`❌ Port ${port} is already in use. Trying port ${nextPort}...`);
        startServer(nextPort, attempt + 1);
      } else if (err.code === 'EADDRINUSE' && !process.env.PORT) {
        console.warn('❌ No free port found in range; falling back to a random available port.');
        const fallbackServer = createServer(0);
        fallbackServer.listen(0)
          .on('listening', () => {
            const randomPort = fallbackServer.address().port;
            console.log(`🚀 Server on http://localhost:${randomPort}`);
          })
          .on('error', (fallbackErr) => {
            console.error('Server error:', fallbackErr);
            process.exit(1);
          });
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
};

connectDB().then(() => {
  const startPort = parseInt(process.env.PORT, 10) || 5000;
  startServer(startPort);
});