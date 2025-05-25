import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState } from "react";
import Home from "./pages/Home"; // Đảm bảo Home được export mặc định
import MapView from "./components/MapView"; // Đảm bảo MapView được export mặc định
import Navbar from "./components/Navbar"; // Đảm bảo Navbar được export mặc định

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query) => {
    console.log("Search query received in App:", query); // Log search query from Navbar
    setSearchQuery(query); // Update search query
  };

  return (
    <Router>
      <Navbar onSearch={handleSearch} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapView searchQuery={searchQuery} />} />
      </Routes>
    </Router>
  );
}

export default App;
