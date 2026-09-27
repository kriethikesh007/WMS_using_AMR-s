package com.warehouse.wms.warehouse.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.warehouse.wms.warehouse.entity.Warehouse;
import com.warehouse.wms.warehouse.exception.WarehouseNotFoundException;
import com.warehouse.wms.warehouse.repository.WarehouseRepository;

@Service
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public WarehouseServiceImpl(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    @Override
    public Warehouse createWarehouse(Warehouse warehouse) {

        warehouse.setCreatedAt(LocalDateTime.now());

        return warehouseRepository.save(warehouse);
    }

    @Override
    public List<Warehouse> getAllWarehouses() {

        return warehouseRepository.findAll();
    }

    @Override
    public Warehouse getWarehouseById(Long id) {

        return warehouseRepository.findById(id)
                .orElseThrow(() -> new WarehouseNotFoundException(
                        "Warehouse not found with id: " + id));
    }

    @Override
    public Warehouse updateWarehouse(Long id, Warehouse warehouse) {

        Warehouse existingWarehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new WarehouseNotFoundException(
                        "Warehouse not found with id: " + id));

        existingWarehouse.setName(warehouse.getName());
        existingWarehouse.setLocation(warehouse.getLocation());
        existingWarehouse.setCapacity(warehouse.getCapacity());
        existingWarehouse.setStatus(warehouse.getStatus());

        return warehouseRepository.save(existingWarehouse);
    }

    @Override
    public void deleteWarehouse(Long id) {

        Warehouse existingWarehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new WarehouseNotFoundException(
                        "Warehouse not found with id: " + id));

        warehouseRepository.delete(existingWarehouse);
    }
}