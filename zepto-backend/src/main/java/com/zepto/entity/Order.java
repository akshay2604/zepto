package com.zepto.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.zepto.entity.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "orders",
    indexes = {
        @Index(name = "idx_orders_user",   columnList = "user_id"),
        @Index(name = "idx_orders_status", columnList = "status")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = {"user", "warehouse", "address", "items", "payment", "delivery", "picker"})
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id", nullable = false)
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private OrderStatus status;

    @Column(name = "total_mrp", precision = 10, scale = 2)
    private BigDecimal totalMrp;

    @Column(name = "total_discount", precision = 10, scale = 2)
    private BigDecimal totalDiscount;

    @Column(name = "delivery_fee", precision = 10, scale = 2)
    private BigDecimal deliveryFee;

    @Column(name = "amount_payable", precision = 10, scale = 2)
    private BigDecimal amountPayable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "picker_id")
    private Picker picker;

    @Column(name = "placed_at", updatable = false)
    private LocalDateTime placedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    @JsonIgnore
    private List<OrderItem> items = new ArrayList<>();

    @OneToOne(mappedBy = "order", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private Payment payment;

    @OneToOne(mappedBy = "order", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private Delivery delivery;
}
