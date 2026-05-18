package com.zepto.catalog;

import com.zepto.entity.enums.ZoneType;
import lombok.Data;
import java.util.List;

@Data
public class CatalogCategory {
    private String name;
    private ZoneType zoneType;
    private List<CatalogProduct> products;
}
