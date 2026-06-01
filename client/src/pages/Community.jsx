import { useState, useEffect } from "react";
import { communityAPI } from "../api";
import "./Community.css";

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCommentBox, setShowCommentBox] = useState(null);
  const [commentText, setCommentText] = useState("");

  const emojis = ["❤️", "😂", "😮", "😢", "😡", "🔥"];

  // ── Load posts on mount ──────────────────────────────
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await communityAPI.getPosts();
      setPosts(data);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Handle photo selection ───────────────────────────
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // ── Remove photo from preview ────────────────────────
  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // ── Create post with photos ──────────────────────────
  const createPost = async () => {
    if (!newPost.trim() && photos.length === 0) {
      alert("Please write something or add a photo");
      return;
    }

    try {
      await communityAPI.createPost(newPost, photos);
      setNewPost("");
      setPhotos([]);
      loadPosts();
    } catch (err) {
      console.error("Failed to create post:", err);
      alert("Failed to create post");
    }
  };

  // ── Like/Unlike post ─────────────────────────────────
  const toggleLike = async (postId) => {
    try {
      await communityAPI.likePost(postId);
      loadPosts();
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  // ── Add emoji reaction ───────────────────────────────
  const addReaction = async (postId, emoji) => {
    try {
      await communityAPI.addReaction(postId, emoji);
      loadPosts();
    } catch (err) {
      console.error("Failed to add reaction:", err);
    }
  };

  // ── Delete photo from post ───────────────────────────
  const deletePostPhoto = async (postId, photoIndex) => {
    try {
      await communityAPI.deletePhoto(postId, photoIndex);
      loadPosts();
    } catch (err) {
      console.error("Failed to delete photo:", err);
      alert("Failed to delete photo");
    }
  };

  // ── Add comment ──────────────────────────────────────
  const submitComment = async (postId) => {
    if (!commentText.trim()) return;

    try {
      await communityAPI.addComment(postId, commentText);
      setCommentText("");
      setShowCommentBox(null);
      loadPosts();
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert("Failed to add comment");
    }
  };

  // ── Delete post ──────────────────────────────────────
  const deletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await communityAPI.deletePost(postId);
      loadPosts();
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Failed to delete post");
    }
  };

  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user._id || user.id;
    } catch {
      return null;
    }
  };

  return (
    <div className="community-container">
      <h1 className="title">Community 🔥</h1>

      {/* ═ CREATE POST ═ */}
      <div className="post-box">
        <div className="post-input-area">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind? 💭"
            rows="3"
          />
        </div>

        {/* Photo preview */}
        {photos.length > 0 && (
          <div className="photo-preview">
            {photos.map((photo, idx) => (
              <div key={idx} className="preview-item">
                <img src={photo} alt={`Preview ${idx}`} />
                <button
                  className="remove-photo-btn"
                  onClick={() => removePhoto(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="post-actions">
          <label className="photo-upload-btn">
            📷 Photo
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ display: "none" }}
            />
          </label>

          <button
            className="post-btn"
            onClick={createPost}
            disabled={!newPost.trim() && photos.length === 0}
          >
            Post
          </button>
        </div>
      </div>

      {/* ═ POSTS FEED ═ */}
      <div className="posts-feed">
        {loading && <p className="loading">Loading posts...</p>}

        {!loading && posts.length === 0 && (
          <p className="empty">No posts yet. Be the first to post! 🚀</p>
        )}

        {posts.map((post) => (
          <div key={post._id} className="post-card">
            {/* Post Header */}
            <div className="post-header">
              <div className="user-info">
                <img
                  src={
                    post.user?.photo ||
                    `https://ui-avatars.com/api/?name=${post.name}&background=ff4d6d&color=fff`
                  }
                  alt={post.name}
                  className="user-avatar"
                />
                <div>
                  <h4>{post.name}</h4>
                  <small>
                    {post.createdAt 
                      ? new Date(post.createdAt).toLocaleDateString()
                      : ""}
                  </small>
                </div>
              </div>
              {post.user?._id === getCurrentUserId() && (
                <button
                  className="delete-post-btn"
                  onClick={() => deletePost(post._id)}
                  title="Delete post"
                >
                  🗑️
                </button>
              )}
            </div>

            {/* Post Text */}
            {post.text && <p className="post-text">{post.text}</p>}

            {/* Post Photos */}
            {post.photos && post.photos.length > 0 && (
              <div className="post-photos">
                {post.photos.map((photo, idx) => (
                  <div key={idx} className="post-photo-item">
                    <img src={photo} alt={`Post ${idx}`} />
                    {post.user?._id === getCurrentUserId() && (
                      <button
                        className="delete-photo-btn"
                        onClick={() => deletePostPhoto(post._id, idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Reactions */}
            {post.reactions && post.reactions.length > 0 && (
              <div className="reactions-display">
                {post.reactions.map((reaction, idx) => (
                  <span key={idx} className="reaction-badge">
                    {reaction.emoji}
                  </span>
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="post-actions-row">
              <button
                className={`action-btn ${
                  post.likes?.some(u => u._id === getCurrentUserId() || u === getCurrentUserId())
                    ? "liked"
                    : ""
                }`}
                onClick={() => toggleLike(post._id)}
              >
                ❤️ {post.likes?.length || 0}
              </button>

              <button
                className="action-btn"
                onClick={() =>
                  setShowCommentBox(
                    showCommentBox === post._id ? null : post._id
                  )
                }
              >
                💬 {post.comments?.length || 0}
              </button>

              {/* Emoji Reactions */}
              <div className="emoji-picker">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="emoji-btn"
                    onClick={() => addReaction(post._id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            {post.comments && post.comments.length > 0 && (
              <div className="comments-section">
                {post.comments.slice(-2).map((comment, idx) => (
                  <div key={idx} className="comment">
                    <strong>{comment.name}</strong>
                    <p>{comment.text}</p>
                    {comment.photo && (
                      <img src={comment.photo} alt="comment" className="comment-photo" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Comment Input */}
            {showCommentBox === post._id && (
              <div className="comment-input-box">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitComment(post._id);
                  }}
                />
                <button
                  onClick={() => submitComment(post._id)}
                  disabled={!commentText.trim()}
                >
                  Post
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}