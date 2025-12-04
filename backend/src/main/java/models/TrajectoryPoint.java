package models;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TrajectoryPoint {
    private double lat;
    private double lon;
    private long timestamp;

    public String toJson() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.writeValueAsString(this);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize TrajectoryPoint to JSON", e);
        }
    }

    public static TrajectoryPoint fromJson(String json) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(json, TrajectoryPoint.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize TrajectoryPoint from JSON", e);
        }
    }
}