package com.zepto.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
        @Size(max = 200) String name,
        @Email @Size(max = 200) String email
) {}
