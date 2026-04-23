// server/routes/matchRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const {
  getUsers, likeUser, dislikeUser, getMatches
} = require('../controllers/matchController');

router.get('/',                auth, getMatches);
router.get('/users',           auth, getUsers);
router.post('/like/:targetId', auth, likeUser);
router.post('/dislike/:targetId', auth, dislikeUser);

module.exports = router;