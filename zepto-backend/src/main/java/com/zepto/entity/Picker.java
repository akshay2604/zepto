package com.zepto.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(
    name = "picker",
    indexes = @Index(name = "idx_picker_warehouse", columnList = "warehouse_id")
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "warehouse")
public class Picker {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 15)
    private String phone;

    @Builder.Default
    private boolean active = true;
}
