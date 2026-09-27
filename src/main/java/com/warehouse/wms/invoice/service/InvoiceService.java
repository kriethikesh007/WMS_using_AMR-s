package com.warehouse.wms.invoice.service;

import java.util.List;

import com.warehouse.wms.invoice.entity.Invoice;

public interface InvoiceService {

    Invoice createInvoice(Long orderId);

    List<Invoice> getAllInvoices();

    Invoice getInvoiceById(Long id);

    Invoice getInvoiceByOrderId(Long orderId);

    Invoice payInvoice(Long id);

    Invoice cancelInvoice(Long id);
}