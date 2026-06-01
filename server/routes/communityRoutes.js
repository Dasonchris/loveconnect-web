// server/routes/communityRoutes.js
const router = require('express').Router();
const auth   = require('../middleware/authMiddleware');
const {
  getPosts, createPost, likePost, addComment, deletePost, addReaction, deletePhoto
} = require('../controllers/communityController');

router.get('/',                      auth, getPosts);
router.post('/',                     auth, createPost);
router.put('/like/:id',              auth, likePost);
router.put('/reaction/:id',          auth, addReaction);
router.post('/comment/:id',          auth, addComment);
router.delete('/:id/photo/:photoIndex', auth, deletePhoto);
router.delete('/:id',                auth, deletePost);

module.exports = router;