package com.zepto.catalog;

import lombok.Data;
import java.util.List;

@Data
public class CatalogProduct {
    private String name;
    private String brand;
    private String description;
    private String imageUrl;
    private List<CatalogSku> skus;
}
