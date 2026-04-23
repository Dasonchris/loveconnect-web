// server/routes/chatRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const {
  getMessages, sendMessage, deleteMessage,
  getNotes, addNote, deleteNote
} = require('../controllers/chatController');

router.get('/notes',     auth, getNotes);
router.post('/notes',    auth, addNote);
router.delete('/notes/:id', auth, deleteNote);
router.get('/:userId',   auth, getMessages);
router.post('/send',     auth, sendMessage);
router.delete('/:id',    auth, deleteMessage);

module.exports = router;