package com.warehouse.wms.warehouse.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.warehouse.wms.warehouse.entity.Warehouse;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

}