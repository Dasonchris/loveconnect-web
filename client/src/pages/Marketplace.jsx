import { useState } from "react";
import "./Marketplace.css";

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", message: "" });

  const items = [
    { name: "Dinner Date", price: "$50", image: "https://via.placeholder.com/300" },
    { name: "Movie Ticket", price: "$15", image: "https://via.placeholder.com/300" },
    { name: "Gift Box", price: "$30", image: "https://via.placeholder.com/300" },
    { name: "Flowers", price: "$20", image: "https://via.placeholder.com/300" },
    { name: "Chocolate Pack", price: "$25", image: "https://via.placeholder.com/300" },
    { name: "Weekend Getaway", price: "$120", image: "https://via.placeholder.com/300" },
  ];

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePurchase = () => {
    alert(`Purchased ${selectedItem.name} for ${formData.name}`);
    setSelectedItem(null);
    setFormData({ name: "", message: "" });
  };

  return (
    <div className="marketplace-container">
      
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search products..."
        className="search-input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Products Grid */}
      <div className="marketplace-grid">
        {filteredItems.map((item) => (
          <div key={item.name} className="marketplace-card">
            
            <img src={item.image} alt={item.name} />

            <h2 className="marketplace-title">{item.name}</h2>
            <p className="marketplace-price">{item.price}</p>

            <button
              onClick={() => setSelectedItem(item)}
              className="buy-btn"
            >
              Buy Now
            </button>

          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="modal-box">
            
            <h2>Purchase {selectedItem.name}</h2>

            <input
              type="text"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <textarea
              placeholder="Message (optional)"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
            />

            <button onClick={handlePurchase} className="confirm-btn">
              Confirm Purchase
            </button>

            <button
              onClick={() => setSelectedItem(null)}
              className="cancel-btn"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </div>
  );
}