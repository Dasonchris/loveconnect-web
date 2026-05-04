// server/server.js
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { app, connectDB } = require('./app');

const server = http.createServer(app);

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

const io = new Server(server, { cors: corsOptions });

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Socket.IO — real time chat
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

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT)
    .on('listening', () => console.log(`🚀 Server on http://localhost:${PORT}`))
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Stop the other process or set PORT=<anotherPort> before starting.`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
});