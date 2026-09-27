package com.warehouse.wms.inventory.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.warehouse.wms.inventory.entity.Inventory;
import com.warehouse.wms.inventory.service.InventoryService;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/createInventory")
    public ResponseEntity<Inventory> createInventory(
            @RequestBody Inventory inventory) {

        return ResponseEntity.ok(
                inventoryService.createInventory(inventory));
    }

    @GetMapping("/getAllInventory")
    public ResponseEntity<List<Inventory>> getAllInventory() {

        return ResponseEntity.ok(
                inventoryService.getAllInventory());
    }

    @GetMapping("/getInventoryById/{id}")
    public ResponseEntity<Inventory> getInventoryById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                inventoryService.getInventoryById(id));
    }

    @PutMapping("/updateInventory/{id}")
    public ResponseEntity<Inventory> updateInventory(
            @PathVariable Long id,
            @RequestBody Inventory inventory) {

        return ResponseEntity.ok(
                inventoryService.updateInventory(id, inventory));
    }

    @DeleteMapping("/deleteInventory/{id}")
    public ResponseEntity<String> deleteInventory(
            @PathVariable Long id) {

        inventoryService.deleteInventory(id);

        return ResponseEntity.ok(
                "Inventory deleted successfully");
    }
}