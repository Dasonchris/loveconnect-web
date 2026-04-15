import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Matches from "./pages/Matches";
import BlindDate from "./pages/BlindDate";
import Marketplace from "./pages/Marketplace";
import Community from "./pages/Community";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="bg-gray-100 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/blind" element={<BlindDate />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/community" element={<Community />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}