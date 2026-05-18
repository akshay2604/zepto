package com.zepto.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zepto.catalog.CatalogCategory;
import com.zepto.catalog.CatalogProduct;
import com.zepto.catalog.CatalogRoot;
import com.zepto.catalog.CatalogSku;
import com.zepto.entity.*;
import com.zepto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeedDataService {

    private final WarehouseRepository       warehouseRepository;
    private final CategoryRepository        categoryRepository;
    private final ProductRepository         productRepository;
    private final ProductVariantRepository  productVariantRepository;
    private final InventoryLedgerRepository inventoryLedgerRepository;
    private final PickerRepository          pickerRepository;
    private final ObjectMapper              objectMapper;

    private static final List<Map<String, String>> PICKER_TEMPLATES = List.of(
        Map.of("name", "Ravi Kumar",   "phone", "+919876543210"),
        Map.of("name", "Priya Singh",  "phone", "+919876543211"),
        Map.of("name", "Arjun Verma",  "phone", "+919876543212")
    );

    private static final List<Map<String, Object>> WAREHOUSE_CONFIGS = List.of(
        Map.of(
            "name",    "Zepto Dark Store — Koramangala",
            "address", "No. 12, 5th Block, Koramangala",
            "city",    "Bengaluru",
            "pincode", "560034",
            "lat",     new BigDecimal("12.927900"),
            "lng",     new BigDecimal("77.627100")
        ),
        Map.of(
            "name",    "Zepto Dark Store — Indiranagar",
            "address", "No. 47, 12th Main Road, Indiranagar",
            "city",    "Bengaluru",
            "pincode", "560038",
            "lat",     new BigDecimal("12.978600"),
            "lng",     new BigDecimal("77.640800")
        ),
        Map.of(
            "name",    "Zepto Dark Store — HSR Layout",
            "address", "No. 8, 27th Main, Sector 2, HSR Layout",
            "city",    "Bengaluru",
            "pincode", "560102",
            "lat",     new BigDecimal("12.912200"),
            "lng",     new BigDecimal("77.644300")
        ),
        Map.of(
            "name",    "Zepto Dark Store — Whitefield",
            "address", "No. 3, ITPL Main Road, Whitefield",
            "city",    "Bengaluru",
            "pincode", "560066",
            "lat",     new BigDecimal("12.969600"),
            "lng",     new BigDecimal("77.750100")
        )
    );

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        if (warehouseRepository.count() > 0) {
            log.info("[SEED] Catalog already present — skipping.");
            return;
        }
        log.info("[SEED] Seeding catalog …");

        CatalogRoot catalog = loadCatalog();
        List<Warehouse>              warehouses = seedWarehouses();
        Map<String, Category>        categories = seedCategories(catalog);
        List<ProductVariant>         variants   = seedProducts(catalog, categories);
        seedInventory(warehouses, variants);
        seedPickers(warehouses);

        log.info("[SEED] Done — {} warehouse(s), {} variant(s) across {} category(ies).",
                 warehouses.size(), variants.size(), categories.size());
    }

    private CatalogRoot loadCatalog() {
        try {
            return objectMapper.readValue(
                new ClassPathResource("master-catalog.json").getInputStream(),
                CatalogRoot.class
            );
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load master-catalog.json", e);
        }
    }

    private List<Warehouse> seedWarehouses() {
        List<Warehouse> saved = new ArrayList<>();
        for (Map<String, Object> cfg : WAREHOUSE_CONFIGS) {
            Warehouse w = Warehouse.builder()
                    .name(    (String)     cfg.get("name"))
                    .address( (String)     cfg.get("address"))
                    .city(    (String)     cfg.get("city"))
                    .pincode( (String)     cfg.get("pincode"))
                    .lat(     (BigDecimal) cfg.get("lat"))
                    .lng(     (BigDecimal) cfg.get("lng"))
                    .active(true)
                    .build();
            saved.add(warehouseRepository.save(w));
        }
        return saved;
    }

    private Map<String, Category> seedCategories(CatalogRoot catalog) {
        Map<String, Category> map = new LinkedHashMap<>();
        for (CatalogCategory cc : catalog.getCategories()) {
            Category saved = categoryRepository.save(Category.builder().name(cc.getName()).build());
            map.put(cc.getName(), saved);
        }
        return map;
    }

    private List<ProductVariant> seedProducts(CatalogRoot catalog, Map<String, Category> categories) {
        List<ProductVariant> allVariants = new ArrayList<>();
        int skuCounter = 1;
        for (CatalogCategory cc : catalog.getCategories()) {
            Category category = categories.get(cc.getName());
            for (CatalogProduct cp : cc.getProducts()) {
                Product product = productRepository.save(Product.builder()
                        .name(cp.getName())
                        .brand(cp.getBrand())
                        .description(cp.getDescription())
                        .category(category)
                        .active(true)
                        .build());
                for (CatalogSku sku : cp.getSkus()) {
                    allVariants.add(buildAndSaveVariant(product, sku, skuCounter++));
                }
            }
        }
        return allVariants;
    }

    private ProductVariant buildAndSaveVariant(Product product, CatalogSku sku, int skuIndex) {
        BigDecimal mrp          = BigDecimal.valueOf(sku.getMrp());
        BigDecimal sellingPrice = mrp.multiply(BigDecimal.valueOf(0.95)).setScale(2, RoundingMode.HALF_UP);
        return productVariantRepository.save(ProductVariant.builder()
                .product(product)
                .skuCode(String.format("SKU-%05d", skuIndex))
                .displayName(product.getName() + " " + sku.getPackSize())
                .packSize(sku.getPackSize())
                .unit(sku.getUnit())
                .mrp(mrp)
                .sellingPrice(sellingPrice)
                .available(true)
                .build());
    }

    private void seedPickers(List<Warehouse> warehouses) {
        for (Warehouse warehouse : warehouses) {
            for (Map<String, String> tmpl : PICKER_TEMPLATES) {
                pickerRepository.save(Picker.builder()
                        .warehouse(warehouse)
                        .name(tmpl.get("name"))
                        .phone(tmpl.get("phone"))
                        .active(true)
                        .build());
            }
        }
    }

    private void seedInventory(List<Warehouse> warehouses, List<ProductVariant> variants) {
        Random rng = new Random();
        for (Warehouse warehouse : warehouses) {
            for (ProductVariant variant : variants) {
                inventoryLedgerRepository.save(InventoryLedger.builder()
                        .warehouse(warehouse)
                        .variant(variant)
                        .qtyOnHand(50 + rng.nextInt(151))
                        .qtyReserved(0)
                        .reorderThreshold(20)
                        .build());
            }
        }
    }
}
