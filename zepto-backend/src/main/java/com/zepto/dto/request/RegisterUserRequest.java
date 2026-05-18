package com.zepto.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterUserRequest(

        @NotBlank @Size(max = 200)
        String name,

        @NotBlank @Pattern(regexp = "\\+91[0-9]{10}", message = "Phone must be in format +91XXXXXXXXXX")
        String phone,

        @Email @Size(max = 200)
        String email
) {}
