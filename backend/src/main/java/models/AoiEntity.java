package models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "aoi")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AoiEntity {

    @Id
    private String id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String polygonWkt;

    private boolean inside;
}
