package com.zepto.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "address")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
@ToString(exclude = "user")
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(length = 50)
    private String label;

    @Column(nullable = false, length = 300)
    private String line1;

    @Column(length = 300)
    private String line2;

    @Column(length = 10)
    private String pincode;

    @Column(length = 100)
    private String city;

    @Column(precision = 9, scale = 6)
    private BigDecimal lat;

    @Column(precision = 9, scale = 6)
    private BigDecimal lng;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean defaultAddress = false;
}
