package com.warehouse.wms.budget.service;

import java.util.List;

import com.warehouse.wms.budget.entity.Budget;

public interface BudgetService {

    Budget createBudget(Budget budget);

    List<Budget> getAllBudgets();

    Budget getBudgetById(Long id);

    Budget updateBudget(Long id, Budget budget);

    void deleteBudget(Long id);
}