package com.warehouse.wms.budget.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.warehouse.wms.budget.entity.Budget;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByWarehouseId(Long warehouseId);

    boolean existsByWarehouseIdAndPeriodStartLessThanEqualAndPeriodEndGreaterThanEqual(
            Long warehouseId,
            LocalDate periodEnd,
            LocalDate periodStart);

    boolean existsByWarehouseIdAndPeriodStartLessThanEqualAndPeriodEndGreaterThanEqualAndIdNot(
            Long warehouseId,
            LocalDate periodEnd,
            LocalDate periodStart,
            Long id);
}