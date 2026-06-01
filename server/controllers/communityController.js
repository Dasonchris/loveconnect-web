// server/controllers/communityController.js
const Post = require('../models/Post');

// GET /api/community  ← Community.jsx feed
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name photo')
      .populate('likes', 'name')
      .populate('comments.user', 'name photo')
      .populate('reactions.user', 'name');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/community  ← add post with photos
exports.createPost = async (req, res) => {
  try {
    const { text, photos } = req.body;
    
    if (!text?.trim() && (!photos || photos.length === 0)) {
      return res.status(400).json({ message: 'Post cannot be empty' });
    }

    const post = await Post.create({
      user: req.user._id,
      name: req.user.name,
      text: text?.trim() || '',
      photos: photos || [],
    });

    await post.populate('user', 'name photo');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/community/like/:id  ← like button
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.includes(req.user._id);
    if (alreadyLiked) {
      post.likes = post.likes.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ likes: post.likes.length, liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/community/reaction/:id  ← add emoji reaction
exports.addReaction = async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji)
      return res.status(400).json({ message: 'Emoji required' });

    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ message: 'Post not found' });

    // Remove existing reaction from user, if any
    post.reactions = post.reactions.filter(
      r => r.user.toString() !== req.user._id.toString()
    );

    // Add new reaction if provided
    if (emoji) {
      post.reactions.push({
        user: req.user._id,
        emoji,
      });
    }

    await post.save();
    await post.populate('reactions.user', 'name');
    res.json({ reactions: post.reactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/community/comment/:id  ← add comment with optional photo
exports.addComment = async (req, res) => {
  try {
    const { text, photo } = req.body;
    if (!text?.trim())
      return res.status(400).json({ message: 'Comment cannot be empty' });

    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ message: 'Post not found' });

    post.comments.push({
      user: req.user._id,
      name: req.user.name,
      text,
      photo: photo || '',
    });

    await post.save();
    await post.populate('comments.user', 'name photo');
    res.status(201).json(post.comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/community/:id/photo/:photoIndex  ← delete photo from post
exports.deletePhoto = async (req, res) => {
  try {
    const { photoIndex } = req.params;
    const post = await Post.findById(req.params.id);
    
    if (!post)
      return res.status(404).json({ message: 'Post not found' });
    
    if (post.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    if (photoIndex < 0 || photoIndex >= post.photos.length)
      return res.status(400).json({ message: 'Invalid photo index' });

    post.photos.splice(photoIndex, 1);
    await post.save();
    res.json({ photos: post.photos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/community/:id  ← delete entire post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ message: 'Post not found' });
    if (post.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};