package com.warehouse.wms.order.service;

import java.util.List;

import com.warehouse.wms.order.entity.Order;

public interface OrderService {

    Order createOrder(Order order);

    List<Order> getAllOrders();

    Order getOrderById(Long id);

    Order updateOrder(Long id, Order order);

    void deleteOrder(Long id);

    Order pickOrder(Long id);

    Order checkInventory(Long id);

    Order reserveInventory(Long id);
}