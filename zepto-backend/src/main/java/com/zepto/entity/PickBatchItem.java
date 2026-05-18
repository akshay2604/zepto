package com.zepto.entity;

import com.zepto.entity.enums.ZoneType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "pick_batch_item",
    indexes = @Index(name = "idx_pbi_batch_picked", columnList = "batch_id, picked")
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"batch", "order", "orderItem", "variant"})
public class PickBatchItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private PickBatch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Enumerated(EnumType.STRING)
    @Column(name = "zone_type", nullable = false, columnDefinition = "zone_type_enum")
    private ZoneType zoneType;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(nullable = false)
    private Integer qty;

    @Column(nullable = false)
    @Builder.Default
    private boolean picked = false;

    @Column(name = "picked_at")
    private LocalDateTime pickedAt;
}
