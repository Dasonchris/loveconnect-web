export default function Matches() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Your Matches</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2].map((m) => (
          <div key={m} className="p-4 bg-white rounded-xl shadow flex justify-between">
            <span>Match {m}</span>
            <button className="bg-blue-500 text-white px-3 py-1 rounded">Chat</button>
          </div>
        ))}
      </div>
    </div>
  );
}