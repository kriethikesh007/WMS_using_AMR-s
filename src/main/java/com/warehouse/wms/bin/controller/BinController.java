package com.warehouse.wms.bin.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.warehouse.wms.bin.entity.Bin;
import com.warehouse.wms.bin.service.BinService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/bins")
public class BinController {

    private final BinService binService;

    public BinController(BinService binService) {
        this.binService = binService;
    }

    @PostMapping
    public Bin createBin(@Valid @RequestBody Bin bin) {
        return binService.createBin(bin);
    }

    @GetMapping
    public List<Bin> getAllBins() {
        return binService.getAllBins();
    }

    @GetMapping("/{id}")
    public Bin getBinById(@PathVariable Long id) {
        return binService.getBinById(id);
    }

    @PutMapping("/{id}")
    public Bin updateBin(
            @PathVariable Long id,
            @RequestBody @Valid Bin bin) {

        return binService.updateBin(id, bin);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBin(@PathVariable Long id) {
        binService.deleteBin(id);
        return ResponseEntity.noContent().build();
    }
}