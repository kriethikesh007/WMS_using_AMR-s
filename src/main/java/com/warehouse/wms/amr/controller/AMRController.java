package com.warehouse.wms.amr.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.warehouse.wms.amr.entity.AMR;
import com.warehouse.wms.amr.service.AMRService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/amrs")
public class AMRController {
    private final AMRService amrService;

    public AMRController(AMRService amrService) {
        this.amrService = amrService;
    }

    @PostMapping
    public AMR createAMR(@Valid @RequestBody AMR amr) {
        return amrService.createAMR(amr);
    }

    @GetMapping
    public List<AMR> getAllAMRs() {
        return amrService.getAllAMRs();
    }

    @GetMapping("/{id}")
    public AMR getAMRById(@PathVariable Long id) {
        return amrService.getAMRById(id);
    }

    @PutMapping("/{id}")
    public AMR updateAMR(
            @PathVariable Long id,
            @Valid @RequestBody AMR amr) {

        return amrService.updateAMR(id, amr);
    }

    @DeleteMapping("/{id}")
    public void deleteAMR(@PathVariable Long id) {
        amrService.deleteAMR(id);
    }
}
