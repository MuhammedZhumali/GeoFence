package service;

import lombok.RequiredArgsConstructor;
import models.TrajectoryPoint;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TrajectoryService {

    private final RedisTrajectoryService redisService;
    private final MlInferenceService mlService;

    public float processNewPoint(String objectId, TrajectoryPoint point) {
        redisService.addPoint(objectId, point);

        var last20 = redisService.getLast20(objectId);

        if (last20.size() < 20) {
            return 0f;
        }

        // Sort by timestamp to ensure chronological order (oldest to newest)
        // Redis leftPush stores newest first, but model expects oldest first
        var sorted = last20.stream()
                .sorted((a, b) -> Long.compare(a.getTimestamp(), b.getTimestamp()))
                .toList();

        float[][] input = sorted.stream()
                .map(p -> new float[]{(float) p.getLat(), (float) p.getLon()})
                .toArray(float[][]::new);

        return mlService.predict(input);
    }
}
