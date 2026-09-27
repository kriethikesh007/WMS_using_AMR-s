package com.warehouse.wms.product.service;

import java.util.List;

import com.warehouse.wms.product.entity.Product;

public interface ProductService {

    Product createProduct(Product product);

    List<Product> getAllProducts();

    Product getProductById(Long id);

    Product updateProduct(Long id, Product product);

    void deleteProduct(Long id);
}
