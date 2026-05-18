package com.zepto.entity;

import com.zepto.entity.enums.ZoneType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "zone",
    indexes = @Index(name = "idx_zone_warehouse", columnList = "warehouse_id")
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "warehouse")
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "zone_type", nullable = false, length = 20)
    private ZoneType zoneType;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    /** Floor plan coordinates — fraction of canvas (0.0–1.0) */
    private double x;
    private double y;
    private double w;
    private double h;
}
