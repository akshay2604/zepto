package com.zepto.controller;

import com.zepto.dto.request.AddAddressRequest;
import com.zepto.dto.request.AssignWarehouseRequest;
import com.zepto.dto.request.RegisterUserRequest;
import com.zepto.dto.request.UpdateAddressRequest;
import com.zepto.dto.request.UpdateUserRequest;
import com.zepto.dto.response.AddressResponse;
import com.zepto.dto.response.OrderResponse;
import com.zepto.dto.response.UserResponse;
import com.zepto.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Users ─────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<UserResponse>> listUsers() {
        return ResponseEntity.ok(userService.listUsers());
    }

    @PostMapping
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterUserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @GetMapping("/by-phone/{phone}")
    public ResponseEntity<UserResponse> getByPhone(@PathVariable String phone) {
        return ResponseEntity.ok(userService.getUserByPhone(phone));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(userService.updateUser(id, req));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.deactivateUser(id));
    }

    // ── Warehouse assignment ──────────────────────────────────────────────────

    @PatchMapping("/{id}/warehouse")
    public ResponseEntity<UserResponse> assignWarehouse(
            @PathVariable UUID id,
            @Valid @RequestBody AssignWarehouseRequest req) {
        return ResponseEntity.ok(userService.assignWarehouse(id, req));
    }

    @DeleteMapping("/{id}/warehouse")
    public ResponseEntity<UserResponse> unassignWarehouse(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.unassignWarehouse(id));
    }

    // ── Addresses ─────────────────────────────────────────────────────────────

    @GetMapping("/{id}/addresses")
    public ResponseEntity<List<AddressResponse>> getAddresses(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getAddresses(id));
    }

    @PostMapping("/{id}/addresses")
    public ResponseEntity<AddressResponse> addAddress(
            @PathVariable UUID id,
            @Valid @RequestBody AddAddressRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.addAddress(id, req));
    }

    @PatchMapping("/{id}/addresses/{addressId}")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable UUID id,
            @PathVariable UUID addressId,
            @Valid @RequestBody UpdateAddressRequest req) {
        return ResponseEntity.ok(userService.updateAddress(id, addressId, req));
    }

    @DeleteMapping("/{id}/addresses/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable UUID id,
            @PathVariable UUID addressId) {
        userService.deleteAddress(id, addressId);
        return ResponseEntity.noContent().build();
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    @GetMapping("/{id}/orders")
    public ResponseEntity<List<OrderResponse>> getOrders(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getOrders(id));
    }
}
