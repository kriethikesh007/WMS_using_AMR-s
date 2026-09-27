package com.warehouse.wms.invoice.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.warehouse.wms.invoice.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    boolean existsByOrderId(Long orderId);

    Optional<Invoice> findByOrderId(Long orderId);

    boolean existsByInvoiceNumber(String invoiceNumber);
}