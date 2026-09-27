package com.warehouse.wms.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.warehouse.wms.order.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

}