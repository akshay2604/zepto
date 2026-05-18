package com.zepto.catalog;

import lombok.Data;
import java.util.List;

@Data
public class CatalogCategory {
    private String name;
    private List<CatalogProduct> products;
}
