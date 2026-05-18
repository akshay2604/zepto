package com.zepto.catalog;

import lombok.Data;
import java.util.List;

@Data
public class CatalogRoot {
    private List<CatalogCategory> categories;
}
