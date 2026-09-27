package com.warehouse.wms.amr.service;

import java.util.List;

import com.warehouse.wms.amr.entity.AMR;

public interface AMRService {
    AMR createAMR(AMR amr);

    List<AMR> getAllAMRs();

    AMR getAMRById(Long id);

    AMR updateAMR(Long id, AMR amr);

    void deleteAMR(Long id);
}
