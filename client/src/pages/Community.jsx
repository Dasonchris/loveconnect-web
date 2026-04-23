import { useState } from "react";
import "./Community.css";

export default function Community() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      user: "Ama",
      text: "This app is amazing 🔥",
      likes: 2,
    },
    {
      id: 2,
      user: "Kofi",
      text: "Blind Date feature is crazy 👀",
      likes: 5,
    },
  ]);

  const [newPost, setNewPost] = useState("");

  // ➕ Add post
  const addPost = () => {
    if (!newPost.trim()) return;

    const post = {
      id: Date.now(),
      user: "You",
      text: newPost,
      likes: 0,
    };

    setPosts([post, ...posts]);
    setNewPost("");
  };

  // ❤️ Like post
  const likePost = (id) => {
    setPosts(
      posts.map((p) =>
        p.id === id ? { ...p, likes: p.likes + 1 } : p
      )
    );
  };

  return (
    <div className="community-container">

      <h1 className="title">Community 🔥</h1>

      {/* 📝 CREATE POST */}
      <div className="post-box">
        <input
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's on your mind?"
        />

        <button onClick={addPost}>Post</button>
      </div>

      {/* 📢 POSTS FEED */}
      <div className="posts">

        {posts.map((post) => (
          <div key={post.id} className="post-card">

            <h3>{post.user}</h3>
            <p>{post.text}</p>

            <div className="post-actions">
              <button onClick={() => likePost(post.id)}>
                ❤️ {post.likes}
              </button>

              <button>
                💬 Comment
              </button>
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}