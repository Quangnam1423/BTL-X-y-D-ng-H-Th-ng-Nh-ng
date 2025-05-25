import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Box, TextField, Button } from "@mui/material";

const Navbar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (onSearch && searchQuery.trim()) {
      console.log("Search query sent from Navbar:", searchQuery);
      onSearch(searchQuery);
    } else {
      alert("Please enter a valid location.");
    }
  };

  return (
    <AppBar position="static">
      <Toolbar style={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">Light Pollution Monitoring</Typography>
        <Box style={{ display: "flex", alignItems: "center", margin: "0 auto" }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Enter an address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSearch(); // Tìm kiếm khi nhấn Enter
            }}
            style={{ backgroundColor: "white", borderRadius: "4px", marginRight: "8px" }}
          />
          <Button variant="contained" color="primary" onClick={handleSearch}>
            Search
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; // Export mặc định
