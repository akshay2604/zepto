package com.zepto.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record PaymentWebhookRequest(

        @NotNull UUID orderId,

        // SUCCESS | FAILED — simulated gateway status
        @NotBlank String status,

        @Size(max = 100)
        String gatewayTxnId
) {}
