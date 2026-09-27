package com.warehouse.wms.merchant.service;

import java.util.List;

import com.warehouse.wms.merchant.entity.Merchant;

public interface MerchantService {

    Merchant createMerchant(Merchant merchant);

    List<Merchant> getAllMerchants();

    Merchant getMerchantById(Long id);

    Merchant updateMerchant(Long id, Merchant merchant);

    void deleteMerchant(Long id);
}