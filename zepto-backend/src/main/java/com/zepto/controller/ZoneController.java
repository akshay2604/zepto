package com.zepto.controller;

import com.zepto.dto.response.ZoneResponse;
import com.zepto.service.ZoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/zones")
@RequiredArgsConstructor
public class ZoneController {

    private final ZoneService zoneService;

    @GetMapping
    public ResponseEntity<List<ZoneResponse>> getZones(@RequestParam UUID warehouseId) {
        return ResponseEntity.ok(zoneService.getZones(warehouseId));
    }
}
