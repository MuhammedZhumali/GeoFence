import { useState, useEffect, useRef, useCallback } from "react";
import MapView from "./component/MapView";
import ProbabilityCard from "./component/ProbabilityCard";
import TrajectoryPanel from "./component/TrajectorPlan";
import DeviceManager from "./component/DeviceManager";
import { sendTrajectoryPoint, getLatestTrajectory } from "./api/backend";
import { useGpsTracking } from "./hooks/useGpsTracking";

interface TrajectoryPoint {
  lat: number;
  lon: number;
  timestamp?: number;
}

interface Device {
  id: string;
  name: string;
  createdAt: number;
}

const DEVICE_STORAGE_KEY = "geo-fence-devices";

function generateDeviceId(): string {
  return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function App() {
  const [devices, setDevices] = useState<Device[]>(() => {
    const stored = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback to default device
      }
    }
    // Default device
    return [{
      id: "device42",
      name: "Default Device",
      createdAt: Date.now()
    }];
  });

  const [currentDeviceId, setCurrentDeviceId] = useState<string>(() => {
    return devices[0]?.id || "device42";
  });

  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [prob, setProb] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoTrackInterval, setAutoTrackInterval] = useState<number | null>(null);
  const [startingPoint, setStartingPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [showStartPointDialog, setShowStartPointDialog] = useState(false);
  
  const gps = useGpsTracking();
  const lastSentPositionRef = useRef<{ lat: number; lon: number } | null>(null);
  const autoTrackIntervalRef = useRef<number | null>(null);

  // Save devices to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(devices));
  }, [devices]);

  // Handle device creation
  const handleDeviceCreate = (name: string) => {
    const newDevice: Device = {
      id: generateDeviceId(),
      name,
      createdAt: Date.now()
    };
    setDevices([...devices, newDevice]);
    setCurrentDeviceId(newDevice.id);
  };

  // Handle device deletion
  const handleDeviceDelete = (deviceId: string) => {
    if (devices.length <= 1) {
      alert("Cannot delete the last device");
      return;
    }
    const updated = devices.filter(d => d.id !== deviceId);
    setDevices(updated);
    if (currentDeviceId === deviceId) {
      setCurrentDeviceId(updated[0].id);
    }
  };

  // Handle device change
  const handleDeviceChange = (deviceId: string) => {
    setCurrentDeviceId(deviceId);
  };

  // Send GPS point to backend
  const sendGpsPoint = useCallback(async (point: TrajectoryPoint) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await sendTrajectoryPoint(currentDeviceId, point);
      setProb(response.probability || 0);

      const updated = await getLatestTrajectory(currentDeviceId);
      setTrajectory(updated || []);
    } catch (err: any) {
      setError(err.message || "Failed to send GPS point");
      console.error("Error sending GPS point:", err);
    } finally {
      setLoading(false);
    }
  }, [currentDeviceId]);

  // Set starting point from current GPS
  const setStartPointFromGps = () => {
    if (gps.position) {
      setStartingPoint({ lat: gps.position.lat, lon: gps.position.lon });
      setShowStartPointDialog(false);
    } else {
      setError("No GPS position available. Please start GPS tracking first.");
    }
  };

  // Set starting point from map click
  const handleMapClick = (lat: number, lon: number) => {
    console.log("Map clicked at:", lat, lon);
    setStartingPoint({ lat, lon });
    setShowStartPointDialog(false);
    setError(null); // Clear any errors
  };

  // Clear starting point
  const clearStartingPoint = () => {
    setStartingPoint(null);
  };

  // Add random point (for simulation/testing)
  async function addRandomPoint() {
    setLoading(true);
    setError(null);
    
    try {
      // Require either existing trajectory or starting point
      const last = trajectory[0] ?? startingPoint;
      
      if (!last) {
        setError("Please set a starting point first, or use GPS tracking to get your current location.");
        setLoading(false);
        return;
      }

      const newPoint = {
        lat: last.lat + (Math.random() - 0.5) * 0.001,
        lon: last.lon + (Math.random() - 0.5) * 0.001,
        timestamp: Date.now()
      };

      await sendGpsPoint(newPoint);
      
      // Set starting point if this is the first point and no starting point was set
      if (!startingPoint && trajectory.length === 0) {
        setStartingPoint({ lat: newPoint.lat, lon: newPoint.lon });
      }
    } catch (err: any) {
      setError(err.message || "Failed to add trajectory point");
      console.error("Error adding point:", err);
    } finally {
      setLoading(false);
    }
  }

  // Auto-send GPS position when tracking
  useEffect(() => {
    if (gps.isTracking && gps.position) {
      const { lat, lon, timestamp } = gps.position;
      
      // Only send if position changed significantly (at least 5 meters) or it's the first position
      const shouldSend = !lastSentPositionRef.current || 
        (Math.abs(lat - lastSentPositionRef.current.lat) > 0.000045 || // ~5 meters
         Math.abs(lon - lastSentPositionRef.current.lon) > 0.000045);

      if (shouldSend) {
        sendGpsPoint({ lat, lon, timestamp });
        lastSentPositionRef.current = { lat, lon };
      }
    }
  }, [gps.position, gps.isTracking, sendGpsPoint]);

  // Auto-track interval
  useEffect(() => {
    if (autoTrackInterval !== null && gps.isTracking && gps.position) {
      // Clear existing interval
      if (autoTrackIntervalRef.current) {
        clearInterval(autoTrackIntervalRef.current);
      }

      // Set up new interval
      autoTrackIntervalRef.current = window.setInterval(() => {
        if (gps.position) {
          const { lat, lon, timestamp } = gps.position;
          sendGpsPoint({ lat, lon, timestamp });
        }
      }, autoTrackInterval * 1000);

      return () => {
        if (autoTrackIntervalRef.current) {
          window.clearInterval(autoTrackIntervalRef.current);
        }
      };
    } else {
      if (autoTrackIntervalRef.current) {
        window.clearInterval(autoTrackIntervalRef.current);
        autoTrackIntervalRef.current = null;
      }
    }
  }, [autoTrackInterval, gps.isTracking, gps.position, sendGpsPoint]);

  // Load trajectory when device changes
  useEffect(() => {
    async function loadTrajectory() {
      try {
        const data = await getLatestTrajectory(currentDeviceId);
        setTrajectory(data || []);
        setProb(0);
      } catch (err) {
        console.error("Error loading trajectory:", err);
        setTrajectory([]);
      }
    }
    loadTrajectory();
  }, [currentDeviceId]);

  return (
    <div style={{ 
      padding: 24, 
      maxWidth: 1200, 
      margin: "0 auto",
      minHeight: "100vh"
    }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontSize: 32, 
          fontWeight: "bold", 
          color: "#111827",
          marginBottom: 8
        }}>
          Geofence Prediction Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16 }}>
          Real-time trajectory monitoring and AOI intrusion prediction
        </p>
      </header>

      <DeviceManager
        devices={devices}
        currentDevice={currentDeviceId}
        onDeviceChange={handleDeviceChange}
        onDeviceCreate={handleDeviceCreate}
        onDeviceDelete={handleDeviceDelete}
      />

      <div style={{ 
        display: "flex", 
        gap: 16, 
        marginBottom: 24,
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        {/* GPS Tracking Controls */}
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: "12px 16px",
          background: gps.isTracking ? "#dcfce7" : "#f3f4f6",
          border: gps.isTracking ? "2px solid #10b981" : "1px solid #e5e7eb",
          borderRadius: 8
        }}>
          {!gps.isTracking ? (
            <button
              onClick={gps.startTracking}
              disabled={loading}
              style={{ 
                padding: "10px 20px", 
                fontSize: 14,
                fontWeight: 500,
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              📍 Start GPS Tracking
            </button>
          ) : (
            <>
              <button
                onClick={gps.stopTracking}
                style={{ 
                  padding: "10px 20px", 
                  fontSize: 14,
                  fontWeight: 500,
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                ⏹ Stop Tracking
              </button>
              {gps.position && (
                <div style={{ fontSize: 12, color: "#374151" }}>
                  <div>📍 {gps.position.lat.toFixed(6)}, {gps.position.lon.toFixed(6)}</div>
                  {gps.accuracy && (
                    <div style={{ color: "#6b7280" }}>Accuracy: ±{Math.round(gps.accuracy)}m</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Auto-track interval selector */}
        {gps.isTracking && (
          <div style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "12px 16px",
            background: "#f9fafb",
            borderRadius: 8,
            border: "1px solid #e5e7eb"
          }}>
            <label style={{ fontSize: 14, color: "#374151" }}>Auto-send every:</label>
            <select
              value={autoTrackInterval || ""}
              onChange={(e) => setAutoTrackInterval(e.target.value ? parseInt(e.target.value) : null)}
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="">Manual only</option>
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
            </select>
          </div>
        )}

        {/* Starting Point Controls */}
        <div style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: "12px 16px",
          background: startingPoint ? "#dbeafe" : "#f9fafb",
          borderRadius: 8,
          border: startingPoint ? "2px solid #3b82f6" : "1px solid #e5e7eb"
        }}>
          <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Start Point:</span>
          {startingPoint ? (
            <>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: "#6b7280" }}>
                {startingPoint.lat.toFixed(6)}, {startingPoint.lon.toFixed(6)}
              </span>
              <button
                onClick={clearStartingPoint}
                style={{
                  padding: "4px 8px",
                  fontSize: 11,
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  marginLeft: 4
                }}
                title="Clear starting point"
              >
                ✕
              </button>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Not set - required for simulation</span>
          )}
          <button
            onClick={() => setShowStartPointDialog(!showStartPointDialog)}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              marginLeft: 8
            }}
          >
            {showStartPointDialog ? "✕" : "⚙️ Set"}
          </button>
        </div>

        {/* Starting Point Dialog */}
        {showStartPointDialog && (
          <>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 1999
              }}
              onClick={() => setShowStartPointDialog(false)}
            />
            <div style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 2000,
              background: "white",
              padding: 24,
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              minWidth: 400,
              maxWidth: 500
            }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, color: "#374151" }}>Set Starting Point</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={setStartPointFromGps}
                disabled={!gps.position}
                style={{
                  padding: "12px 16px",
                  fontSize: 14,
                  background: gps.position ? "#10b981" : "#9ca3af",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: gps.position ? "pointer" : "not-allowed",
                  fontWeight: 500
                }}
              >
                📍 Use Current GPS Location
              </button>
              <div style={{ textAlign: "center", color: "#6b7280", fontSize: 12 }}>or</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  id="start-lat"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  id="start-lon"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 14
                  }}
                />
              </div>
              <button
                onClick={() => {
                  const latInput = document.getElementById("start-lat") as HTMLInputElement;
                  const lonInput = document.getElementById("start-lon") as HTMLInputElement;
                  const lat = parseFloat(latInput.value);
                  const lon = parseFloat(lonInput.value);
                  if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                    setStartingPoint({ lat, lon });
                    setShowStartPointDialog(false);
                  } else {
                    setError("Invalid coordinates. Latitude must be -90 to 90, Longitude must be -180 to 180.");
                  }
                }}
                style={{
                  padding: "12px 16px",
                  fontSize: 14,
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500
                }}
              >
                ✓ Set from Coordinates
              </button>
              <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 8 }}>
                💡 Tip: Click "📍 Set Start Point" on the map, then click anywhere on the map
              </div>
              {startingPoint && (
                <button
                  onClick={() => {
                    setStartingPoint(null);
                    setShowStartPointDialog(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    fontSize: 12,
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    marginTop: 8
                  }}
                >
                  Clear Starting Point
                </button>
              )}
            </div>
            </div>
          </>
        )}

        {/* Manual add point button */}
        <button
          onClick={addRandomPoint}
          disabled={loading || gps.isTracking}
          style={{ 
            padding: "12px 24px", 
            fontSize: 14,
            fontWeight: 500,
            background: (loading || gps.isTracking) ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: (loading || gps.isTracking) ? "not-allowed" : "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "background 0.2s"
          }}
        >
          {loading ? "Adding..." : "➕ Add Random Point (Simulate)"}
        </button>

        {/* Manual send current GPS position */}
        {gps.isTracking && gps.position && (
          <button
            onClick={() => {
              if (gps.position) {
                sendGpsPoint({
                  lat: gps.position.lat,
                  lon: gps.position.lon,
                  timestamp: gps.position.timestamp
                });
              }
            }}
            disabled={loading}
            style={{ 
              padding: "12px 24px", 
              fontSize: 14,
              fontWeight: 500,
              background: loading ? "#9ca3af" : "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            {loading ? "Sending..." : "📤 Send Current Position"}
          </button>
        )}
      </div>

      {(error || gps.error) && (
        <div style={{
          padding: 16,
          background: "#fee2e2",
          border: "1px solid #fca5a5",
          borderRadius: 8,
          color: "#991b1b",
          marginBottom: 16
        }}>
          ⚠️ Error: {error || gps.error}
        </div>
      )}

      <MapView 
        trajectory={trajectory} 
        startingPoint={startingPoint}
        onMapClick={handleMapClick}
        onClearStartingPoint={clearStartingPoint}
      />
      <ProbabilityCard probability={prob} />
      <TrajectoryPanel points={trajectory} />
    </div>
  );
}
