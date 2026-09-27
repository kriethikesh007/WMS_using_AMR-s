package com.warehouse.wms.warehouse.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.warehouse.wms.warehouse.entity.Warehouse;
import com.warehouse.wms.warehouse.service.WarehouseService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @PostMapping
    public Warehouse createWarehouse(
            @Valid @RequestBody Warehouse warehouse) {

        return warehouseService.createWarehouse(warehouse);
    }

    @GetMapping
    public List<Warehouse> getAllWarehouses() {

        return warehouseService.getAllWarehouses();
    }

    @GetMapping("/{id}")
    public Warehouse getWarehouseById(
            @PathVariable Long id) {

        return warehouseService.getWarehouseById(id);
    }

    @PutMapping("/{id}")
    public Warehouse updateWarehouse(
            @PathVariable Long id,
            @Valid @RequestBody Warehouse warehouse) {

        return warehouseService.updateWarehouse(id, warehouse);
    }

    @DeleteMapping("/{id}")
    public void deleteWarehouse(
            @PathVariable Long id) {

        warehouseService.deleteWarehouse(id);
    }
}