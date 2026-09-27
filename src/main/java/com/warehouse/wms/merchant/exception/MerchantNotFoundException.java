package com.warehouse.wms.merchant.exception;

public class MerchantNotFoundException extends RuntimeException {

    public MerchantNotFoundException(String message) {
        super(message);
    }
}