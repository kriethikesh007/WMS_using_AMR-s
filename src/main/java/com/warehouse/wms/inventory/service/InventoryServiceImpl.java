package com.warehouse.wms.inventory.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.warehouse.wms.bin.entity.Bin;
import com.warehouse.wms.bin.exception.BinNotFoundException;
import com.warehouse.wms.bin.repository.BinRepository;
import com.warehouse.wms.inventory.entity.Inventory;
import com.warehouse.wms.inventory.exception.InventoryNotFoundException;
import com.warehouse.wms.inventory.repository.InventoryRepository;
import com.warehouse.wms.product.entity.Product;
import com.warehouse.wms.product.exception.ProductNotFoundException;
import com.warehouse.wms.product.repository.ProductRepository;

@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final BinRepository binRepository;

    public InventoryServiceImpl(
            InventoryRepository inventoryRepository,
            ProductRepository productRepository,
            BinRepository binRepository) {

        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.binRepository = binRepository;
    }

    @Override
    public Inventory createInventory(Inventory inventory) {

        Long productId = inventory.getProduct().getId();
        Long binId = inventory.getBin().getId();

        validateQuantity(inventory);

        productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(
                        "Product not found with id: " + productId));

        binRepository.findById(binId)
                .orElseThrow(() -> new BinNotFoundException(
                        "Bin not found with id: " + binId));

        if (inventoryRepository.existsByProductIdAndBinId(productId, binId)) {
            throw new IllegalArgumentException(
                    "Inventory already exists for this product in this bin");
        }

        return inventoryRepository.save(inventory);
    }

    @Override
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    @Override
    public Inventory getInventoryById(Long id) {

        return inventoryRepository.findById(id)
                .orElseThrow(() -> new InventoryNotFoundException(
                        "Inventory not found with id: " + id));
    }

    @Override
    public Inventory updateInventory(Long id, Inventory inventory) {

        Inventory existingInventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new InventoryNotFoundException(
                        "Inventory not found with id: " + id));

        Long productId = inventory.getProduct().getId();
        Long binId = inventory.getBin().getId();

        validateQuantity(inventory);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(
                        "Product not found with id: " + productId));

        Bin bin = binRepository.findById(binId)
                .orElseThrow(() -> new BinNotFoundException(
                        "Bin not found with id: " + binId));

        if (inventoryRepository.existsByProductIdAndBinIdAndIdNot(
                productId, binId, id)) {

            throw new IllegalArgumentException(
                    "Inventory already exists for this product in this bin");
        }

        existingInventory.setProduct(product);
        existingInventory.setBin(bin);
        existingInventory.setQuantity(inventory.getQuantity());
        existingInventory.setReservedQuantity(inventory.getReservedQuantity());

        return inventoryRepository.save(existingInventory);
    }

    @Override
    public void deleteInventory(Long id) {

        Inventory existingInventory = inventoryRepository.findById(id)
                .orElseThrow(() -> new InventoryNotFoundException(
                        "Inventory not found with id: " + id));

        inventoryRepository.delete(existingInventory);
    }

    private void validateQuantity(Inventory inventory) {

        if (inventory.getQuantity() < 0) {
            throw new IllegalArgumentException(
                    "Quantity cannot be negative");
        }

        if (inventory.getReservedQuantity() < 0) {
            throw new IllegalArgumentException(
                    "Reserved quantity cannot be negative");
        }

        if (inventory.getReservedQuantity() > inventory.getQuantity()) {
            throw new IllegalArgumentException(
                    "Reserved quantity cannot be greater than quantity");
        }
    }
}