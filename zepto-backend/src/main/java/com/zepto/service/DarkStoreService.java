package com.zepto.service;

import com.zepto.dto.request.OnboardWarehouseRequest;
import com.zepto.dto.response.*;
import com.zepto.entity.*;
import com.zepto.entity.enums.ZoneType;
import com.zepto.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DarkStoreService {

    private final WarehouseRepository       warehouseRepository;
    private final PickerRepository          pickerRepository;
    private final PickerZoneRepository      pickerZoneRepository;
    private final RiderRepository           riderRepository;
    private final ZoneRepository            zoneRepository;
    private final InventoryLedgerRepository ledgerRepository;
    private final ProductVariantRepository  variantRepository;
    private final UserAccountRepository     userRepository;
    private final AddressRepository         addressRepository;
    private final OrderRepository           orderRepository;
    private final OrderItemRepository       orderItemRepository;
    private final PaymentRepository         paymentRepository;
    private final DeliveryRepository        deliveryRepository;
    private final PickBatchRepository       batchRepository;
    private final PickBatchItemRepository   batchItemRepository;
    private final PickBatchOrderRepository  batchOrderRepository;
    private final StockMovementRepository   stockMovementRepository;

    // ──────────────────────────────────────────────
    // Fake data pools
    // ──────────────────────────────────────────────

    private static final List<String> PICKER_NAMES = List.of(
        "Ravi Kumar", "Priya Singh", "Arjun Verma", "Anita Sharma", "Suresh Patel",
        "Deepa Nair", "Mohan Reddy", "Kavitha Iyer", "Ajay Gupta", "Vijay Rao"
    );

    private static final List<String> RIDER_NAMES = List.of(
        "Karthik Naidu", "Vikram Singh", "Amit Yadav", "Suraj Kumar", "Rahul Sharma",
        "Deepak Verma", "Sanjay Patel", "Vinod Nair", "Prasad Reddy", "Ganesh Iyer",
        "Rajesh Gupta", "Srinivas Rao", "Harish Pillai", "Devendra Chandra", "Lokesh Agarwal",
        "Naveen Joshi", "Praveen Naik", "Rakesh Pandey", "Mahesh Bhat", "Sathish Babu"
    );

    private static final List<String> CUSTOMER_FIRST = List.of(
        "Aishwarya", "Rohan", "Meera", "Arjun", "Divya", "Nikhil", "Sneha", "Kiran",
        "Pooja", "Rahul", "Preethi", "Siddharth", "Anjali", "Varun", "Lakshmi",
        "Aditya", "Swathi", "Rithvik", "Nandini", "Tarun"
    );

    private static final List<String> CUSTOMER_LAST = List.of(
        "Sharma", "Patel", "Rao", "Nair", "Reddy", "Iyer", "Gupta", "Singh",
        "Kumar", "Pillai", "Naidu", "Joshi", "Bhat", "Verma", "Mehta",
        "Agarwal", "Chandra", "Kulkarni", "Pandey", "Hegde"
    );

    private static final List<String> ADDRESS_TEMPLATES = List.of(
        "No. %d, 1st Cross, %s Main Road",
        "No. %d, 3rd Block, %s Layout",
        "%d, %s Nagar, 2nd Stage",
        "No. %d, %s Colony, 4th Main",
        "%d/A, %s Street, 1st Block",
        "No. %d, %s Extension, 5th Cross",
        "%d, %s Gardens, Phase 2",
        "No. %d, %s Residency, 2nd Floor"
    );

    private static final List<String> LOCALITY_NAMES = List.of(
        "Green", "Lake", "Garden", "Park", "Hill", "Palm", "Maple", "Oak",
        "River", "Sunrise", "Lotus", "Jasmine", "Silver", "Golden", "Blue"
    );

    private static final String[] KA_DISTRICT_CODES = {"01","02","03","04","05","41","50","51","52","53"};
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

    // Zone assignment pattern: picker[i] gets zones[i%4] + zones[(i+2)%4]
    private static final ZoneType[] ZONE_ROTATION = {
        ZoneType.PRODUCE, ZoneType.CHILLED, ZoneType.FROZEN, ZoneType.AMBIENT
    };

    // ──────────────────────────────────────────────
    // Onboard
    // ──────────────────────────────────────────────

    @Transactional
    public OnboardWarehouseResponse onboard(OnboardWarehouseRequest req) {
        Warehouse warehouse = warehouseRepository.save(Warehouse.builder()
                .name(req.name())
                .address(req.address())
                .city(req.city())
                .pincode(req.pincode())
                .lat(req.lat())
                .lng(req.lng())
                .active(true)
                .build());

        List<Zone> zones = seedZones(warehouse);
        List<Picker> pickers = seedPickers(warehouse, req.pickerCount(), zones);
        List<Rider> riders = seedRiders(warehouse, req.riderCount());
        List<UserAccount> customers = seedCustomers(warehouse, req.customerCount());
        int variantCount = seedInventory(warehouse);

        log.info("[DARK-STORE] Onboarded {} — {} pickers, {} riders, {} customers, {} variants",
                 warehouse.getName(), pickers.size(), riders.size(), customers.size(), variantCount);

        List<PickerResponse> pickerResponses = pickers.stream()
                .map(p -> PickerResponse.from(p, pickerZoneRepository.findByPickerId(p.getId())))
                .toList();

        List<RiderResponse> riderResponses = riders.stream()
                .map(RiderResponse::from)
                .toList();

        List<UserResponse> customerResponses = customers.stream()
                .map(u -> new UserResponse(
                        u.getId(), u.getName(), u.getPhone(), u.getEmail(),
                        u.getCreatedAt(), Boolean.TRUE.equals(u.getActive()),
                        warehouse.getId(), warehouse.getName()))
                .toList();

        return new OnboardWarehouseResponse(
                WarehouseService.toResponse(warehouse),
                pickerResponses,
                riderResponses,
                customerResponses,
                variantCount
        );
    }

    // ──────────────────────────────────────────────
    // Purge
    // ──────────────────────────────────────────────

    @Transactional
    public PurgeWarehouseResponse purge(UUID warehouseId) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new EntityNotFoundException("Warehouse not found: " + warehouseId));

        // 1. pick batches → items → batch-order links
        List<UUID> batchIds = batchRepository.findByWarehouseId(warehouseId)
                .stream().map(PickBatch::getId).toList();
        int batchCount = batchIds.size();
        if (!batchIds.isEmpty()) {
            batchItemRepository.deleteByBatchIdIn(batchIds);
            batchOrderRepository.deleteByBatchIdIn(batchIds);
            batchRepository.deleteAllById(batchIds);
        }

        // 2. orders → items, payments, deliveries
        List<UUID> orderIds = orderRepository.findByWarehouseId(warehouseId)
                .stream().map(Order::getId).toList();
        int orderCount = orderIds.size();
        if (!orderIds.isEmpty()) {
            orderItemRepository.deleteByOrderIdIn(orderIds);
            paymentRepository.deleteByOrderIdIn(orderIds);
            deliveryRepository.deleteByOrderIdIn(orderIds);
            orderRepository.deleteAllById(orderIds);
        }

        // 3. stock movements
        stockMovementRepository.deleteByWarehouseId(warehouseId);

        // 4. inventory ledgers
        List<InventoryLedger> ledgers = ledgerRepository.findByWarehouseId(warehouseId);
        int ledgerCount = ledgers.size();
        ledgerRepository.deleteByWarehouseId(warehouseId);

        // 5. picker zones → pickers
        List<Picker> pickers = pickerRepository.findByWarehouseId(warehouseId);
        int pickerCount = pickers.size();
        pickers.forEach(p -> pickerZoneRepository.deleteByPickerId(p.getId()));
        pickerRepository.deleteByWarehouseId(warehouseId);

        // 6. riders
        List<Rider> riders = riderRepository.findByWarehouseId(warehouseId);
        int riderCount = riders.size();
        riderRepository.deleteByWarehouseId(warehouseId);

        // 7. unassign customers
        List<UserAccount> customers = userRepository.findByWarehouseId(warehouseId);
        int customerCount = customers.size();
        userRepository.unassignWarehouse(warehouseId);

        // 8. zones
        zoneRepository.deleteByWarehouseId(warehouseId);

        // 9. warehouse itself
        String name = warehouse.getName();
        warehouseRepository.delete(warehouse);

        log.info("[DARK-STORE] Purged {} — {} orders, {} batches, {} pickers, {} riders, {} customers unassigned, {} ledgers",
                 name, orderCount, batchCount, pickerCount, riderCount, customerCount, ledgerCount);

        return new PurgeWarehouseResponse(
                warehouseId, name,
                orderCount, batchCount,
                pickerCount, riderCount,
                customerCount, ledgerCount
        );
    }

    // ──────────────────────────────────────────────
    // Private seeding helpers
    // ──────────────────────────────────────────────

    private List<Zone> seedZones(Warehouse warehouse) {
        record ZoneDef(String name, ZoneType type, int order, double x, double y, double w, double h) {}
        List<ZoneDef> defs = List.of(
            new ZoneDef("Produce", ZoneType.PRODUCE, 1, 0.0,  0.0,  0.25, 0.5),
            new ZoneDef("Chilled", ZoneType.CHILLED, 2, 0.0,  0.5,  0.25, 0.5),
            new ZoneDef("Frozen",  ZoneType.FROZEN,  3, 0.25, 0.0,  0.25, 1.0),
            new ZoneDef("Ambient", ZoneType.AMBIENT, 4, 0.5,  0.0,  0.5,  1.0)
        );
        return defs.stream()
                .map(d -> zoneRepository.save(Zone.builder()
                        .warehouse(warehouse).name(d.name()).zoneType(d.type())
                        .displayOrder(d.order()).x(d.x()).y(d.y()).w(d.w()).h(d.h())
                        .build()))
                .collect(Collectors.toList());
    }

    private List<Picker> seedPickers(Warehouse warehouse, int count, List<Zone> zones) {
        Random rng = new Random();
        List<Picker> saved = new ArrayList<>();
        Set<String> usedPhones = new HashSet<>();

        for (int i = 0; i < count; i++) {
            String name = PICKER_NAMES.get(i % PICKER_NAMES.size())
                    + (i >= PICKER_NAMES.size() ? " " + (i / PICKER_NAMES.size() + 1) : "");
            String phone = uniquePhone(rng, usedPhones, "+9198");

            Picker picker = pickerRepository.save(Picker.builder()
                    .warehouse(warehouse).name(name).phone(phone).active(true)
                    .build());

            // assign two zones: opposite quadrants for good coverage
            ZoneType primary   = ZONE_ROTATION[i % 4];
            ZoneType secondary = ZONE_ROTATION[(i + 2) % 4];
            pickerZoneRepository.save(PickerZone.builder().picker(picker).zoneType(primary).build());
            pickerZoneRepository.save(PickerZone.builder().picker(picker).zoneType(secondary).build());

            saved.add(picker);
        }
        return saved;
    }

    private List<Rider> seedRiders(Warehouse warehouse, int count) {
        Random rng = new Random();
        Set<String> usedPhones = new HashSet<>();
        Set<String> usedVehicles = new HashSet<>();
        List<Rider> saved = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            String name = RIDER_NAMES.get(i % RIDER_NAMES.size())
                    + (i >= RIDER_NAMES.size() ? " " + (i / RIDER_NAMES.size() + 1) : "");
            String phone   = uniquePhone(rng, usedPhones, "+9197");
            String vehicle = uniqueVehicle(rng, usedVehicles);

            saved.add(riderRepository.save(Rider.builder()
                    .name(name).phone(phone).vehicleNumber(vehicle)
                    .warehouse(warehouse).active(true)
                    .build()));
        }
        return saved;
    }

    private List<UserAccount> seedCustomers(Warehouse warehouse, int count) {
        Random rng = new Random();
        Set<String> usedPhones = new HashSet<>();
        List<UserAccount> saved = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            String firstName = CUSTOMER_FIRST.get(rng.nextInt(CUSTOMER_FIRST.size()));
            String lastName  = CUSTOMER_LAST.get(rng.nextInt(CUSTOMER_LAST.size()));
            String name      = firstName + " " + lastName;
            String phone     = uniquePhone(rng, usedPhones, "+9196");
            String email     = firstName.toLowerCase() + "." + lastName.toLowerCase()
                               + rng.nextInt(9999) + "@gmail.com";

            UserAccount user = userRepository.save(UserAccount.builder()
                    .name(name).phone(phone).email(email)
                    .warehouse(warehouse).active(true)
                    .createdAt(LocalDateTime.now())
                    .build());

            // generate a realistic address near the warehouse
            String locality  = LOCALITY_NAMES.get(rng.nextInt(LOCALITY_NAMES.size()));
            String template  = ADDRESS_TEMPLATES.get(rng.nextInt(ADDRESS_TEMPLATES.size()));
            String line1     = String.format(template, 10 + rng.nextInt(200), locality);
            BigDecimal lat   = warehouse.getLat().add(randomOffset(rng));
            BigDecimal lng   = warehouse.getLng().add(randomOffset(rng));

            addressRepository.save(Address.builder()
                    .user(user)
                    .label("Home")
                    .line1(line1)
                    .pincode(warehouse.getPincode())
                    .city(warehouse.getCity())
                    .lat(lat)
                    .lng(lng)
                    .defaultAddress(true)
                    .build());

            saved.add(user);
        }
        return saved;
    }

    private int seedInventory(Warehouse warehouse) {
        Random rng = new Random();
        List<ProductVariant> variants = variantRepository.findByAvailableTrue();
        for (ProductVariant variant : variants) {
            ledgerRepository.save(InventoryLedger.builder()
                    .warehouse(warehouse)
                    .variant(variant)
                    .qtyOnHand(50 + rng.nextInt(151))
                    .qtyReserved(0)
                    .reorderThreshold(20)
                    .build());
        }
        return variants.size();
    }

    // ──────────────────────────────────────────────
    // Utility
    // ──────────────────────────────────────────────

    private String uniquePhone(Random rng, Set<String> used, String prefix) {
        String phone;
        int attempts = 0;
        do {
            phone = prefix + String.format("%07d", rng.nextInt(10_000_000));
            attempts++;
            if (attempts > 1000) throw new IllegalStateException("Cannot generate unique phone");
        } while (used.contains(phone) || userRepository.existsByPhone(phone));
        used.add(phone);
        return phone;
    }

    private String uniqueVehicle(Random rng, Set<String> used) {
        String vehicle;
        int attempts = 0;
        do {
            String district = KA_DISTRICT_CODES[rng.nextInt(KA_DISTRICT_CODES.length)];
            char l1 = ALPHABET.charAt(rng.nextInt(ALPHABET.length()));
            char l2 = ALPHABET.charAt(rng.nextInt(ALPHABET.length()));
            vehicle = "KA-" + district + "-" + l1 + l2 + "-" + (1000 + rng.nextInt(9000));
            attempts++;
            if (attempts > 1000) throw new IllegalStateException("Cannot generate unique vehicle number");
        } while (used.contains(vehicle));
        used.add(vehicle);
        return vehicle;
    }

    private BigDecimal randomOffset(Random rng) {
        // ±0.005 degrees ≈ ±550m
        double offset = (rng.nextDouble() - 0.5) * 0.01;
        return BigDecimal.valueOf(offset).setScale(6, java.math.RoundingMode.HALF_UP);
    }
}
