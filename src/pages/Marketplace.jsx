export default function Marketplace() {
  const items = ["Dinner Date", "Movie Ticket", "Gift Box"];

  return (
    <div className="p-4 grid md:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div key={i} className="bg-white p-4 rounded-xl shadow">
          <div className="h-32 bg-gray-200 rounded mb-2"></div>
          <h2 className="font-bold">{item}</h2>
          <button className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl">
      Buy Now
    </button>
        </div>
      ))}
    </div>
  );
}