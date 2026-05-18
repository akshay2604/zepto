package com.zepto.service;

import com.zepto.dto.request.*;
import com.zepto.dto.response.CategoryResponse;
import com.zepto.dto.response.ProductResponse;
import com.zepto.dto.response.VariantResponse;
import com.zepto.entity.*;
import com.zepto.repository.*;

import java.util.Map;
import java.util.stream.Collectors;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CatalogService {

    private final CategoryRepository        categoryRepository;
    private final ProductRepository         productRepository;
    private final ProductVariantRepository  variantRepository;
    private final WarehouseRepository       warehouseRepository;
    private final InventoryLedgerRepository ledgerRepository;

    // ── Categories ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CategoryResponse> listCategories() {
        return categoryRepository.findAll().stream().map(CatalogService::toCategoryResponse).toList();
    }

    public CategoryResponse createCategory(CreateCategoryRequest req) {
        Category parent = req.parentId() != null
                ? categoryRepository.findById(req.parentId())
                        .orElseThrow(() -> new EntityNotFoundException("Parent category not found: " + req.parentId()))
                : null;

        Category category = categoryRepository.save(Category.builder()
                .name(req.name())
                .parent(parent)
                .build());
        return toCategoryResponse(category);
    }

    // ── Products ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProductResponse> listProducts(UUID categoryId, UUID warehouseId) {
        List<Product> products = categoryId != null
                ? productRepository.findByCategoryIdAndActiveTrue(categoryId)
                : productRepository.findByActiveTrue();

        // One bulk ledger fetch for the warehouse avoids N+1 across variants
        Map<UUID, InventoryLedger> ledgerByVariant = warehouseId != null
                ? ledgerRepository.findByWarehouseId(warehouseId).stream()
                        .collect(Collectors.toMap(l -> l.getVariant().getId(), l -> l))
                : Map.of();

        return products.stream()
                .map(p -> toProductResponse(p, variantRepository.findByProductId(p.getId()), ledgerByVariant))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(UUID productId) {
        Product product = findProduct(productId);
        return toProductResponse(product, variantRepository.findByProductId(productId));
    }

    public ProductResponse createProduct(CreateProductRequest req) {
        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new EntityNotFoundException("Category not found: " + req.categoryId()));

        Product product = productRepository.save(Product.builder()
                .name(req.name())
                .brand(req.brand())
                .description(req.description())
                .category(category)
                .active(true)
                .build());

        log.info("[CATALOG] Product created: {}", product.getName());
        return toProductResponse(product, List.of());
    }

    public ProductResponse updateProduct(UUID productId, UpdateProductRequest req) {
        Product product = findProduct(productId);
        if (req.name()        != null) product.setName(req.name());
        if (req.brand()       != null) product.setBrand(req.brand());
        if (req.description() != null) product.setDescription(req.description());
        if (req.active()      != null) product.setActive(req.active());
        if (req.categoryId()  != null) {
            Category cat = categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new EntityNotFoundException("Category not found: " + req.categoryId()));
            product.setCategory(cat);
        }
        product = productRepository.save(product);
        return toProductResponse(product, variantRepository.findByProductId(productId));
    }

    public void deactivateProduct(UUID productId) {
        Product product = findProduct(productId);
        product.setActive(false);
        productRepository.save(product);
        variantRepository.findByProductId(productId).forEach(v -> {
            v.setAvailable(false);
            variantRepository.save(v);
        });
        log.info("[CATALOG] Product deactivated: {}", product.getName());
    }

    // ── Variants ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public VariantResponse getVariant(UUID variantId) {
        return toVariantResponse(findVariant(variantId));
    }

    public VariantResponse createVariant(UUID productId, CreateVariantRequest req) {
        Product product = findProduct(productId);

        if (variantRepository.findAll().stream()
                .anyMatch(v -> v.getSkuCode().equals(req.skuCode()))) {
            throw new IllegalStateException("SKU already exists: " + req.skuCode());
        }

        ProductVariant variant = variantRepository.save(ProductVariant.builder()
                .product(product)
                .skuCode(req.skuCode())
                .displayName(req.displayName())
                .packSize(req.packSize())
                .unit(req.unit())
                .mrp(req.mrp())
                .sellingPrice(req.sellingPrice())
                .imageUrl(req.imageUrl())
                .available(true)
                .build());

        // Bootstrap ledger entry in every active warehouse (qty=0)
        List<Warehouse> warehouses = warehouseRepository.findByActiveTrue();
        for (Warehouse wh : warehouses) {
            ledgerRepository.save(InventoryLedger.builder()
                    .warehouse(wh)
                    .variant(variant)
                    .qtyOnHand(0)
                    .qtyReserved(0)
                    .reorderThreshold(20)
                    .build());
        }

        log.info("[CATALOG] Variant {} created, {} ledger entries bootstrapped", req.skuCode(), warehouses.size());
        return toVariantResponse(variant);
    }

    public VariantResponse updateVariant(UUID variantId, UpdateVariantRequest req) {
        ProductVariant variant = findVariant(variantId);
        if (req.mrp()          != null) variant.setMrp(req.mrp());
        if (req.sellingPrice() != null) variant.setSellingPrice(req.sellingPrice());
        if (req.available()    != null) variant.setAvailable(req.available());
        if (req.imageUrl()     != null) variant.setImageUrl(req.imageUrl());
        return toVariantResponse(variantRepository.save(variant));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Product findProduct(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + id));
    }

    private ProductVariant findVariant(UUID id) {
        return variantRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Variant not found: " + id));
    }

    static CategoryResponse toCategoryResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(),
                c.getParent() != null ? c.getParent().getId() : null);
    }

    static ProductResponse toProductResponse(Product p, List<ProductVariant> variants) {
        return toProductResponse(p, variants, Map.of());
    }

    static ProductResponse toProductResponse(Product p, List<ProductVariant> variants,
                                              Map<UUID, InventoryLedger> ledgerByVariant) {
        return new ProductResponse(
                p.getId(), p.getName(), p.getBrand(), p.getDescription(),
                p.getCategory().getId(), p.getCategory().getName(), p.getActive(),
                variants.stream()
                        .map(v -> toVariantResponse(v, ledgerByVariant.get(v.getId())))
                        .toList()
        );
    }

    static VariantResponse toVariantResponse(ProductVariant v) {
        return toVariantResponse(v, null);
    }

    static VariantResponse toVariantResponse(ProductVariant v, InventoryLedger ledger) {
        Integer qty    = ledger != null ? ledger.getQtyAvailable() : null;
        Boolean inStock = qty != null ? qty > 0 : null;
        return new VariantResponse(v.getId(), v.getSkuCode(), v.getDisplayName(),
                v.getPackSize(), v.getUnit(), v.getMrp(), v.getSellingPrice(),
                v.getImageUrl(), v.getAvailable(), qty, inStock);
    }
}
