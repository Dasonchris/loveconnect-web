export default function Community() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Community</h1>
      {[1, 2, 3].map((post) => (
        <div key={post} className="bg-white p-4 rounded-xl shadow mb-3">
          <h2 className="font-bold">User {post}</h2>
          <p className="text-sm text-gray-600">This app is amazing 🔥</p>
        </div>
      ))}
    </div>
  );
}