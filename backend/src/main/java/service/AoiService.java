package service;

import lombok.RequiredArgsConstructor;
import models.AoiEntity;
import org.springframework.stereotype.Service;
import repository.AoiRepository;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AoiService {
    private final AoiRepository aoiRepository;

    public AoiEntity create(String name, String wktPolygon){
        AoiEntity aoi = new AoiEntity(UUID.randomUUID().toString(), name, wktPolygon, false);
        return aoiRepository.save(aoi);
    }

    public List<AoiEntity> getAll(){
        return aoiRepository.findAll();
    }

    public boolean isInsideAoi(String aoiId){
        return aoiRepository.findById(aoiId)
                .map(AoiEntity::isInside)
                .orElseThrow(() -> new IllegalArgumentException("AOI not found"));
    }
}