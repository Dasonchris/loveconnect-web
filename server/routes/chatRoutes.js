// server/routes/chatRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const {
  getMessages, sendMessage, deleteMessage,
  getUnreadCount,
  getNotes, addNote, deleteNote,
  addReaction, setTyping
} = require('../controllers/chatController');

router.get('/notes',        auth, getNotes);
router.post('/notes',       auth, addNote);
router.delete('/notes/:id', auth, deleteNote);
router.get('/unread/:userId', auth, getUnreadCount);
router.get('/:userId',      auth, getMessages);
router.post('/send',        auth, sendMessage);
router.put('/reaction/:id', auth, addReaction);
router.put('/typing/:userId', auth, setTyping);
router.delete('/:id',       auth, deleteMessage);

module.exports = router;