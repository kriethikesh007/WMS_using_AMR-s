package com.warehouse.wms.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.warehouse.wms.order.entity.Order;

public interface OrderRepository extends JpaRepository<Order, Long> {

}