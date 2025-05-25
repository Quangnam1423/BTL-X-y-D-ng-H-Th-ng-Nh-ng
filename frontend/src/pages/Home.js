import React from "react";
import { Box } from "@mui/material";
import MapView from "../components/MapView"; // Đảm bảo MapView được export mặc định

const Home = () => {
  return (
    <Box>
      <MapView />
    </Box>
  );
};

export default Home; // Export mặc định
