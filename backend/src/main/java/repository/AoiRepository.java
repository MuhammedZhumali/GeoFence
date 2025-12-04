package repository;

import models.AoiEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AoiRepository extends JpaRepository<AoiEntity, String> {
    // Custom database queries can be defined here if needed
}