package com.warehouse.wms.budget.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.warehouse.wms.budget.entity.Budget;
import com.warehouse.wms.budget.entity.BudgetStatus;
import com.warehouse.wms.budget.exception.BudgetNotFoundException;
import com.warehouse.wms.budget.repository.BudgetRepository;
import com.warehouse.wms.warehouse.entity.Warehouse;
import com.warehouse.wms.warehouse.repository.WarehouseRepository;

@Service
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final WarehouseRepository warehouseRepository;

    public BudgetServiceImpl(
            BudgetRepository budgetRepository,
            WarehouseRepository warehouseRepository) {

        this.budgetRepository = budgetRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @Override
    @Transactional
    public Budget createBudget(Budget budget) {

        validateBudget(budget);

        Long warehouseId = budget.getWarehouse().getId();

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Warehouse not found with id: " + warehouseId));

        boolean overlappingBudget =
                budgetRepository
                        .existsByWarehouseIdAndPeriodStartLessThanEqualAndPeriodEndGreaterThanEqual(
                                warehouseId,
                                budget.getPeriodEnd(),
                                budget.getPeriodStart());

        if (overlappingBudget) {
            throw new IllegalArgumentException(
                    "A budget already exists for this warehouse during the given period");
        }

        budget.setWarehouse(warehouse);

        if (budget.getSpentAmount() == null) {
            budget.setSpentAmount(BigDecimal.ZERO);
        }

        if (budget.getStatus() == null) {
            budget.setStatus(BudgetStatus.ACTIVE);
        }

        budget.setCreatedAt(LocalDateTime.now());

        updateStatus(budget);

        return budgetRepository.save(budget);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Budget> getAllBudgets() {

        return budgetRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Budget getBudgetById(Long id) {

        return budgetRepository.findById(id)
                .orElseThrow(() -> new BudgetNotFoundException(
                        "Budget not found with id: " + id));
    }

    @Override
    @Transactional
    public Budget updateBudget(Long id, Budget budget) {

        Budget existingBudget = getBudgetById(id);

        validateBudget(budget);

        Long warehouseId = budget.getWarehouse().getId();

        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Warehouse not found with id: " + warehouseId));

        boolean overlappingBudget =
                budgetRepository
                        .existsByWarehouseIdAndPeriodStartLessThanEqualAndPeriodEndGreaterThanEqualAndIdNot(
                                warehouseId,
                                budget.getPeriodEnd(),
                                budget.getPeriodStart(),
                                id);

        if (overlappingBudget) {
            throw new IllegalArgumentException(
                    "A budget already exists for this warehouse during the given period");
        }

        existingBudget.setWarehouse(warehouse);
        existingBudget.setBudgetAmount(budget.getBudgetAmount());
        existingBudget.setSpentAmount(budget.getSpentAmount());
        existingBudget.setPeriodStart(budget.getPeriodStart());
        existingBudget.setPeriodEnd(budget.getPeriodEnd());

        if (budget.getStatus() == null) {
            existingBudget.setStatus(BudgetStatus.ACTIVE);
        } else {
            existingBudget.setStatus(budget.getStatus());
        }

        updateStatus(existingBudget);

        return budgetRepository.save(existingBudget);
    }

    @Override
    @Transactional
    public void deleteBudget(Long id) {

        Budget budget = getBudgetById(id);

        budgetRepository.delete(budget);
    }

    private void validateBudget(Budget budget) {

        if (budget == null) {
            throw new IllegalArgumentException("Budget cannot be null");
        }

        if (budget.getWarehouse() == null
                || budget.getWarehouse().getId() == null) {

            throw new IllegalArgumentException(
                    "Warehouse is required");
        }

        if (budget.getBudgetAmount() == null
                || budget.getBudgetAmount().compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Budget amount must be greater than 0");
        }

        if (budget.getSpentAmount() == null) {
            budget.setSpentAmount(BigDecimal.ZERO);
        }

        if (budget.getSpentAmount().compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Spent amount cannot be negative");
        }

        if (budget.getSpentAmount()
                .compareTo(budget.getBudgetAmount()) > 0) {

            throw new IllegalArgumentException(
                    "Spent amount cannot exceed budget amount");
        }

        if (budget.getPeriodStart() == null
                || budget.getPeriodEnd() == null) {

            throw new IllegalArgumentException(
                    "Budget period start and end are required");
        }

        if (budget.getPeriodStart()
                .isAfter(budget.getPeriodEnd())) {

            throw new IllegalArgumentException(
                    "Period start cannot be after period end");
        }
    }

    private void updateStatus(Budget budget) {

        if (budget.getSpentAmount()
                .compareTo(budget.getBudgetAmount()) == 0) {

            budget.setStatus(BudgetStatus.EXHAUSTED);

        } else if (budget.getStatus() == BudgetStatus.EXHAUSTED) {

            budget.setStatus(BudgetStatus.ACTIVE);
        }
    }
}