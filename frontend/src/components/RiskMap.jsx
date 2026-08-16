import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Map Resizer component to ensure Leaflet invalidates container size on render/mount (fixes blank/gray tiles inside modals & tabs)
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 350);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);
  return null;
}

// Custom Leaflet Markers (Clean Professional Circles, No Emojis)
const greenIcon = L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="background-color: #059669; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 6px rgba(5,150,105,0.5);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const orangeIcon = L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="background-color: #d97706; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 8px rgba(217,119,6,0.6);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const redIcon = L.divIcon({
  className: "custom-leaflet-marker",
  html: `<div style="background-color: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(220,38,38,0.8); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">!</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const REGION_COORDINATES = {
  // States
  "Punjab": { lat: 30.9000, lng: 75.8500, zoom: 8 },
  "Haryana": { lat: 29.6900, lng: 76.9900, zoom: 8 },
  "Bihar": { lat: 24.9500, lng: 84.0100, zoom: 8 },
  "Uttar Pradesh": { lat: 27.4900, lng: 77.6700, zoom: 8 },
  "All Regions": { lat: 29.5000, lng: 77.5000, zoom: 6 },

  // Punjab Districts
  "Patiala": { lat: 30.3400, lng: 76.3800, zoom: 11 },
  "Ludhiana": { lat: 30.9000, lng: 75.8500, zoom: 11 },
  "Sangrur": { lat: 30.2450, lng: 75.8420, zoom: 11 },
  "Amritsar": { lat: 31.6340, lng: 74.8720, zoom: 11 },
  "Jalandhar": { lat: 31.3260, lng: 75.5760, zoom: 11 },

  // Haryana Districts
  "Karnal": { lat: 29.6850, lng: 76.9900, zoom: 11 },
  "Ambala": { lat: 30.3780, lng: 76.7760, zoom: 11 },
  "Kurukshetra": { lat: 29.9690, lng: 76.8780, zoom: 11 },
  "Panipat": { lat: 29.3900, lng: 76.9630, zoom: 11 },

  // Bihar Districts
  "Rohtas": { lat: 24.9500, lng: 84.0100, zoom: 11 },
  "Gaya": { lat: 24.7950, lng: 85.0000, zoom: 11 },
  "Bhojpur": { lat: 25.5600, lng: 84.6600, zoom: 11 },
  "Kaimur": { lat: 25.0400, lng: 83.6100, zoom: 11 },

  // UP Districts
  "Mathura": { lat: 27.4900, lng: 77.6700, zoom: 11 },
  "Meerut": { lat: 28.9840, lng: 77.7060, zoom: 11 },
  "Bulandshahr": { lat: 28.4060, lng: 77.8500, zoom: 11 },
  "Aligarh": { lat: 27.8970, lng: 78.0880, zoom: 11 }
};

function MapViewController({ selectedState, selectedDistrict, fields }) {
  const map = useMap();

  useEffect(() => {
    // 1. Check if specific district is selected
    if (selectedDistrict && selectedDistrict !== "All Districts" && REGION_COORDINATES[selectedDistrict]) {
      const loc = REGION_COORDINATES[selectedDistrict];
      map.flyTo([loc.lat, loc.lng], loc.zoom, { animate: true, duration: 1.2 });
      return;
    }

    // 2. Check if specific state is selected
    if (selectedState && selectedState !== "All Regions" && REGION_COORDINATES[selectedState]) {
      const loc = REGION_COORDINATES[selectedState];
      map.flyTo([loc.lat, loc.lng], loc.zoom, { animate: true, duration: 1.2 });
      return;
    }

    // 3. Fallback: if fields exist, calculate center from first field
    if (fields && fields.length > 0) {
      const firstCoords = fields[0].geometry?.coordinates?.[0]?.[0];
      if (firstCoords && firstCoords[0] && firstCoords[1]) {
        map.flyTo([firstCoords[1], firstCoords[0]], 10, { animate: true, duration: 1.2 });
        return;
      }
    }

    // 4. Default for All Regions
    if (REGION_COORDINATES["All Regions"]) {
      const loc = REGION_COORDINATES["All Regions"];
      map.flyTo([loc.lat, loc.lng], loc.zoom, { animate: true, duration: 1.2 });
    }
  }, [selectedState, selectedDistrict, fields, map]);

  return null;
}

function LocationPickerEvents({ onPickLocation }) {
  useMapEvents({
    click(e) {
      if (onPickLocation) {
        onPickLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

export default function RiskMap({ 
  fields = [], 
  fires = [], 
  onSelectField, 
  pickMode = false, 
  onPickLocation, 
  selectedLocation,
  selectedState = "All Regions",
  selectedDistrict = "All Districts"
}) {
  const [mapTileType, setMapTileType] = useState("carto"); // "carto" or "satellite"

  const defaultCenter = [30.34, 76.38];

  const getFieldColor = (field) => {
    if (field.status === "fire_detected" || field.status === "ground_team_dispatched" || field.status === "under_verification") {
      return { color: "#dc2626", fillColor: "#dc2626", fillOpacity: 0.45 };
    }
    if (field.risk_score >= 70 || field.status === "offered") {
      return { color: "#d97706", fillColor: "#d97706", fillOpacity: 0.35 };
    }
    return { color: "#059669", fillColor: "#059669", fillOpacity: 0.25 };
  };

  return (
    <div style={styles.mapWrapper}>
      {/* Map Control Bar */}
      <div style={styles.mapHeader}>
        <div style={styles.legendGroup}>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: "#059669" }}></span> Monitored Field</span>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: "#d97706" }}></span> High Burning Risk</span>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: "#dc2626" }}></span> Active Satellite Fire</span>
        </div>
        <div style={styles.tileToggle}>
          <button 
            style={{ ...styles.tileBtn, background: mapTileType === "carto" ? "#ffffff" : "transparent", color: mapTileType === "carto" ? "#0f172a" : "#64748b" }}
            onClick={() => setMapTileType("carto")}
          >
            Light Map
          </button>
          <button 
            style={{ ...styles.tileBtn, background: mapTileType === "satellite" ? "#ffffff" : "transparent", color: mapTileType === "satellite" ? "#0f172a" : "#64748b" }}
            onClick={() => setMapTileType("satellite")}
          >
            Satellite View
          </button>
        </div>
      </div>

      <MapContainer 
        center={defaultCenter} 
        zoom={10} 
        style={styles.mapContainer}
        scrollWheelZoom={true}
      >
        <MapResizer />
        <MapViewController selectedState={selectedState} selectedDistrict={selectedDistrict} fields={fields} />
        {mapTileType === "carto" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
          />
        ) : (
          <TileLayer
            attribution="Esri World Imagery"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {pickMode && <LocationPickerEvents onPickLocation={onPickLocation} />}

        {pickMode && selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={greenIcon}>
            <Popup>
              <div style={styles.popupContent}>
                <strong>Selected Field Location</strong><br />
                Latitude: {selectedLocation.lat.toFixed(4)}, Longitude: {selectedLocation.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {!pickMode && fields.map((field) => {
          const coords = field.geometry?.coordinates?.[0]?.map(pt => [pt[1], pt[0]]) || [[30.34, 76.38], [30.344, 76.38], [30.344, 76.385], [30.34, 76.385]];
          const centerPt = coords[0];
          const style = getFieldColor(field);
          const isFire = field.status === "fire_detected" || field.status === "ground_team_dispatched" || field.status === "under_verification";
          const isOrange = field.risk_score >= 70 && !isFire;
          const isGreen = !isFire && !isOrange;

          return (
            <React.Fragment key={field.id}>
              <Polygon 
                positions={coords} 
                pathOptions={style}
                eventHandlers={{
                  click: () => onSelectField && onSelectField(field)
                }}
              />
              <Marker 
                position={centerPt} 
                icon={isFire ? redIcon : isOrange ? orangeIcon : greenIcon}
                eventHandlers={{
                  click: () => onSelectField && onSelectField(field)
                }}
              >
                <Popup>
                  <div className="custom-map-popup">
                    {/* GREEN MONITORED FIELD */}
                    {isGreen && (
                      <div>
                        <div className="popup-title">FIELD {field.id}</div>
                        <div><strong>Farmer:</strong> {field.farmer_name}</div>
                        <div><strong>Crop:</strong> {field.crop_type}</div>
                        <div><strong>Area:</strong> {field.area_acres} acres</div>
                        <div><strong>District:</strong> {field.district}</div>
                        <div style={{ marginTop: "4px" }}>
                          Status: <span className="popup-badge badge-green">No Active Fire</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>Last monitored: 10:42 AM</div>
                        <button 
                          className="popup-btn" 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectField && onSelectField(field);
                          }}
                        >
                          Inspect Field
                        </button>
                      </div>
                    )}

                    {/* ORANGE HIGH RISK FIELD */}
                    {isOrange && (
                      <div>
                        <div className="popup-title">FIELD {field.id}</div>
                        <div><strong>Crop:</strong> {field.crop_type}</div>
                        <div><strong>Area:</strong> {field.area_acres} acres</div>
                        <div><strong>District:</strong> {field.district}</div>
                        <div><strong>Risk Score:</strong> <span style={{ color: "#d97706", fontWeight: "bold" }}>{field.risk_score}</span></div>
                        <div><strong>Predicted Risk:</strong> <span className="popup-badge badge-orange">HIGH RISK</span></div>
                        <div><strong>Prevention Window:</strong> {field.countdown_hours || 192} hours</div>
                        <div><strong>Biomass Opportunity:</strong> Active</div>
                        <button 
                          className="popup-btn" 
                          style={{ background: "#d97706" }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectField && onSelectField(field);
                          }}
                        >
                          Inspect Field
                        </button>
                      </div>
                    )}

                    {/* RED ACTIVE FIRE */}
                    {isFire && (
                      <div>
                        <div className="popup-title" style={{ color: "#dc2626" }}>ACTIVE SATELLITE FIRE</div>
                        <div><strong>Field ID:</strong> {field.id}</div>
                        <div><strong>Farmer:</strong> {field.farmer_name}</div>
                        <div><strong>Crop:</strong> {field.crop_type}</div>
                        <div><strong>Area:</strong> {field.area_acres} acres</div>
                        <div><strong>District:</strong> {field.district}</div>
                        <div><strong>Detected:</strong> 10:24 AM</div>
                        <div><strong>Satellite Confidence:</strong> 94%</div>
                        <div style={{ marginTop: "4px" }}>
                          Status: <span className="popup-badge badge-red">Awaiting Verification</span>
                        </div>
                        <button 
                          className="popup-btn" 
                          style={{ background: "#dc2626" }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectField && onSelectField(field);
                          }}
                        >
                          Inspect Incident
                        </button>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}

const styles = {
  mapWrapper: {
    width: "100%",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
  },
  mapHeader: {
    padding: "0.6rem 1rem",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  legendGroup: {
    display: "flex",
    gap: "1rem",
    fontSize: "0.8rem",
    color: "#334155",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontWeight: "500"
  },
  dot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
  },
  tileToggle: {
    display: "flex",
    background: "#e2e8f0",
    borderRadius: "6px",
    padding: "2px",
  },
  tileBtn: {
    padding: "4px 10px",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.78rem",
    fontWeight: "600",
    cursor: "pointer",
  },
  mapContainer: {
    height: "440px",
    width: "100%",
  },
  popupContent: {
    fontSize: "0.85rem",
    lineHeight: "1.4",
  }
};