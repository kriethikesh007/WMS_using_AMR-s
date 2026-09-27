package com.warehouse.wms.merchant.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.warehouse.wms.merchant.entity.Merchant;
import com.warehouse.wms.merchant.entity.MerchantStatus;
import com.warehouse.wms.merchant.exception.MerchantNotFoundException;
import com.warehouse.wms.merchant.repository.MerchantRepository;

@Service
public class MerchantServiceImpl implements MerchantService {

    private final MerchantRepository merchantRepository;

    public MerchantServiceImpl(MerchantRepository merchantRepository) {
        this.merchantRepository = merchantRepository;
    }

    @Override
    public Merchant createMerchant(Merchant merchant) {

        if (merchant.getStatus() == null) {
            merchant.setStatus(MerchantStatus.ACTIVE);
        }

        merchant.setCreatedAt(LocalDateTime.now());

        return merchantRepository.save(merchant);
    }

    @Override
    public List<Merchant> getAllMerchants() {

        return merchantRepository.findAll();
    }

    @Override
    public Merchant getMerchantById(Long id) {

        return merchantRepository.findById(id)
                .orElseThrow(() -> new MerchantNotFoundException(
                        "Merchant not found with id: " + id));
    }

    @Override
    public Merchant updateMerchant(Long id, Merchant merchant) {

        Merchant existingMerchant = merchantRepository.findById(id)
                .orElseThrow(() -> new MerchantNotFoundException(
                        "Merchant not found with id: " + id));

        existingMerchant.setMerchantCode(merchant.getMerchantCode());
        existingMerchant.setBusinessName(merchant.getBusinessName());
        existingMerchant.setContactName(merchant.getContactName());
        existingMerchant.setEmail(merchant.getEmail());
        existingMerchant.setPhone(merchant.getPhone());
        existingMerchant.setStatus(merchant.getStatus());

        return merchantRepository.save(existingMerchant);
    }

    @Override
    public void deleteMerchant(Long id) {

        if (!merchantRepository.existsById(id)) {
            throw new MerchantNotFoundException(
                    "Merchant not found with id: " + id);
        }

        merchantRepository.deleteById(id);
    }
}