package com.zepto.entity;

import com.zepto.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "order")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // UNIQUE enforced by the DB column constraint (unique = true below)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(length = 50)
    private String method;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PaymentStatus status;

    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "gateway_txn_id", length = 100)
    private String gatewayTxnId;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
