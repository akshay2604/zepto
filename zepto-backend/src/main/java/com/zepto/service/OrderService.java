package com.zepto.service;

import com.zepto.dto.request.PlaceOrderRequest;
import com.zepto.dto.response.AddressResponse;
import com.zepto.dto.response.OrderResponse;
import com.zepto.dto.response.PagedResponse;
import com.zepto.dto.OrderEventDto;
import com.zepto.entity.*;
import com.zepto.entity.enums.MovementType;
import com.zepto.entity.enums.OrderStatus;
import com.zepto.entity.enums.PaymentStatus;
import com.zepto.repository.*;
import com.zepto.sse.SseEmitterService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OrderService {

    private final UserAccountRepository     userRepository;
    private final AddressRepository         addressRepository;
    private final WarehouseRepository       warehouseRepository;
    private final ProductVariantRepository  variantRepository;
    private final InventoryLedgerRepository ledgerRepository;
    private final OrderRepository           orderRepository;
    private final OrderItemRepository       orderItemRepository;
    private final PaymentRepository         paymentRepository;
    private final StockMovementRepository   stockMovementRepository;
    private final SseEmitterService         sseEmitterService;

    private static final BigDecimal FREE_DELIVERY_THRESHOLD = new BigDecimal("199");
    private static final BigDecimal DELIVERY_FEE            = new BigDecimal("25.00");

    public OrderResponse placeOrder(PlaceOrderRequest req) {
        UserAccount user = userRepository.findById(req.userId())
                .filter(UserAccount::getActive)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + req.userId()));

        Address address = addressRepository.findById(req.addressId())
                .orElseThrow(() -> new EntityNotFoundException("Address not found: " + req.addressId()));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Address does not belong to this user");
        }

        Warehouse warehouse = warehouseRepository.findById(req.warehouseId())
                .filter(Warehouse::getActive)
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found: " + req.warehouseId()));

        // Reserve inventory and collect line item data
        BigDecimal totalMrp      = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        List<LineDraft> drafts   = new ArrayList<>();

        for (PlaceOrderRequest.LineItem line : req.items()) {
            ProductVariant variant = variantRepository.findById(line.variantId())
                    .filter(ProductVariant::getAvailable)
                    .orElseThrow(() -> new EntityNotFoundException("Variant not found: " + line.variantId()));

            InventoryLedger ledger = ledgerRepository
                    .findByWarehouseIdAndVariantIdWithLock(warehouse.getId(), variant.getId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "No inventory record for SKU " + variant.getSkuCode() + " in this warehouse"));

            if (ledger.getQtyAvailable() < line.qty()) {
                throw new IllegalStateException(
                        "Insufficient stock for " + variant.getDisplayName()
                        + " — available: " + ledger.getQtyAvailable()
                        + ", requested: " + line.qty());
            }

            ledger.setQtyReserved(ledger.getQtyReserved() + line.qty());
            ledger.setLastUpdated(LocalDateTime.now());
            ledgerRepository.save(ledger);

            stockMovementRepository.save(StockMovement.builder()
                    .warehouse(warehouse)
                    .variant(variant)
                    .movementType(MovementType.ORDER_RESERVE)
                    .qtyDelta(-line.qty())
                    .build());

            BigDecimal mrpLine  = variant.getMrp().multiply(BigDecimal.valueOf(line.qty()));
            BigDecimal sellLine = variant.getSellingPrice().multiply(BigDecimal.valueOf(line.qty()));
            totalMrp      = totalMrp.add(mrpLine);
            totalDiscount = totalDiscount.add(mrpLine.subtract(sellLine));
            drafts.add(new LineDraft(variant, line.qty(), variant.getSellingPrice(), sellLine));
        }

        BigDecimal subtotal     = totalMrp.subtract(totalDiscount);
        BigDecimal deliveryFee  = subtotal.compareTo(FREE_DELIVERY_THRESHOLD) >= 0
                ? BigDecimal.ZERO : DELIVERY_FEE;
        BigDecimal amountPayable = subtotal.add(deliveryFee);

        Order order = orderRepository.save(Order.builder()
                .user(user)
                .warehouse(warehouse)
                .address(address)
                .status(OrderStatus.PLACED)
                .totalMrp(totalMrp)
                .totalDiscount(totalDiscount)
                .deliveryFee(deliveryFee)
                .amountPayable(amountPayable)
                .build());

        List<OrderItem> items = drafts.stream().map(d ->
                orderItemRepository.save(OrderItem.builder()
                        .order(order)
                        .variant(d.variant())
                        .qty(d.qty())
                        .unitPrice(d.unitPrice())
                        .lineTotal(d.lineTotal())
                        .build())
        ).toList();

        Payment payment = paymentRepository.save(Payment.builder()
                .order(order)
                .method(req.paymentMethod())
                .status(PaymentStatus.PENDING)
                .amount(amountPayable)
                .build());

        sseEmitterService.publish("orders", "order-update", new OrderEventDto(
                order.getId(), user.getName(), order.getStatus(), amountPayable,
                items.size(), warehouse.getId(), warehouse.getName(), null, order.getPlacedAt()
        ));

        log.info("[ORDER] {} placed by {} | {} items | ₹{}", order.getId(), user.getName(), items.size(), amountPayable);
        return buildResponse(order, user, warehouse, address, items, payment);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + id));
        return toResponse(order);
    }

    @Transactional(readOnly = true)
    public PagedResponse<OrderResponse> listOrders(
            OrderStatus status, List<OrderStatus> statuses, UUID warehouseId, UUID userId,
            LocalDateTime from, LocalDateTime to, int page, int size) {

        Specification<Order> spec = Specification.where(null);
        if (statuses != null && !statuses.isEmpty()) {
            spec = spec.and((r, q, cb) -> r.get("status").in(statuses));
        } else if (status != null) {
            spec = spec.and((r, q, cb) -> cb.equal(r.get("status"), status));
        }
        if (warehouseId != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("warehouse").get("id"), warehouseId));
        if (userId      != null) spec = spec.and((r, q, cb) -> cb.equal(r.get("user").get("id"), userId));
        if (from        != null) spec = spec.and((r, q, cb) -> cb.greaterThanOrEqualTo(r.get("placedAt"), from));
        if (to          != null) spec = spec.and((r, q, cb) -> cb.lessThanOrEqualTo(r.get("placedAt"), to));

        Page<Order> result = orderRepository.findAll(spec,
                PageRequest.of(page, size, Sort.by("placedAt").descending()));

        return new PagedResponse<>(
                result.map(this::toResponse).getContent(),
                result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages()
        );
    }

    // Loads all lazy associations within the current transaction — used by UserService too.
    OrderResponse toResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        return buildResponse(order, order.getUser(), order.getWarehouse(), order.getAddress(), items, payment);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private static OrderResponse buildResponse(Order o, UserAccount user, Warehouse wh,
                                               Address addr, List<OrderItem> items, Payment payment) {
        return new OrderResponse(
                o.getId(),
                o.getStatus(),
                new OrderResponse.UserSummary(user.getId(), user.getName(), user.getPhone()),
                new OrderResponse.WarehouseSummary(wh.getId(), wh.getName(), wh.getCity()),
                UserService.toAddressResponse(addr),
                items.stream().map(i -> new OrderResponse.ItemLine(
                        i.getVariant().getId(),
                        i.getVariant().getDisplayName(),
                        i.getVariant().getSkuCode(),
                        i.getVariant().getProduct().getCategory().getName(),
                        i.getQty(),
                        i.getUnitPrice(),
                        i.getLineTotal()
                )).toList(),
                o.getTotalMrp(),
                o.getTotalDiscount(),
                o.getDeliveryFee(),
                o.getAmountPayable(),
                payment != null ? payment.getMethod() : null,
                payment != null ? payment.getStatus() : null,
                o.getPlacedAt()
        );
    }

    private record LineDraft(ProductVariant variant, int qty, BigDecimal unitPrice, BigDecimal lineTotal) {}
}
