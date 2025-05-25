import { useEffect, useState } from "react";

const Results = () => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Fetch data from the backend
    fetch("http://localhost:5000/api/sensor")
      .then((response) => response.json())
      .then((data) => setResults(data))
      .catch((error) => console.error("❌ Error fetching data:", error));
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
      <h2>Kết quả đo mức độ ô nhiễm ánh sáng</h2>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
          border: "1px solid #ddd"
        }}
      >
        <thead>
          <tr style={{ background: "#007bff", color: "white" }}>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Tên điểm đo</th>
            <th style={styles.th}>Vĩ độ</th>
            <th style={styles.th}>Kinh độ</th>
            <th style={styles.th}>Mức độ ô nhiễm</th>
          </tr>
        </thead>
        <tbody>
          {results.map((res) => (
            <tr key={res.id} style={styles.tr}>
              <td style={styles.td}>{res.id}</td>
              <td style={styles.td}>{res.name}</td>
              <td style={styles.td}>{res.lat}</td>
              <td style={styles.td}>{res.lng}</td>
              <td style={styles.td}>{res.pollution} lux</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Style bảng
const styles = {
  th: {
    padding: "10px",
    border: "1px solid #ddd",
    textAlign: "center"
  },
  td: {
    padding: "10px",
    border: "1px solid #ddd",
    textAlign: "center"
  },
  tr: {
    background: "#f9f9f9"
  }
};

export default Results;
