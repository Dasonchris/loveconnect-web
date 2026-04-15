import "./Home.css";

export default function Home() {
  const users = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];

  return (
    <div className="container">
      {users.map((u) => (
        <div key={u} className="card">
          <img
            src={`https://via.placeholder.com/300?text=User+${u}`}
            alt={`User ${u}`}
          />

          <h2>User {u}</h2>
          <p>Loves music & vibes</p>

          <div className="actions">
            <button className="dislike">❌</button>
            <button className="like">❤️</button>
          </div>
        </div>
      ))}
    </div>
  );
}