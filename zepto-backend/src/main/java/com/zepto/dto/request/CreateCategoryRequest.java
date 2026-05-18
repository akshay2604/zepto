package com.zepto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateCategoryRequest(

        @NotBlank @Size(max = 100) String name,
        UUID parentId   // null = top-level category
) {}
