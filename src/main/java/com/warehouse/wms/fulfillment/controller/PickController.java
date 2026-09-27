package com.warehouse.wms.fulfillment.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.warehouse.wms.fulfillment.entity.Pick;
import com.warehouse.wms.fulfillment.entity.PickStatus;
import com.warehouse.wms.fulfillment.service.PickService;

@RestController
@RequestMapping("/fulfillment/picks")
public class PickController {

    private final PickService pickService;

    public PickController(PickService pickService) {
        this.pickService = pickService;
    }

    @PostMapping
    public Pick createPick(@RequestParam Long orderId) {
        return pickService.createPick(orderId);
    }

    @GetMapping
    public List<Pick> getAllPicks() {
        return pickService.getAllPicks();
    }

    @GetMapping("/{id}")
    public Pick getPickById(@PathVariable Long id) {
        return pickService.getPickById(id);
    }

    @GetMapping("/status/{status}")
    public List<Pick> getPicksByStatus(
            @PathVariable PickStatus status) {

        return pickService.getPicksByStatus(status);
    }

    @PostMapping("/{pickId}/assign")
    public Pick assignAMR(
            @PathVariable Long pickId,
            @RequestParam Long amrId) {

        return pickService.assignAMR(pickId, amrId);
    }

    @PostMapping("/{pickId}/start")
    public Pick startPick(@PathVariable Long pickId) {
        return pickService.startPick(pickId);
    }

    @PostMapping("/{pickId}/complete")
    public Pick completePick(@PathVariable Long pickId) {
        return pickService.completePick(pickId);
    }

    @PostMapping("/{pickId}/fail")
    public Pick failPick(@PathVariable Long pickId) {
        return pickService.failPick(pickId);
    }
}