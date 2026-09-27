package com.warehouse.wms.fulfillment.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.warehouse.wms.amr.entity.AMR;
import com.warehouse.wms.amr.entity.AMRStatus;
import com.warehouse.wms.amr.repository.AMRRepository;
import com.warehouse.wms.fulfillment.entity.Pick;
import com.warehouse.wms.fulfillment.entity.PickStatus;
import com.warehouse.wms.fulfillment.repository.PickRepository;
import com.warehouse.wms.inventory.entity.Inventory;
import com.warehouse.wms.inventory.repository.InventoryRepository;
import com.warehouse.wms.order.entity.Order;
import com.warehouse.wms.order.entity.OrderItem;
import com.warehouse.wms.order.entity.OrderStatus;
import com.warehouse.wms.order.repository.OrderRepository;

@Service
public class PickServiceImpl implements PickService {

    private final PickRepository pickRepository;
    private final OrderRepository orderRepository;
    private final AMRRepository amrRepository;
    private final InventoryRepository inventoryRepository;

    public PickServiceImpl(
            PickRepository pickRepository,
            OrderRepository orderRepository,
            AMRRepository amrRepository,
            InventoryRepository inventoryRepository) {

        this.pickRepository = pickRepository;
        this.orderRepository = orderRepository;
        this.amrRepository = amrRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    public Pick createPick(Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Order not found with id: " + orderId));

        if (order.getStatus() != OrderStatus.PROCESSING) {
            throw new IllegalArgumentException(
                    "Only PROCESSING orders can be converted into a pick");
        }

        Pick pick = new Pick();

        pick.setOrder(order);
        pick.setStatus(PickStatus.CREATED);
        pick.setCreatedAt(LocalDateTime.now());

        return pickRepository.save(pick);
    }

    @Override
    public List<Pick> getAllPicks() {
        return pickRepository.findAll();
    }

    @Override
    public Pick getPickById(Long id) {

        return pickRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Pick not found with id: " + id));
    }

    @Override
    public List<Pick> getPicksByStatus(PickStatus status) {
        return pickRepository.findByStatus(status);
    }

    @Override
    @Transactional
    public Pick assignAMR(Long pickId, Long amrId) {

        Pick pick = getPickById(pickId);

        if (pick.getStatus() != PickStatus.CREATED) {
            throw new IllegalArgumentException(
                    "Only CREATED picks can be assigned to an AMR");
        }

        AMR amr = amrRepository.findById(amrId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "AMR not found with id: " + amrId));

        if (amr.getStatus() != AMRStatus.AVAILABLE) {
            throw new IllegalArgumentException(
                    "Only AVAILABLE AMRs can be assigned");
        }

        pick.setAmr(amr);
        pick.setStatus(PickStatus.ASSIGNED);
        pick.setAssignedAt(LocalDateTime.now());

        amr.setStatus(AMRStatus.BUSY);

        amrRepository.save(amr);

        return pickRepository.save(pick);
    }

    @Override
    @Transactional
    public Pick startPick(Long pickId) {

        Pick pick = getPickById(pickId);

        if (pick.getStatus() != PickStatus.ASSIGNED) {
            throw new IllegalArgumentException(
                    "Only ASSIGNED picks can be started");
        }

        pick.setStatus(PickStatus.IN_PROGRESS);
        pick.setStartedAt(LocalDateTime.now());

        return pickRepository.save(pick);
    }

    @Override
    @Transactional
    public Pick completePick(Long pickId) {

        Pick pick = getPickById(pickId);

        if (pick.getStatus() != PickStatus.IN_PROGRESS) {
            throw new IllegalArgumentException(
                    "Only IN_PROGRESS picks can be completed");
        }

        Order order = pick.getOrder();

        for (OrderItem orderItem : order.getItems()) {

            Long productId = orderItem.getProduct().getId();

            int requiredQuantity = orderItem.getQuantity();

            List<Inventory> inventories =
                    inventoryRepository.findByProductId(productId);

            int remainingQuantity = requiredQuantity;

            for (Inventory inventory : inventories) {

                if (remainingQuantity <= 0) {
                    break;
                }

                int availableQuantity =
                        inventory.getQuantity()
                                - inventory.getReservedQuantity();

                if (availableQuantity <= 0) {
                    continue;
                }

                int pickedFromThisInventory =
                        Math.min(remainingQuantity, availableQuantity);

                inventory.setQuantity(
                        inventory.getQuantity()
                                - pickedFromThisInventory);

                int newReservedQuantity =
                        Math.max(
                                0,
                                inventory.getReservedQuantity()
                                        - pickedFromThisInventory);

                inventory.setReservedQuantity(newReservedQuantity);

                inventoryRepository.save(inventory);

                remainingQuantity =
                        remainingQuantity
                                - pickedFromThisInventory;
            }

            if (remainingQuantity > 0) {

                throw new IllegalArgumentException(
                        "Insufficient inventory for product id: "
                                + productId
                                + ". Required: "
                                + requiredQuantity
                                + ", unavailable quantity: "
                                + remainingQuantity);
            }
        }

        pick.setStatus(PickStatus.COMPLETED);
        pick.setCompletedAt(LocalDateTime.now());

        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

        AMR amr = pick.getAmr();

        if (amr != null) {
            amr.setStatus(AMRStatus.AVAILABLE);
            amrRepository.save(amr);
        }

        return pickRepository.save(pick);
    }

    @Override
    @Transactional
    public Pick failPick(Long pickId) {

        Pick pick = getPickById(pickId);

        if (pick.getStatus() != PickStatus.ASSIGNED
                && pick.getStatus() != PickStatus.IN_PROGRESS) {

            throw new IllegalArgumentException(
                    "Only ASSIGNED or IN_PROGRESS picks can be failed");
        }

        pick.setStatus(PickStatus.FAILED);

        AMR amr = pick.getAmr();

        if (amr != null) {
            amr.setStatus(AMRStatus.AVAILABLE);
            amrRepository.save(amr);
        }

        return pickRepository.save(pick);
    }
}