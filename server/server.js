// server/server.js
const fs   = require('fs');
const path = require('path');

// Manually load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const connectDB  = require('./config/db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: 'http://localhost:5173', credentials: true }
});

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/matches',     require('./routes/matchRoutes'));
app.use('/api/chat',        require('./routes/chatRoutes'));
app.use('/api/community',   require('./routes/communityRoutes'));
app.use('/api/marketplace', require('./routes/marketplaceRoutes'));
app.use('/api/blind',       require('./routes/blindDateRoutes'));

// Health check
app.get('/', (req, res) => res.json({
  status:  '❤️  LoveConnect API running',
  routes: [
    'POST /api/auth/register',
    'POST /api/auth/login',
    'GET  /api/matches/users',
    'POST /api/matches/like/:id',
    'GET  /api/matches',
    'GET  /api/chat/:userId',
    'POST /api/chat/send',
    'GET  /api/community',
    'POST /api/community',
    'GET  /api/marketplace',
    'POST /api/marketplace/purchase/:id',
    'GET  /api/blind/match',
  ]
}));

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
  server.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
});