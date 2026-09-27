package com.warehouse.wms.inventory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.warehouse.wms.inventory.entity.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    boolean existsByProductIdAndBinId(Long productId, Long binId);

    boolean existsByProductIdAndBinIdAndIdNot(
            Long productId,
            Long binId,
            Long id);

    List<Inventory> findByProductId(Long productId);
}