package com.warehouse.wms.bin.service;

import java.util.List;

import com.warehouse.wms.bin.entity.Bin;

public interface BinService {
    Bin createBin(Bin bin);

    List<Bin> getAllBins();

    Bin getBinById(Long id);

    Bin updateBin(Long id, Bin bin);

    void deleteBin(Long id);
}
