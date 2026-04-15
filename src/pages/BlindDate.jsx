import { useState } from "react";

export default function BlindDate() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Blind Date</h1>
      {!unlocked ? (
        <button
          onClick={() => setUnlocked(true)}
          className="bg-pink-500 text-white px-4 py-2 rounded"
        >
          Unlock Premium
        </button>
      ) : (
        <div className="bg-white p-4 rounded-xl shadow">
          <p>Anonymous match found 👀</p>
          <button className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">
            Start Chat
          </button>
        </div>
      )}
    </div>
  );
}