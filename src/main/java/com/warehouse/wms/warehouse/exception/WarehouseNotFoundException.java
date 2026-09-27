package com.warehouse.wms.warehouse.exception;

public class WarehouseNotFoundException extends RuntimeException {

    public WarehouseNotFoundException(String message) {
        super(message);
    }
}