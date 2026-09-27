package com.warehouse.wms.bin.exception;

public class BinNotFoundException extends RuntimeException {

    public BinNotFoundException(String message) {
        super(message);
    }
}