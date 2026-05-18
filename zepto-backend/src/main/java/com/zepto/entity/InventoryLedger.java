package com.zepto.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "inventory_ledger",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_inventory_ledger_warehouse_variant",
        columnNames = {"warehouse_id", "variant_id"}
    ),
    indexes = @Index(
        name = "idx_inventory_ledger_warehouse_variant",
        columnList = "warehouse_id, variant_id"
    )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"warehouse", "variant"})
public class InventoryLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "qty_on_hand", nullable = false)
    @Builder.Default
    private Integer qtyOnHand = 0;

    @Column(name = "qty_reserved", nullable = false)
    @Builder.Default
    private Integer qtyReserved = 0;

    @Column(name = "reorder_threshold", nullable = false)
    @Builder.Default
    private Integer reorderThreshold = 20;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    // Derived: not persisted — computed at read time
    @Transient
    public int getQtyAvailable() {
        return (qtyOnHand == null ? 0 : qtyOnHand) - (qtyReserved == null ? 0 : qtyReserved);
    }
}
