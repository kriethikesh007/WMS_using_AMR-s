package com.warehouse.wms.order.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.warehouse.wms.bin.entity.BinStatus;
import com.warehouse.wms.inventory.entity.Inventory;
import com.warehouse.wms.inventory.repository.InventoryRepository;
import com.warehouse.wms.order.entity.Order;
import com.warehouse.wms.order.entity.OrderItem;
import com.warehouse.wms.order.entity.OrderStatus;
import com.warehouse.wms.order.exception.OrderNotFoundException;
import com.warehouse.wms.order.repository.OrderRepository;
import com.warehouse.wms.product.entity.Product;
import com.warehouse.wms.product.repository.ProductRepository;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository) {

        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    public Order createOrder(Order order) {

        order.setCreatedAt(LocalDateTime.now());

        if (order.getStatus() == null) {
            order.setStatus(OrderStatus.CREATED);
        }

        for (OrderItem item : order.getItems()) {

            Product product = productRepository.findById(
                    item.getProduct().getId())
                    .orElseThrow(
                            () -> new IllegalArgumentException(
                                    "Product not found with id: "
                                            + item.getProduct().getId()));

            item.setProduct(product);
            item.setOrder(order);
        }

        return orderRepository.save(order);
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public Order getOrderById(Long id) {

        return orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + id));
    }

    @Override
    public Order updateOrder(Long id, Order order) {

        Order existingOrder = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + id));

        existingOrder.setOrderNumber(order.getOrderNumber());
        existingOrder.setStatus(order.getStatus());

        return orderRepository.save(existingOrder);
    }

    @Override
    public void deleteOrder(Long id) {

        Order existingOrder = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + id));

        orderRepository.delete(existingOrder);
    }

    @Override
    public Order pickOrder(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + id));

        if (order.getStatus() != OrderStatus.CREATED) {
            throw new IllegalArgumentException(
                    "Only CREATED orders can be picked");
        }

        order.setStatus(OrderStatus.PROCESSING);

        return orderRepository.save(order);
    }

    @Override
    public Order checkInventory(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + id));

        if (order.getStatus() != OrderStatus.PROCESSING) {
            throw new IllegalArgumentException(
                    "Only PROCESSING orders can be checked for inventory");
        }

        Map<Long, Integer> requiredQuantities = new HashMap<>();

        for (OrderItem item : order.getItems()) {

            Long productId = item.getProduct().getId();

            requiredQuantities.merge(
                    productId,
                    item.getQuantity(),
                    Integer::sum);
        }

        for (Map.Entry<Long, Integer> entry : requiredQuantities.entrySet()) {

            Long productId = entry.getKey();
            Integer requiredQuantity = entry.getValue();

            List<Inventory> inventoryList =
                    inventoryRepository.findByProductId(productId);

            int availableQuantity = 0;

            for (Inventory inventory : inventoryList) {

                if (inventory.getBin().getStatus() == BinStatus.INACTIVE) {
                    continue;
                }

                availableQuantity += inventory.getQuantity()
                        - inventory.getReservedQuantity();
            }

            if (availableQuantity < requiredQuantity) {

                throw new IllegalArgumentException(
                        "Insufficient inventory for product id: "
                                + productId
                                + ". Required: "
                                + requiredQuantity
                                + ", Available: "
                                + availableQuantity);
            }
        }

        return order;
    }

    @Override
    @Transactional
    public Order reserveInventory(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(
                        "Order not found with id: " + id));

        if (order.getStatus() != OrderStatus.PROCESSING) {
            throw new IllegalArgumentException(
                    "Only PROCESSING orders can reserve inventory");
        }

        Map<Long, Integer> requiredQuantities = new HashMap<>();

        for (OrderItem item : order.getItems()) {

            Long productId = item.getProduct().getId();

            requiredQuantities.merge(
                    productId,
                    item.getQuantity(),
                    Integer::sum);
        }

        for (Map.Entry<Long, Integer> entry : requiredQuantities.entrySet()) {

            Long productId = entry.getKey();
            Integer requiredQuantity = entry.getValue();

            List<Inventory> inventoryList =
                    inventoryRepository.findByProductId(productId);

            int availableQuantity = 0;

            for (Inventory inventory : inventoryList) {

                if (inventory.getBin().getStatus() == BinStatus.INACTIVE) {
                    continue;
                }

                availableQuantity += inventory.getQuantity()
                        - inventory.getReservedQuantity();
            }

            if (availableQuantity < requiredQuantity) {

                throw new IllegalArgumentException(
                        "Insufficient inventory for product id: "
                                + productId
                                + ". Required: "
                                + requiredQuantity
                                + ", Available: "
                                + availableQuantity);
            }
        }

        for (Map.Entry<Long, Integer> entry : requiredQuantities.entrySet()) {

            Long productId = entry.getKey();
            int remainingQuantity = entry.getValue();

            List<Inventory> inventoryList =
                    inventoryRepository.findByProductId(productId);

            for (Inventory inventory : inventoryList) {

                if (remainingQuantity <= 0) {
                    break;
                }

                if (inventory.getBin().getStatus() == BinStatus.INACTIVE) {
                    continue;
                }

                int availableInInventory =
                        inventory.getQuantity()
                                - inventory.getReservedQuantity();

                if (availableInInventory <= 0) {
                    continue;
                }

                int quantityToReserve =
                        Math.min(remainingQuantity, availableInInventory);

                inventory.setReservedQuantity(
                        inventory.getReservedQuantity()
                                + quantityToReserve);

                inventoryRepository.save(inventory);

                remainingQuantity -= quantityToReserve;
            }
        }

        return order;
    }
}