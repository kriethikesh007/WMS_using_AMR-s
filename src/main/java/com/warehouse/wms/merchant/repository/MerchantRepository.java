package com.warehouse.wms.merchant.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.warehouse.wms.merchant.entity.Merchant;

public interface MerchantRepository extends JpaRepository<Merchant, Long> {

}