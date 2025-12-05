interface Props {
  probability: number;
}

export default function ProbabilityCard({ probability }: Props) {
  const pct = (probability * 100).toFixed(2);
  const percentage = parseFloat(pct);
  
  // Color based on probability
  const getColor = () => {
    if (percentage < 30) return "#10b981"; // green
    if (percentage < 70) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  const getStatus = () => {
    if (percentage < 30) return "Low Risk";
    if (percentage < 70) return "Medium Risk";
    return "High Risk";
  };

  return (
    <div style={{
      padding: 24,
      border: `2px solid ${getColor()}`,
      borderRadius: 12,
      marginTop: 16,
      background: "white",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    }}>
      <h3 style={{ marginBottom: 12, color: "#374151" }}>Intrusion Probability</h3>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <p style={{ 
          fontSize: 48, 
          fontWeight: "bold", 
          color: getColor(),
          margin: 0
        }}>
          {pct}%
        </p>
        <span style={{ 
          fontSize: 18, 
          color: "#6b7280",
          fontWeight: 500
        }}>
          {getStatus()}
        </span>
      </div>
      <div style={{ 
        marginTop: 16, 
        height: 8, 
        background: "#e5e7eb", 
        borderRadius: 4,
        overflow: "hidden"
      }}>
        <div style={{
          width: `${percentage}%`,
          height: "100%",
          background: getColor(),
          transition: "width 0.3s ease"
        }} />
      </div>
    </div>
  );
}
