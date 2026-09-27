package com.warehouse.wms.fulfillment.exception;

public class PickNotFoundException extends RuntimeException {

    public PickNotFoundException(String message) {
        super(message);
    }
}