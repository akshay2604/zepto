package com.zepto.controller;

import com.zepto.dto.request.*;
import com.zepto.dto.response.CategoryResponse;
import com.zepto.dto.response.ProductResponse;
import com.zepto.dto.response.VariantResponse;
import com.zepto.service.CatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    // ── Categories ────────────────────────────────────────────────────────────

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> listCategories() {
        return ResponseEntity.ok(catalogService.listCategories());
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createCategory(req));
    }

    // ── Products ──────────────────────────────────────────────────────────────

    /** Optional ?categoryId= and ?warehouseId=. When warehouseId is provided, variants include inStock + qtyAvailable. */
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> listProducts(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID warehouseId) {
        return ResponseEntity.ok(catalogService.listProducts(categoryId, warehouseId));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogService.getProduct(id));
    }

    @PostMapping("/products")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody CreateProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createProduct(req));
    }

    @PatchMapping("/products/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest req) {
        return ResponseEntity.ok(catalogService.updateProduct(id, req));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deactivateProduct(@PathVariable UUID id) {
        catalogService.deactivateProduct(id);
        return ResponseEntity.noContent().build();
    }

    // ── Variants ──────────────────────────────────────────────────────────────

    @GetMapping("/variants/{id}")
    public ResponseEntity<VariantResponse> getVariant(@PathVariable UUID id) {
        return ResponseEntity.ok(catalogService.getVariant(id));
    }

    @PostMapping("/products/{productId}/variants")
    public ResponseEntity<VariantResponse> createVariant(
            @PathVariable UUID productId,
            @Valid @RequestBody CreateVariantRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(catalogService.createVariant(productId, req));
    }

    @PatchMapping("/variants/{id}")
    public ResponseEntity<VariantResponse> updateVariant(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVariantRequest req) {
        return ResponseEntity.ok(catalogService.updateVariant(id, req));
    }
}
