package com.warehouse.wms.fulfillment.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.warehouse.wms.fulfillment.entity.Pick;
import com.warehouse.wms.fulfillment.entity.PickStatus;

public interface PickRepository extends JpaRepository<Pick, Long> {

    List<Pick> findByStatus(PickStatus status);

    List<Pick> findByOrderId(Long orderId);

    List<Pick> findByAmrId(Long amrId);
}