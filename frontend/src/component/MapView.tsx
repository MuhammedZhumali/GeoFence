import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import { useState } from "react";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Props {
  trajectory: { lat: number; lon: number; timestamp?: number }[];
  startingPoint: { lat: number; lon: number } | null;
  onMapClick?: (lat: number, lon: number) => void;
  onClearStartingPoint?: () => void;
}

// Component to handle map clicks
function MapClickHandler({ 
  onMapClick, 
  enabled,
  onSet 
}: { 
  onMapClick?: (lat: number, lon: number) => void; 
  enabled: boolean;
  onSet?: () => void;
}) {
  useMapEvents({
    click: (e) => {
      console.log("MapClickHandler: click event", { enabled, hasCallback: !!onMapClick });
      if (enabled && onMapClick) {
        console.log("Calling onMapClick with:", e.latlng.lat, e.latlng.lng);
        onMapClick(e.latlng.lat, e.latlng.lng);
        if (onSet) {
          onSet();
        }
      }
    },
  });

  // This component doesn't render anything, it just handles events
  return null;
}

export default function MapView({ trajectory, startingPoint, onMapClick, onClearStartingPoint }: Props) {
  const [isClickMode, setIsClickMode] = useState(false);
  
  const toggleClickMode = () => {
    setIsClickMode(!isClickMode);
  };
  
  // Determine center: use trajectory, then starting point, then world center
  const defaultCenter: [number, number] = startingPoint 
    ? [startingPoint.lat, startingPoint.lon]
    : trajectory.length > 0
    ? [trajectory[0].lat, trajectory[0].lon]
    : [0, 0]; // World center as fallback
  
  const center: [number, number] = trajectory.length > 0 
    ? [trajectory[0].lat, trajectory[0].lon] 
    : defaultCenter;

  return (
    <div style={{ marginBottom: 16, borderRadius: 8, overflow: "hidden", border: "1px solid #ddd", position: "relative" }}>
      {isClickMode && (
        <div style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          background: "#3b82f6",
          color: "white",
          padding: "8px 16px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}>
          👆 Click on the map to set starting point
        </div>
      )}
      <div style={{
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 1000,
        display: "flex",
        gap: 8
      }}>
        <button
          onClick={toggleClickMode}
          style={{
            padding: "8px 12px",
            fontSize: 12,
            background: isClickMode ? "#ef4444" : "#6b7280",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500
          }}
        >
          {isClickMode ? "✕ Cancel" : "📍 Set Start Point"}
        </button>
      </div>
      <MapContainer
        center={center}
        zoom={trajectory.length > 0 ? 14 : startingPoint ? 12 : 2}
        style={{ height: "500px", width: "100%" }}
        scrollWheelZoom={true}
      >
        <MapClickHandler 
          onMapClick={onMapClick} 
          enabled={isClickMode}
          onSet={() => setIsClickMode(false)}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {trajectory.length > 1 && (
          <Polyline
            positions={trajectory.map((p) => [p.lat, p.lon] as [number, number])}
            pathOptions={{ color: "#3b82f6", weight: 4, opacity: 0.7 }}
          />
        )}

        {/* Show starting point marker if set */}
        {startingPoint && (
          <CircleMarker
            center={[startingPoint.lat, startingPoint.lon]}
            radius={8}
            pathOptions={{ color: "#8b5cf6", fillColor: "#8b5cf6", fillOpacity: 0.7, weight: 2 }}
          >
            <Popup>
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>Starting Point</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                  {startingPoint.lat.toFixed(6)}, {startingPoint.lon.toFixed(6)}
                </div>
                {onClearStartingPoint && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearStartingPoint();
                    }}
                    style={{
                      padding: "4px 8px",
                      fontSize: 11,
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer"
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )}

        {trajectory.length > 0 && (
          <>
            <CircleMarker
              center={[trajectory[0].lat, trajectory[0].lon]}
              radius={10}
              pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.7, weight: 2 }}
            >
              <Popup>Current Position</Popup>
            </CircleMarker>
            {trajectory.length > 1 && (
              <CircleMarker
                center={[trajectory[trajectory.length - 1].lat, trajectory[trajectory.length - 1].lon]}
                radius={6}
                pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.7, weight: 2 }}
              >
                <Popup>Start Point</Popup>
              </CircleMarker>
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}
