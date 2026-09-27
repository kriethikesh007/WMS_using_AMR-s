package com.warehouse.wms.bin.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.warehouse.wms.bin.entity.Bin;

public interface BinRepository extends JpaRepository<Bin, Long> {

}
