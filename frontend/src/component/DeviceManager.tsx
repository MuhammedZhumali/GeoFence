import { useState } from "react";

interface Device {
  id: string;
  name: string;
  createdAt: number;
}

interface Props {
  devices: Device[];
  currentDevice: string;
  onDeviceChange: (deviceId: string) => void;
  onDeviceCreate: (name: string) => void;
  onDeviceDelete: (deviceId: string) => void;
}

export default function DeviceManager({
  devices,
  currentDevice,
  onDeviceChange,
  onDeviceCreate,
  onDeviceDelete,
}: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");

  const handleCreate = () => {
    if (newDeviceName.trim()) {
      onDeviceCreate(newDeviceName.trim());
      setNewDeviceName("");
      setShowCreate(false);
    }
  };

  return (
    <div style={{
      background: "white",
      borderRadius: 12,
      padding: 20,
      border: "1px solid #e5e7eb",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      marginBottom: 24
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: "#374151" }}>Device Management</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500
          }}
        >
          {showCreate ? "✕ Cancel" : "+ New Device"}
        </button>
      </div>

      {showCreate && (
        <div style={{
          padding: 16,
          background: "#f9fafb",
          borderRadius: 8,
          marginBottom: 16,
          display: "flex",
          gap: 8,
          alignItems: "center"
        }}>
          <input
            type="text"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            placeholder="Device name (e.g., iPhone 14, Car GPS)"
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 14
            }}
            onKeyPress={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            onClick={handleCreate}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Create
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {devices.map((device) => (
          <div
            key={device.id}
            style={{
              padding: "12px 16px",
              background: currentDevice === device.id ? "#dbeafe" : "#f3f4f6",
              border: currentDevice === device.id ? "2px solid #3b82f6" : "1px solid #e5e7eb",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onClick={() => onDeviceChange(device.id)}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: currentDevice === device.id ? 600 : 500,
                color: "#374151",
                fontSize: 14
              }}>
                {device.name}
              </div>
              <div style={{
                fontSize: 12,
                color: "#6b7280",
                fontFamily: "monospace"
              }}>
                {device.id}
              </div>
            </div>
            {currentDevice === device.id && (
              <span style={{
                fontSize: 12,
                color: "#3b82f6",
                fontWeight: 600
              }}>
                Active
              </span>
            )}
            {devices.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete device "${device.name}"?`)) {
                    onDeviceDelete(device.id);
                  }
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

