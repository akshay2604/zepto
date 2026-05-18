package com.zepto.entity;

import com.zepto.entity.enums.ZoneType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "picker_zone",
    indexes = @Index(name = "idx_picker_zone_picker", columnList = "picker_id"),
    uniqueConstraints = @UniqueConstraint(name = "uq_picker_zone", columnNames = {"picker_id", "zone_type"})
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "picker")
public class PickerZone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "picker_id", nullable = false)
    private Picker picker;

    @Enumerated(EnumType.STRING)
    @Column(name = "zone_type", nullable = false, length = 20)
    private ZoneType zoneType;
}
