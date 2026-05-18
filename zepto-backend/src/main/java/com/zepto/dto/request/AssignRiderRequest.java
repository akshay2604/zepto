package com.zepto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AssignRiderRequest(

        @NotBlank @Size(max = 100)
        String riderName,

        @NotBlank @Pattern(regexp = "\\+91[0-9]{10}", message = "Phone must be in format +91XXXXXXXXXX")
        String riderPhone
) {}
