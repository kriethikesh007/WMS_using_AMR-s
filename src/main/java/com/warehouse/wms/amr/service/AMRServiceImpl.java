package com.warehouse.wms.amr.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.warehouse.wms.amr.entity.AMR;
import com.warehouse.wms.amr.exception.AMRNotFoundException;
import com.warehouse.wms.amr.repository.AMRRepository;

@Service 
public class AMRServiceImpl implements AMRService {
    private final AMRRepository amrRepository;

    public AMRServiceImpl(AMRRepository amrRepository) {
        this.amrRepository = amrRepository;
    }

    @Override
    public AMR createAMR(AMR amr) {
        amr.setCreatedAt(LocalDateTime.now());
        return amrRepository.save(amr);
    }

    @Override
    public List<AMR> getAllAMRs() {
        return amrRepository.findAll();
    }

    @Override
    public AMR getAMRById(Long id) {
        return amrRepository.findById(id)
                .orElseThrow(() -> new AMRNotFoundException(
                        "AMR not found with id: " + id));
    }

    @Override
    public AMR updateAMR(Long id, AMR amr) {

        AMR existingAMR = amrRepository.findById(id)
                .orElseThrow(() -> new AMRNotFoundException(
                        "AMR not found with id: " + id));

        existingAMR.setRobotCode(amr.getRobotCode());
        existingAMR.setStatus(amr.getStatus());
        existingAMR.setBatteryLevel(amr.getBatteryLevel());
        existingAMR.setWarehouse(amr.getWarehouse());
        existingAMR.setCurrentBin(amr.getCurrentBin());

        return amrRepository.save(existingAMR);
    }

    @Override
    public void deleteAMR(Long id) {
        if (!amrRepository.existsById(id)) {
            throw new AMRNotFoundException(
                    "AMR not found with id: " + id);
        }

        amrRepository.deleteById(id);
    }

}
