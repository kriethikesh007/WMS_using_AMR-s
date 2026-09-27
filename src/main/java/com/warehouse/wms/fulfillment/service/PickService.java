package com.warehouse.wms.fulfillment.service;

import java.util.List;

import com.warehouse.wms.fulfillment.entity.Pick;
import com.warehouse.wms.fulfillment.entity.PickStatus;

public interface PickService {

    Pick createPick(Long orderId);

    List<Pick> getAllPicks();

    Pick getPickById(Long id);

    List<Pick> getPicksByStatus(PickStatus status);

    Pick assignAMR(Long pickId, Long amrId);

    Pick startPick(Long pickId);

    Pick completePick(Long pickId);

    Pick failPick(Long pickId);
}