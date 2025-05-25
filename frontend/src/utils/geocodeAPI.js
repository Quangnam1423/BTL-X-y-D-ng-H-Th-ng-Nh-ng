export async function geocodeAPI(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1`;
  try {
    console.log("Calling geocodeAPI with query:", query); // Log truy vấn
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.length > 0) {
      console.log("GeocodeAPI response:", data[0]); // Log kết quả trả về
      return {
        geometry: {
          location: {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          },
        },
        display_name: data[0].display_name,
      };
    } else {
      console.warn("No results found for the given location:", query); // Log cảnh báo
      throw new Error("No results found for the given location. Please try a more specific query.");
    }
  } catch (error) {
    console.error("Error in geocodeAPI:", error.message);
    throw new Error("Unable to fetch geocode data. Please check your query or try again later.");
  }
}
