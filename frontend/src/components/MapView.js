import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

const MapView = ({ searchQuery }) => {
  const [sensorData, setSensorData] = useState([]);
  const [activeSensor, setActiveSensor] = useState(null);
  const [latestData, setLatestData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [averagesData, setAveragesData] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAverages, setShowAverages] = useState(false);  const mapRef = useRef(null);
  // Tham chiếu popup và state cho mouse tracking
  const popupRef = useRef(null);
  const [isMouseOverPopup, setIsMouseOverPopup] = useState(false);
  
  // State để theo dõi trạng thái tương tác chuột
  const [mouseState, setMouseState] = useState({
    isMouseDown: false,
    isDragging: false,
    startPosition: null
  });
  
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}h${minutes} ngày ${day}/${month}/${year}`;
  };

  const calculateLPI = (lux, R, G, B) => {
    const LUX_norm = lux / 1000;
    const color_variance = (Math.abs(R - G) + Math.abs(G - B) + Math.abs(B - R)) / (R + G + B + 1e-5);
    const blue_ratio = B / (R + G + B + 1e-5);
    return 0.6 * LUX_norm + 0.25 * color_variance + 0.15 * blue_ratio;
  };
  
  const classifyLightType = (LUX_norm, imbalance) => {
    if (LUX_norm < 0.05) {
      return "Tối (gần như không có ánh sáng)";
    } else if (imbalance < 0.12 && LUX_norm > 0.3) {
      return "Ánh sáng tự nhiên (ban ngày)";
    } else {
      return "Ánh sáng nhân tạo";
    }
  };
  
  const getAstronomyAssessment = (lpi) => {
    if (lpi < 0.1) return "Tuyệt vời để quan sát thiên văn";
    if (lpi < 0.3) return "Phù hợp để quan sát thiên văn nhưng có hạn chế";
    if (lpi < 0.6) return "Khó khăn cho việc quan sát thiên văn";
    return "Không phù hợp cho quan sát thiên văn";
  };
  
  const getHealthAssessment = (lpi) => {
    if (lpi < 0.1) return "Không ảnh hưởng đến sức khỏe";
    if (lpi < 0.3) return "Có thể gây khó ngủ nếu tiếp xúc lâu dài vào buổi tối";
    if (lpi < 0.6) return "Có thể ảnh hưởng đến nhịp sinh học và giấc ngủ";
    return "Ảnh hưởng nghiêm trọng đến nhịp sinh học, giấc ngủ và sức khỏe";
  };
  
  // Hàm để lấy dữ liệu từ API
  const fetchLatestData = async () => {
    try {
      const response = await fetch('http://localhost:3030/api/stat/latest');
      const data = await response.json();
      setLatestData(data);
      return data;
    } catch (error) {
      console.error("Error fetching latest data:", error);
      return null;
    }
  };

  const fetchHistoryData = async () => {
    try {
      const response = await fetch('http://localhost:3030/api/stat/history');
      const data = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error("Error fetching history data:", error);
    }
  };

  const fetchAveragesData = async () => {
    try {
      const response = await fetch('http://localhost:3030/api/stat/averages');
      const data = await response.json();
      setAveragesData(data);
    } catch (error) {
      console.error("Error fetching averages data:", error);
    }
  };
  useEffect(() => {
    // Chỉ hiển thị PTIT Ngọc Trục
    const ptitNgocTruc = { id: 65, name: "PTIT Ngọc Trục", lat: 20.984945, lng: 105.768287 };

    // Lấy dữ liệu từ API cho PTIT Ngọc Trục
    const fetchData = async () => {
      const latestDataResult = await fetchLatestData();
        if (latestDataResult) {
        const { lux, r, g, b, lpi } = latestDataResult;
        const imbalance = (Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)) / (r + g + b + 1e-5);
          const data = [{
          id: ptitNgocTruc.id,
          name: ptitNgocTruc.name,
          center: [ptitNgocTruc.lat, ptitNgocTruc.lng],
          pollution: lux,
          LPI: lpi,
          imbalance,
          r, g, b,
          datetime: latestDataResult.datetime
        }];
        
        setSensorData(data);
      }
    };

    // Lấy dữ liệu khi component được mount
    fetchData();
    
    // Thiết lập lấy dữ liệu mỗi 30 phút (1800000 ms)
    const intervalId = setInterval(() => {
      fetchData();
    }, 1800000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (searchQuery && mapRef.current) {
      const foundSensor = sensorData.find((sensor) =>
        sensor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (foundSensor) {
        mapRef.current.setView(foundSensor.center, 10);
      } else {
        alert("Không tìm thấy vị trí phù hợp.");
      }
    }
  }, [searchQuery, sensorData]);

  const getPollutionColor = (lpi) => {
    // Phân loại màu dựa trên LPI thay vì cường độ ánh sáng
    if (lpi > 0.6) return "rgba(255, 0, 0, 0.8)";      // Đỏ - ô nhiễm nặng
    if (lpi > 0.3) return "rgba(255, 165, 0, 0.8)";    // Cam - ô nhiễm vừa
    if (lpi > 0.1) return "rgba(255, 255, 0, 0.8)";    // Vàng - ô nhiễm nhẹ
    return "rgba(0, 128, 0, 0.8)";                     // Xanh lá - không ô nhiễm
  };

  const getPollutionLevel = (lpi) => {
    if (lpi > 0.8) return "Rất cao";
    if (lpi > 0.6) return "Cao";
    if (lpi > 0.3) return "Trung bình";
    if (lpi > 0.1) return "Thấp";
    return "Không ô nhiễm";
  };
  const [zoomLevel, setZoomLevel] = useState(6);  // Hàm tính toán bán kính dựa trên mức zoom
  const calculateRadius = (zoom) => {
    // Diện tích phủ sóng xấp xỉ 3km²
    // Sử dụng công thức: Diện tích hình tròn = π * r²
    // => r = sqrt(3km² / π) ≈ 0.977km ≈ 977m
    
    // Bán kính cơ sở là 977m cho vùng phủ sóng 3km²
    const baseRadius = 977;
    
    // Điều chỉnh theo mức zoom để dễ nhìn ở các mức zoom khác nhau
    // Giảm dần kích thước khi zoom vào gần
    if (zoom <= 6) return baseRadius * 1.5;     // Nhìn xa nhất, lớn hơn một chút để dễ thấy
    if (zoom <= 8) return baseRadius * 1.2;     // Ở xa
    if (zoom <= 10) return baseRadius * 1.0;    // Trung bình, kích thước thật
    if (zoom <= 13) return baseRadius * 0.8;    // Gần
    return baseRadius * 0.6;                    // Rất gần
  };  // Cấu hình xử lý sự kiện mouse tracking
  useEffect(() => {
    // Khi không có popup, reset state
    if (!activeSensor) {
      setIsMouseOverPopup(false);
      setMouseState({
        isMouseDown: false,
        isDragging: false,
        startPosition: null
      });
    }
  }, [activeSensor]);
  return (
    <MapContainer
      center={[20.984945, 105.768287]} // Đổi center thành PTIT Ngọc Trục
      zoom={11}
      style={{ height: "100vh", width: "100vw" }}
      whenCreated={(mapInstance) => {
        mapRef.current = mapInstance;
        setZoomLevel(mapInstance.getZoom());
        
        // Thêm sự kiện lắng nghe thay đổi zoom
        mapInstance.on('zoomend', () => {
          setZoomLevel(mapInstance.getZoom());
        });
      }}      // Cho phép dragging map, nhưng sẽ bị ngăn chặn khi click trên popup
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
      scrollWheelZoom={!isMouseOverPopup} // Chỉ cho phép zoom bằng wheel khi không ở trên popup
      boxZoom={true}
      keyboard={true}
    >
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {sensorData.map((sensor) => (        <Circle
          key={sensor.id}
          center={sensor.center}
          pathOptions={{
            color: getPollutionColor(sensor.LPI),
            fillColor: getPollutionColor(sensor.LPI),
            fillOpacity: 0.5,
          }}
          radius={calculateRadius(zoomLevel)} // Bán kính động dựa trên mức zoom
          eventHandlers={{
            click: (e) => {
              // Ngăn chặn sự kiện click lan truyền
              e.originalEvent.stopPropagation();
              e.originalEvent.preventDefault();
              
              // Center map về vị trí sensor được click
              if (mapRef.current) {
                mapRef.current.setView(sensor.center, mapRef.current.getZoom());
              }
              
              setActiveSensor(sensor);
              // Reset mouse state để tránh xung đột
              setIsMouseOverPopup(false);
                // Nếu đây là sensor Ngọc Trục, tự động fetch dữ liệu lịch sử và trung bình
              if (sensor.name === "PTIT Ngọc Trục") {
                fetchHistoryData();
                fetchAveragesData();
              }
            }
          }}
        />
      ))}{activeSensor && (        <div
          ref={popupRef}
          style={{
            width: "60vw",
            height: "70vh",
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            fontSize: "16px",
            textAlign: "left",
            wordBreak: "break-word",
            overflowY: "auto",
            overscrollBehavior: "contain", /* Prevents scroll chaining */
            padding: "20px",
            boxSizing: "border-box",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
            touchAction: "auto", /* Ensures touch events work properly */
          }}            onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => {
            e.stopPropagation();
            setMouseState({
              isMouseDown: true,
              isDragging: false,
              startPosition: { x: e.clientX, y: e.clientY }
            });
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            setMouseState({
              isMouseDown: false,
              isDragging: false,
              startPosition: null
            });
          }}
          onMouseMove={(e) => {
            e.stopPropagation();
            // Kiểm tra nếu đang drag
            if (mouseState.isMouseDown && mouseState.startPosition) {
              const deltaX = Math.abs(e.clientX - mouseState.startPosition.x);
              const deltaY = Math.abs(e.clientY - mouseState.startPosition.y);
              if (deltaX > 5 || deltaY > 5) {
                setMouseState(prev => ({ ...prev, isDragging: true }));
              }
            }
          }}
          onContextMenu={(e) => e.stopPropagation()} // Ngăn chặn right-click
          onMouseEnter={() => setIsMouseOverPopup(true)}
          onMouseLeave={() => {
            setIsMouseOverPopup(false);
            // Reset mouse state khi rời khỏi popup
            setMouseState({
              isMouseDown: false,
              isDragging: false,
              startPosition: null
            });
          }}
          onWheel={(e) => {
            // Kiểm tra chuột có đang ở trong popup không
            if (isMouseOverPopup) {
              // Ngăn chặn zoom map
              e.stopPropagation();
              e.preventDefault();
              
              // Tự xử lý scroll cho popup
              const element = e.currentTarget;
              const delta = e.deltaY;
              const scrollSpeed = 50;
              
              element.scrollTop += (delta > 0 ? scrollSpeed : -scrollSpeed);
            }
            // Nếu chuột không ở trong popup, để map xử lý zoom
          }}
          onDragStart={(e) => e.preventDefault()}
          onDrag={(e) => e.preventDefault()}
        >          
        <button            onClick={(e) => {
              e.stopPropagation();
              setActiveSensor(null);
              setShowHistory(false);
              setShowAverages(false);
              setIsMouseOverPopup(false);
              setMouseState({
                isMouseDown: false,
                isDragging: false,
                startPosition: null
              });
            }}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "transparent",
              border: "none",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              padding: "5px",
              zIndex: 1001,
            }}
          >
            X
          </button>          
          <h2 style={{ marginBottom: "20px", width: "100%", textAlign: "center" }}>
            {activeSensor.name}
          </h2>
            {!showHistory && !showAverages && (            
              <div style={{ width: "100%" }}>              
              <div style={{ 
                backgroundColor: "#f8f9fa", 
                padding: "15px", 
                borderRadius: "5px", 
                marginBottom: "15px" 
              }}>
                <h3>Thông tin hiện tại:</h3>
                <p><strong>Cường độ ánh sáng:</strong> {activeSensor.pollution.toFixed(2)} lux</p>
                <p><strong>Chỉ số LPI:</strong> {activeSensor.LPI.toFixed(3)}</p>
                <p><strong>Tình trạng ô nhiễm:</strong> {getPollutionLevel(activeSensor.LPI)}</p>
                <p><strong>Loại ánh sáng:</strong> {classifyLightType(activeSensor.pollution / 1000, activeSensor.imbalance)}</p>
                <p><strong>Thời điểm đo:</strong> {formatDateTime(activeSensor.datetime)}</p>
              </div>              
              <div style={{ 
                backgroundColor: "#f0f7ff", 
                padding: "15px", 
                borderRadius: "5px", 
                marginBottom: "15px" 
              }}>
                <h3>Đánh giá khoa học:</h3>
                <p><strong>Ảnh hưởng đến quan sát thiên văn:</strong> {getAstronomyAssessment(activeSensor.LPI)}</p>
                <p><strong>Ảnh hưởng đến sức khỏe:</strong> {getHealthAssessment(activeSensor.LPI)}</p>
              </div>
        
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginTop: "20px" 
              }}>
                <button 
                  onClick={() => {
                    setShowHistory(true);
                    setShowAverages(false);
                  }}
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    flex: "1",
                    marginRight: "10px",
                  }}
                >
                  Xem lịch sử 24 lần đo gần nhất
                </button>
                <button 
                  onClick={() => {
                    setShowAverages(true);
                    setShowHistory(false);
                  }}
                  style={{
                    padding: "10px 15px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    flex: "1",
                  }}
                >
                  Xem thống kê trung bình
                </button>
              </div>
            </div>
          )}
            {/* Hiển thị lịch sử 24 lần đo */}
          {showHistory && historyData.length > 0 && (
            <div style={{ width: "100%" }}>
              <h3>Lịch sử 24 lần đo gần nhất:</h3>              
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f2f2f2" }}>
                    <th style={{ padding: "8px", border: "1px solid #ddd" }}>Thời gian</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd" }}>Lux</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd" }}>LPI</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd" }}>RGB</th>
                    <th style={{ padding: "8px", border: "1px solid #ddd" }}>Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((record, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "white" : "#f9f9f9" }}>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{formatDateTime(record.datetime)}</td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{record.lux.toFixed(2)}</td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{record.lpi.toFixed(3)}</td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                        R:{record.r} G:{record.g} B:{record.b}
                      </td>
                      <td style={{ padding: "8px", border: "1px solid #ddd" }}>{getPollutionLevel(record.lpi)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                onClick={() => {
                  setShowHistory(false);
                  setShowAverages(false);
                }}
                style={{
                  marginTop: "15px",
                  padding: "8px 15px",
                  backgroundColor: "#607d8b",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Quay lại
              </button>
            </div>
          )}
            {/* Hiển thị thống kê trung bình */}
          {showAverages && averagesData && (
            <div style={{ width: "100%" }}>
              <h3>Thống kê trung bình:</h3>              
              <div style={{ 
                backgroundColor: "#f5f5f5", 
                padding: "15px", 
                borderRadius: "5px", 
                marginBottom: "15px"
              }}><h4>Tháng 04/2025:</h4>
                <p><strong>Cường độ ánh sáng trung bình:</strong> {parseFloat(averagesData.avgLuxMonth).toFixed(2)} lux</p>
                <p><strong>Chỉ số LPI trung bình:</strong> {averagesData.avgLpiMonth.toFixed(3)}</p>
                <p><strong>Đánh giá ô nhiễm:</strong> {getPollutionLevel(averagesData.avgLpiMonth)}</p>
                <p><strong>Ảnh hưởng thiên văn:</strong> {getAstronomyAssessment(averagesData.avgLpiMonth)}</p>
                <p><strong>Ảnh hưởng sức khỏe:</strong> {getHealthAssessment(averagesData.avgLpiMonth)}</p>
              </div>              <div style={{ 
                backgroundColor: "#f5f5f5", 
                padding: "15px", 
                borderRadius: "5px", 
                marginBottom: "15px" 
              }}><h4>Năm 2024:</h4>
                <p><strong>Cường độ ánh sáng trung bình:</strong> {parseFloat(averagesData.avgLuxYear).toFixed(2)} lux</p>
                <p><strong>Chỉ số LPI trung bình:</strong> {averagesData.avgLpiYear.toFixed(3)}</p>
                <p><strong>Đánh giá ô nhiễm:</strong> {getPollutionLevel(averagesData.avgLpiYear)}</p>
                <p><strong>Ảnh hưởng thiên văn:</strong> {getAstronomyAssessment(averagesData.avgLpiYear)}</p>
                <p><strong>Ảnh hưởng sức khỏe:</strong> {getHealthAssessment(averagesData.avgLpiYear)}</p>
              </div>
              
              <button 
                onClick={() => {
                  setShowAverages(false);
                  setShowHistory(false);
                }}
                style={{
                  marginTop: "15px",
                  padding: "8px 15px",
                  backgroundColor: "#607d8b",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Quay lại
              </button>
            </div>
          )}
        </div>
      )}
    </MapContainer>
  );
};

export default MapView;