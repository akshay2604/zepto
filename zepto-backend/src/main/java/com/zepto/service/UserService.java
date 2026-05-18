package com.zepto.service;

import com.zepto.dto.request.AddAddressRequest;
import com.zepto.dto.request.AssignWarehouseRequest;
import com.zepto.dto.request.RegisterUserRequest;
import com.zepto.dto.request.UpdateAddressRequest;
import com.zepto.dto.request.UpdateUserRequest;
import com.zepto.dto.response.AddressResponse;
import com.zepto.dto.response.OrderResponse;
import com.zepto.dto.response.UserResponse;
import com.zepto.entity.Address;
import com.zepto.entity.UserAccount;
import com.zepto.entity.Warehouse;
import com.zepto.repository.AddressRepository;
import com.zepto.repository.OrderRepository;
import com.zepto.repository.UserAccountRepository;
import com.zepto.repository.WarehouseRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserAccountRepository userRepository;
    private final AddressRepository     addressRepository;
    private final OrderRepository       orderRepository;
    private final OrderService          orderService;
    private final WarehouseRepository   warehouseRepository;

    // ── Users ─────────────────────────────────────────────────────────────────

    public UserResponse register(RegisterUserRequest req) {
        if (userRepository.existsByPhone(req.phone())) {
            throw new IllegalStateException("Phone " + req.phone() + " is already registered");
        }
        return toUserResponse(userRepository.save(UserAccount.builder()
                .name(req.name()).phone(req.phone()).email(req.email()).active(true).build()));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findByActiveTrue().stream()
                .map(UserService::toUserResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(UUID id) {
        return toUserResponse(findUser(id));
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByPhone(String phone) {
        return userRepository.findByPhone(phone)
                .map(UserService::toUserResponse)
                .orElseThrow(() -> new EntityNotFoundException("No user with phone: " + phone));
    }

    public UserResponse updateUser(UUID id, UpdateUserRequest req) {
        UserAccount user = findUser(id);
        if (req.name()  != null) user.setName(req.name());
        if (req.email() != null) user.setEmail(req.email());
        return toUserResponse(userRepository.save(user));
    }

    public UserResponse deactivateUser(UUID id) {
        UserAccount user = findUser(id);
        user.setActive(false);
        return toUserResponse(userRepository.save(user));
    }

    // ── Addresses ─────────────────────────────────────────────────────────────

    public AddressResponse addAddress(UUID userId, AddAddressRequest req) {
        UserAccount user = findUser(userId);
        if (req.isDefault()) demoteCurrentDefault(userId);
        return toAddressResponse(addressRepository.save(Address.builder()
                .user(user).label(req.label()).line1(req.line1()).line2(req.line2())
                .pincode(req.pincode()).city(req.city()).lat(req.lat()).lng(req.lng())
                .defaultAddress(req.isDefault()).build()));
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses(UUID userId) {
        findUser(userId);
        return addressRepository.findByUserId(userId).stream().map(UserService::toAddressResponse).toList();
    }

    public AddressResponse updateAddress(UUID userId, UUID addressId, UpdateAddressRequest req) {
        findUser(userId);
        Address address = findAddress(userId, addressId);
        if (req.label()     != null) address.setLabel(req.label());
        if (req.line1()     != null) address.setLine1(req.line1());
        if (req.line2()     != null) address.setLine2(req.line2());
        if (req.pincode()   != null) address.setPincode(req.pincode());
        if (req.city()      != null) address.setCity(req.city());
        if (req.lat()       != null) address.setLat(req.lat());
        if (req.lng()       != null) address.setLng(req.lng());
        if (req.isDefault() != null && req.isDefault()) {
            demoteCurrentDefault(userId);
            address.setDefaultAddress(true);
        }
        return toAddressResponse(addressRepository.save(address));
    }

    public void deleteAddress(UUID userId, UUID addressId) {
        findUser(userId);
        Address address = findAddress(userId, addressId);
        addressRepository.delete(address);
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders(UUID userId) {
        findUser(userId);
        return orderRepository.findByUserIdOrderByPlacedAtDesc(userId).stream()
                .map(orderService::toResponse).toList();
    }

    // ── Warehouse assignment ──────────────────────────────────────────────────

    public UserResponse assignWarehouse(UUID userId, AssignWarehouseRequest req) {
        UserAccount user = findUser(userId);
        Warehouse warehouse = warehouseRepository.findById(req.warehouseId())
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found: " + req.warehouseId()));
        user.setWarehouse(warehouse);
        return toUserResponse(userRepository.save(user));
    }

    public UserResponse unassignWarehouse(UUID userId) {
        UserAccount user = findUser(userId);
        user.setWarehouse(null);
        return toUserResponse(userRepository.save(user));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserAccount findUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }

    private Address findAddress(UUID userId, UUID addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new EntityNotFoundException("Address not found: " + addressId));
        if (!address.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Address does not belong to user");
        }
        return address;
    }

    private void demoteCurrentDefault(UUID userId) {
        addressRepository.findByUserIdAndDefaultAddressTrue(userId).ifPresent(a -> {
            a.setDefaultAddress(false);
            addressRepository.save(a);
        });
    }

    static UserResponse toUserResponse(UserAccount u) {
        Warehouse w = u.getWarehouse();
        return new UserResponse(
                u.getId(), u.getName(), u.getPhone(), u.getEmail(),
                u.getCreatedAt(), u.getActive(),
                w != null ? w.getId() : null,
                w != null ? w.getName() : null);
    }

    static AddressResponse toAddressResponse(Address a) {
        return new AddressResponse(a.getId(), a.getLabel(), a.getLine1(), a.getLine2(),
                a.getPincode(), a.getCity(), a.getLat(), a.getLng(), a.getDefaultAddress());
    }
}
