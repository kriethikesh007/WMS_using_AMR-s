package com.warehouse.wms.bin.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.warehouse.wms.bin.entity.Bin;
import com.warehouse.wms.bin.exception.BinNotFoundException;
import com.warehouse.wms.bin.repository.BinRepository;
import com.warehouse.wms.warehouse.exception.WarehouseNotFoundException;
import com.warehouse.wms.warehouse.repository.WarehouseRepository;

@Service
public class BinServiceImpl implements BinService {

    private final BinRepository binRepository;
    private final WarehouseRepository warehouseRepository;

    public BinServiceImpl(
            BinRepository binRepository,
            WarehouseRepository warehouseRepository) {

        this.binRepository = binRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @Override
    public Bin createBin(Bin bin) {
        Long warehouseId = bin.getWarehouse().getId();
        warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new WarehouseNotFoundException(
                        "Warehouse not found with id: " + warehouseId));
        return binRepository.save(bin);
    }

    @Override
    public List<Bin> getAllBins() {
        return binRepository.findAll();
    }

    @Override
    public Bin getBinById(Long id) {
        return binRepository.findById(id)
                .orElseThrow(() -> new BinNotFoundException("Bin not found with id: " + id));
    }

    @Override
    public Bin updateBin(Long id, Bin bin) {

        Bin existingBin = binRepository.findById(id)
                .orElseThrow(() -> new BinNotFoundException(
                        "Bin not found with id: " + id));

        Long warehouseId = bin.getWarehouse().getId();

        warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new WarehouseNotFoundException(
                        "Warehouse not found with id: " + warehouseId));

        existingBin.setBinCode(bin.getBinCode());
        existingBin.setLocation(bin.getLocation());
        existingBin.setCapacity(bin.getCapacity());
        existingBin.setStatus(bin.getStatus());
        existingBin.setWarehouse(bin.getWarehouse());

        return binRepository.save(existingBin);
    }

    @Override
    public void deleteBin(Long id) {

        Bin existingBin = binRepository.findById(id)
                .orElseThrow(() -> new BinNotFoundException("Bin not found with id: " + id));

        binRepository.delete(existingBin);
    }
}