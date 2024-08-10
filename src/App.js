import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';


const carIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="fa-icon" style="font-size: 24px; color: blue;"><i class="fas fa-car"></i></div>`,
  iconSize: [30, 30], 
  iconAnchor: [15, 30] 
});

const App = () => {
  const [position, setPosition] = useState([17.385044, 78.486671]); // Initial position
  const [route, setRoute] = useState([]); // Full route data
  const [details, setDetails] = useState({
    speed: '60 km/h',
    temperature: '25°C',
    time: new Date().toLocaleTimeString(),
    distance: '0.5 km'
  });
  const [isPathVisible, setIsPathVisible] = useState(true); // Start with path visible
  const [selectedDate, setSelectedDate] = useState('today');

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/location/${selectedDate}`);
        const data = await response.json();
        console.log('Fetched route data:', data); 
        if (Array.isArray(data) && data.length > 0) {
          setRoute(data);
          setPosition([data[0].latitude, data[0].longitude]);
        } else {
          console.error('No route data found or data is not in expected format');
        }
      } catch (error) {
        console.error('Error fetching route data:', error);
      }
    };

    fetchRouteData();

    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:5000/api/vehicle-location');
        if (response.ok) {
          const data = await response.json();
          if (data.latitude && data.longitude) {
            setPosition([data.latitude, data.longitude]);
            setDetails(prevDetails => ({
              ...prevDetails,
              time: new Date(data.timestamp).toLocaleTimeString(),
            }));
          } else {
            console.error('Invalid data received from vehicle-location endpoint');
          }
        }
      } catch (error) {
        console.error('Error fetching vehicle location:', error);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleShowPath = () => {
    setIsPathVisible(true);
  };

  const handleHidePath = () => {
    setIsPathVisible(false);
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  return (
    <div className="App">
      <h1>Vehicle Movement Tracker</h1>
      <div className="controls">
        <button onClick={handleShowPath}>Show Path</button>
        <button onClick={handleHidePath}>Hide Path</button>
        <select value={selectedDate} onChange={handleDateChange}>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
        </select>
      </div>
      <MapContainer center={position} zoom={15} className="map-container">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position} icon={carIcon}>
          <Popup>
            <div className="vehicle-details">
              <p><strong>Time:</strong> {details.time}</p>
              <p><strong>Speed:</strong> {details.speed}</p>
              <p><strong>Temperature:</strong> {details.temperature}</p>
              <p><strong>Distance:</strong> {details.distance}</p>
            </div>
          </Popup>
        </Marker>
        {isPathVisible && route.length > 0 && (
          <Polyline 
            positions={route.map(r => [r.latitude, r.longitude])} 
            color="blue"
            weight={4}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default App;
