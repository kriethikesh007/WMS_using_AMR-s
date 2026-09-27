package com.warehouse.wms.warehouse.service;

import java.util.List;

import com.warehouse.wms.warehouse.entity.Warehouse;

public interface WarehouseService {

    Warehouse createWarehouse(Warehouse warehouse);

    List<Warehouse> getAllWarehouses();

    Warehouse getWarehouseById(Long id);

    Warehouse updateWarehouse(Long id, Warehouse warehouse);

    void deleteWarehouse(Long id);
}