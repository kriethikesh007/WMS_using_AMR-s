package com.warehouse.wms.warehouse.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.warehouse.wms.amr.exception.AMRNotFoundException;
import com.warehouse.wms.bin.exception.BinNotFoundException;
import com.warehouse.wms.budget.exception.BudgetNotFoundException;
import com.warehouse.wms.product.exception.ProductNotFoundException;
import com.warehouse.wms.inventory.exception.InventoryNotFoundException;
import com.warehouse.wms.order.exception.OrderNotFoundException;
import com.warehouse.wms.invoice.exception.InvoiceNotFoundException;
import com.warehouse.wms.merchant.exception.MerchantNotFoundException;
import com.warehouse.wms.fulfillment.exception.PickNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(WarehouseNotFoundException.class)
        public ResponseEntity<String> handleWarehouseNotFound(
                        WarehouseNotFoundException exception) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(exception.getMessage());
        }

        @ExceptionHandler(BinNotFoundException.class)
        public ResponseEntity<String> handleBinNotFound(
                        BinNotFoundException exception) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(exception.getMessage());
        }

        @ExceptionHandler(ProductNotFoundException.class)
        public ResponseEntity<String> handleProductNotFound(
                        ProductNotFoundException ex) {

                return new ResponseEntity<>(
                                ex.getMessage(),
                                HttpStatus.NOT_FOUND);
        }

        @ExceptionHandler(InventoryNotFoundException.class)
        public ResponseEntity<String> handleInventoryNotFound(
                        InventoryNotFoundException exception) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(exception.getMessage());
        }

        @ExceptionHandler(AMRNotFoundException.class)
        public ResponseEntity<String> handleAMRNotFound(
                        AMRNotFoundException exception) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(exception.getMessage());
        }

        @ExceptionHandler(BudgetNotFoundException.class)
        public ResponseEntity<String> handleBudgetNotFound(
                        BudgetNotFoundException exception) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(exception.getMessage());
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, String>> handleValidationErrors(
                        MethodArgumentNotValidException exception) {

                Map<String, String> errors = new HashMap<>();

                exception.getBindingResult()
                                .getFieldErrors()
                                .forEach(error -> errors.put(
                                                error.getField(),
                                                error.getDefaultMessage()));

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(errors);
        }

        @ExceptionHandler(OrderNotFoundException.class)
        public ResponseEntity<String> handleOrderNotFound(
                        OrderNotFoundException ex) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(ex.getMessage());
        }

        @ExceptionHandler(InvoiceNotFoundException.class)
        public ResponseEntity<String> handleInvoiceNotFound(
                        InvoiceNotFoundException exception) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(exception.getMessage());
        }

        @ExceptionHandler(MerchantNotFoundException.class)
        public ResponseEntity<String> handleMerchantNotFound(
                        MerchantNotFoundException exception) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(exception.getMessage());
        }

        @ExceptionHandler(PickNotFoundException.class)
        public ResponseEntity<String> handlePickNotFound(
                        PickNotFoundException exception) {

                return ResponseEntity
                                .status(HttpStatus.NOT_FOUND)
                                .body(exception.getMessage());
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<String> handleIllegalArgumentException(
                        IllegalArgumentException exception) {

                return ResponseEntity
                                .status(HttpStatus.BAD_REQUEST)
                                .body(exception.getMessage());
        }
}