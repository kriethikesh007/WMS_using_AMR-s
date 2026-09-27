package com.warehouse.wms.invoice.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.warehouse.wms.invoice.entity.Invoice;
import com.warehouse.wms.invoice.service.InvoiceService;

@RestController
@RequestMapping("/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    public Invoice createInvoice(@RequestParam Long orderId) {
        return invoiceService.createInvoice(orderId);
    }

    @GetMapping
    public List<Invoice> getAllInvoices() {
        return invoiceService.getAllInvoices();
    }

    @GetMapping("/{id}")
    public Invoice getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id);
    }

    @GetMapping("/order/{orderId}")
    public Invoice getInvoiceByOrderId(@PathVariable Long orderId) {
        return invoiceService.getInvoiceByOrderId(orderId);
    }

    @PutMapping("/{id}/pay")
    public Invoice payInvoice(@PathVariable Long id) {
        return invoiceService.payInvoice(id);
    }

    @PutMapping("/{id}/cancel")
    public Invoice cancelInvoice(@PathVariable Long id) {
        return invoiceService.cancelInvoice(id);
    }
}