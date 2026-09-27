package com.warehouse.wms.invoice.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.warehouse.wms.invoice.entity.Invoice;
import com.warehouse.wms.invoice.entity.InvoiceStatus;
import com.warehouse.wms.invoice.exception.InvoiceNotFoundException;
import com.warehouse.wms.invoice.repository.InvoiceRepository;
import com.warehouse.wms.fulfillment.entity.Pick;
import com.warehouse.wms.fulfillment.entity.PickStatus;
import com.warehouse.wms.fulfillment.repository.PickRepository;
import com.warehouse.wms.order.entity.Order;
import com.warehouse.wms.order.entity.OrderItem;
import com.warehouse.wms.order.repository.OrderRepository;

@Service
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final PickRepository pickRepository;

    public InvoiceServiceImpl(
            InvoiceRepository invoiceRepository,
            OrderRepository orderRepository,
            PickRepository pickRepository) {

        this.invoiceRepository = invoiceRepository;
        this.orderRepository = orderRepository;
        this.pickRepository = pickRepository;
    }

    @Override
    @Transactional
    public Invoice createInvoice(Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Order not found with id: " + orderId));

        if (invoiceRepository.existsByOrderId(orderId)) {
            throw new IllegalArgumentException(
                    "Invoice already exists for order id: " + orderId);
        }

        List<Pick> picks = pickRepository.findByOrderId(orderId);

        boolean completedPickExists = picks.stream()
                .anyMatch(pick -> pick.getStatus() == PickStatus.COMPLETED);

        if (!completedPickExists) {
            throw new IllegalArgumentException(
                    "Invoice can be created only after pick is completed");
        }

        BigDecimal totalAmount = calculateTotalAmount(order);

        if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Invoice total amount must be greater than 0");
        }

        Invoice invoice = new Invoice();

        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setOrder(order);
        invoice.setTotalAmount(totalAmount);
        invoice.setStatus(InvoiceStatus.GENERATED);
        invoice.setCreatedAt(LocalDateTime.now());

        return invoiceRepository.save(invoice);
    }

    @Override
    public List<Invoice> getAllInvoices() {

        return invoiceRepository.findAll();
    }

    @Override
    public Invoice getInvoiceById(Long id) {

        return invoiceRepository.findById(id)
                .orElseThrow(() -> new InvoiceNotFoundException(
                        "Invoice not found with id: " + id));
    }

    @Override
    public Invoice getInvoiceByOrderId(Long orderId) {

        return invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new InvoiceNotFoundException(
                        "Invoice not found for order id: " + orderId));
    }

    @Override
    @Transactional
    public Invoice payInvoice(Long id) {
        Invoice invoice = getInvoiceById(id);
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalArgumentException("Invoice is already paid");
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot pay a cancelled invoice");
        }
        invoice.setStatus(InvoiceStatus.PAID);
        return invoiceRepository.save(invoice);
    }

    @Override
    @Transactional
    public Invoice cancelInvoice(Long id) {
        Invoice invoice = getInvoiceById(id);
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new IllegalArgumentException("Cannot cancel an already paid invoice");
        }
        invoice.setStatus(InvoiceStatus.CANCELLED);
        return invoiceRepository.save(invoice);
    }

    private BigDecimal calculateTotalAmount(Order order) {

        BigDecimal total = BigDecimal.ZERO;

        for (OrderItem item : order.getItems()) {

            BigDecimal itemTotal = item.getProduct()
                    .getPrice()
                    .multiply(BigDecimal.valueOf(item.getQuantity()));

            total = total.add(itemTotal);
        }

        return total;
    }

    private String generateInvoiceNumber() {

        return "INV-" + System.currentTimeMillis();
    }
}