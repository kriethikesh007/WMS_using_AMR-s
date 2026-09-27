package com.warehouse.wms.inventory.service;

import com.warehouse.wms.inventory.entity.Inventory;
import java.util.List;

public interface InventoryService {
    Inventory createInventory(Inventory inventory);

    List<Inventory> getAllInventory();

    Inventory getInventoryById(Long id);

    Inventory updateInventory(Long id, Inventory inventory);

    void deleteInventory(Long id);
}
