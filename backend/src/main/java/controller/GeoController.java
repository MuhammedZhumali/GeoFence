package controller;

import lombok.RequiredArgsConstructor;
import models.AoiEntity;
import models.PredictionResult;
import models.TrajectoryPoint;
import org.springframework.web.bind.annotation.*;
import service.AoiService;
import service.RedisTrajectoryService;
import service.TrajectoryService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class GeoController{
    private final TrajectoryService trajectoryService;
    private final RedisTrajectoryService redisService;
    private final AoiService aoiService;

    @GetMapping("/trajectory/{objectId}/latest")
    public List<TrajectoryPoint> getLatestTrajectory(@PathVariable String objectId){
        return redisService.getLast20(objectId);
    }

    @PostMapping("/trajectory/{objectId}/add")
    public PredictionResult addPoint(@PathVariable String objectId, @RequestBody TrajectoryPoint point){
        float p = trajectoryService.processNewPoint(objectId, point);
        return new PredictionResult(p);
    }

    @PostMapping("/trajectory/{objectId}/add-batch")
    public PredictionResult addBatch(@PathVariable String objectId, @RequestBody List<TrajectoryPoint> points){
        float lastProbability = 0f;
        for (TrajectoryPoint point : points) {
            lastProbability = trajectoryService.processNewPoint(objectId, point);
        }
        return new PredictionResult(lastProbability);
    }

    @PostMapping("/aoi")
    public AoiEntity createAoi(@RequestBody AoiEntity aoi){
        return aoiService.create(aoi.getName(), aoi.getPolygonWkt());
    }

    @GetMapping("/aoi")
    public List<AoiEntity> getAllAois(){
        return aoiService.getAll();
    }
}
