// server/routes/communityRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const {
  getPosts, createPost, likePost, addComment, deletePost
} = require('../controllers/communityController');

router.get('/',                   auth, getPosts);
router.post('/',                  auth, createPost);
router.put('/like/:id',           auth, likePost);
router.post('/comment/:id',       auth, addComment);
router.delete('/:id',             auth, deletePost);

module.exports = router;