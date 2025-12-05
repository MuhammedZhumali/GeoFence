interface Point {
  lat: number;
  lon: number;
  timestamp?: number;
}

interface Props {
  points: Point[];
}

export default function TrajectoryPanel({ points }: Props) {
  const formatTimestamp = (ts?: number) => {
    if (!ts) return "N/A";
    return new Date(ts).toLocaleString();
  };

  return (
    <div style={{ 
      marginTop: 16, 
      background: "white", 
      borderRadius: 12, 
      padding: 20,
      border: "1px solid #e5e7eb",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h3 style={{ marginBottom: 16, color: "#374151" }}>Trajectory Points ({points.length})</h3>
      {points.length === 0 ? (
        <p style={{ color: "#6b7280", fontStyle: "italic" }}>No trajectory points yet. Click "Add random point" to start.</p>
      ) : (
        <div style={{ 
          maxHeight: "400px", 
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: 8
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f9fafb", position: "sticky", top: 0 }}>
              <tr>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb", color: "#374151" }}>#</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb", color: "#374151" }}>Latitude</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb", color: "#374151" }}>Longitude</th>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #e5e7eb", color: "#374151" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px", color: "#6b7280" }}>{i + 1}</td>
                  <td style={{ padding: "12px", fontFamily: "monospace", color: "#374151" }}>{p.lat.toFixed(6)}</td>
                  <td style={{ padding: "12px", fontFamily: "monospace", color: "#374151" }}>{p.lon.toFixed(6)}</td>
                  <td style={{ padding: "12px", color: "#6b7280", fontSize: "14px" }}>{formatTimestamp(p.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
