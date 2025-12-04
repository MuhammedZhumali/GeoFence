package service;

import models.TrajectoryPoint;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RedisTrajectoryService {
    private final StringRedisTemplate redisTemplate;

    public RedisTrajectoryService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    private String key(String objectId){
        return "trajectory:" + objectId;
    }

    public void addPoint(String objectId, TrajectoryPoint point){
        String json = point.toJson();

        redisTemplate.opsForList().leftPush(key(objectId), json);
        redisTemplate.opsForList().trim(key(objectId), 0, 19); //keep for 20 days
    }

    public List<TrajectoryPoint> getLast20(String objectId){
        List<String> raw = redisTemplate.opsForList().range(key(objectId), 0, 19);
        if (raw == null) {
            return List.of();
        }
        return raw.stream().map(TrajectoryPoint::fromJson).toList();
    }
}   