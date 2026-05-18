package com.zepto.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.zepto.entity.enums.BatchStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "pick_batch",
    indexes = @Index(name = "idx_pick_batch_warehouse_status", columnList = "warehouse_id, status")
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"warehouse", "picker", "batchOrders", "items"})
public class PickBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "picker_id")
    private Picker picker;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BatchStatus status = BatchStatus.PENDING;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "batch", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private List<PickBatchOrder> batchOrders = new ArrayList<>();

    @OneToMany(mappedBy = "batch", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    @JsonIgnore
    private List<PickBatchItem> items = new ArrayList<>();
}
