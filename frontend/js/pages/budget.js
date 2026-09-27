/* ============================================
   WMS — Budget Management Page
   ============================================ */

import api from '../api.js';
import { formatDate, formatDateTime, formatCurrency, formatNumber, formatEnum, getStatusColor, escapeHtml } from '../utils.js';
import { showToast, statusBadge, buildTable, formField, getFormData, showFormErrors, statCard, showLoading, ICONS } from '../components.js';
import { showModal, showConfirm } from '../modal.js';

/**
 * Render the Budget Management page.
 * @param {HTMLElement} container
 */
export async function render(container) {
    container.innerHTML = `
        <div class="page-container animate-fade-in">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Budgets & Expenses</h1>
                    <p class="page-subtitle text-muted">Manage facility budgets, expenditures, financial ceilings, and fiscal period tracking</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-add-budget">
                        ${ICONS.plus} Add Budget
                    </button>
                </div>
            </div>
            <div id="budget-stats" class="stats-grid"></div>
            <div id="budget-table"></div>
        </div>
    `;

    const statsContainer = container.querySelector('#budget-stats');
    const tableContainer = container.querySelector('#budget-table');
    const addBtn = container.querySelector('#btn-add-budget');

    let warehousesList = [];

    /**
     * Render the stat cards summarizing budget metrics.
     * @param {Array<object>} budgets
     */
    function renderStats(budgets) {
        const totalBudgets = budgets.length;
        const activeBudgets = budgets.filter(b => b.status === 'ACTIVE').length;
        const totalBudgetSum = budgets.reduce((sum, b) => sum + (Number(b.budgetAmount) || 0), 0);
        const totalSpentSum = budgets.reduce((sum, b) => sum + (Number(b.spentAmount) || 0), 0);

        statsContainer.innerHTML = `
            ${statCard('Total Budgets', formatNumber(totalBudgets), ICONS.budget, 'primary')}
            ${statCard('Active', formatNumber(activeBudgets), ICONS.check, 'success')}
            ${statCard('Total Budget', formatCurrency(totalBudgetSum), ICONS.budget, 'primary')}
            ${statCard('Total Spent', formatCurrency(totalSpentSum), ICONS.budget, 'warning')}
        `;
    }

    /**
     * Render the data table for budgets.
     * @param {Array<object>} budgets
     */
    function renderTable(budgets) {
        tableContainer.innerHTML = '';

        const columns = [
            { key: 'id', label: 'ID' },
            {
                key: 'warehouse.name',
                label: 'Warehouse',
                render: (row) => escapeHtml(row.warehouse?.name || '—')
            },
            {
                key: 'budgetAmount',
                label: 'Budget Amount',
                render: (row) => formatCurrency(row.budgetAmount)
            },
            {
                key: 'spentAmount',
                label: 'Spent',
                render: (row) => formatCurrency(row.spentAmount)
            },
            {
                key: 'remainingAmount',
                label: 'Remaining',
                render: (row) => {
                    const remaining = row.remainingAmount != null
                        ? Number(row.remainingAmount)
                        : (Number(row.budgetAmount) || 0) - (Number(row.spentAmount) || 0);
                    return formatCurrency(remaining);
                }
            },
            {
                key: 'period',
                label: 'Period',
                render: (row) => {
                    const start = row.periodStart ? formatDate(row.periodStart) : '';
                    const end = row.periodEnd ? formatDate(row.periodEnd) : '';
                    if (!start && !end) return '<span class="text-muted">—</span>';
                    return `${escapeHtml(start)} – ${escapeHtml(end)}`;
                }
            },
            {
                key: 'status',
                label: 'Status',
                render: (row) => statusBadge(row.status)
            }
        ];

        const table = buildTable({
            columns,
            data: budgets,
            onEdit: (row) => openBudgetModal(row),
            onDelete: (row) => handleDelete(row),
            emptyMessage: 'No budgets found'
        });

        tableContainer.appendChild(table);
    }

    /**
     * Load data and refresh the UI.
     */
    async function loadData() {
        showLoading(tableContainer);
        try {
            const [budgets, warehouses] = await Promise.all([
                api.budgets.list(),
                api.warehouses.list()
            ]);

            warehousesList = Array.isArray(warehouses) ? warehouses : [];
            const budgetList = Array.isArray(budgets) ? budgets : [];

            renderStats(budgetList);
            renderTable(budgetList);
        } catch (error) {
            showToast(error.message || 'Failed to load budgets', 'error');
            tableContainer.innerHTML = `
                <div class="table-container animate-fade-in">
                    <div class="table-empty">
                        <div class="table-empty-icon">${ICONS.alert}</div>
                        <div>Failed to load budgets: ${escapeHtml(error.message || 'Unknown error')}</div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Open create or edit modal for a budget.
     * @param {object|null} budget
     */
    async function openBudgetModal(budget = null) {
        const isEdit = Boolean(budget && budget.id);
        const title = isEdit ? `Edit Budget #${budget.id}` : 'Add New Budget';

        // Ensure warehouses are available for the dropdown
        if (!warehousesList || warehousesList.length === 0) {
            try {
                const warehouses = await api.warehouses.list();
                warehousesList = Array.isArray(warehouses) ? warehouses : [];
            } catch (err) {
                console.error('Failed to load warehouses for modal dropdown', err);
            }
        }

        const warehouseOptions = warehousesList.map(w => ({
            value: String(w.id),
            label: w.name ? `${w.name}` : `Warehouse #${w.id}`
        }));

        const bodyHtml = `
            ${formField({
                name: 'warehouse',
                label: 'Warehouse',
                type: 'select',
                required: true,
                value: budget?.warehouse?.id != null ? String(budget.warehouse.id) : '',
                options: warehouseOptions
            })}
            ${formField({
                name: 'budgetAmount',
                label: 'Budget Amount',
                type: 'number',
                required: true,
                value: budget?.budgetAmount ?? '',
                placeholder: '0.01',
                attrs: { step: '0.01', min: '0.01' }
            })}
            ${formField({
                name: 'spentAmount',
                label: 'Spent Amount',
                type: 'number',
                required: true,
                value: budget?.spentAmount ?? 0,
                placeholder: '0.00',
                attrs: { step: '0.01', min: '0.00' }
            })}
            ${formField({
                name: 'periodStart',
                label: 'Period Start',
                type: 'date',
                required: true,
                value: budget?.periodStart ? String(budget.periodStart).split('T')[0] : ''
            })}
            ${formField({
                name: 'periodEnd',
                label: 'Period End',
                type: 'date',
                required: true,
                value: budget?.periodEnd ? String(budget.periodEnd).split('T')[0] : ''
            })}
            ${formField({
                name: 'status',
                label: 'Status',
                type: 'select',
                required: true,
                value: budget?.status || 'ACTIVE',
                options: [
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'EXHAUSTED', label: 'Exhausted' },
                    { value: 'CLOSED', label: 'Closed' }
                ]
            })}
        `;

        showModal({
            title,
            bodyHtml,
            submitLabel: isEdit ? 'Update Budget' : 'Create Budget',
            onSubmit: async (modalBody, closeModal) => {
                const formData = getFormData(modalBody);

                // Basic client-side validation
                if (!formData.warehouse) {
                    showFormErrors(modalBody, { warehouse: 'Warehouse is required' });
                    return;
                }

                if (formData.budgetAmount === '' || isNaN(formData.budgetAmount) || formData.budgetAmount < 0.01) {
                    showFormErrors(modalBody, { budgetAmount: 'Budget amount must be at least 0.01' });
                    return;
                }

                if (formData.spentAmount === '' || isNaN(formData.spentAmount) || formData.spentAmount < 0) {
                    showFormErrors(modalBody, { spentAmount: 'Spent amount must be at least 0.00' });
                    return;
                }

                if (!formData.periodStart) {
                    showFormErrors(modalBody, { periodStart: 'Period start date is required' });
                    return;
                }

                if (!formData.periodEnd) {
                    showFormErrors(modalBody, { periodEnd: 'Period end date is required' });
                    return;
                }

                if (formData.periodStart > formData.periodEnd) {
                    showFormErrors(modalBody, { periodEnd: 'Period end date must be on or after period start date' });
                    return;
                }

                if (!formData.status) {
                    showFormErrors(modalBody, { status: 'Status is required' });
                    return;
                }

                const payload = {
                    warehouse: { id: Number(formData.warehouse) },
                    budgetAmount: formData.budgetAmount,
                    spentAmount: formData.spentAmount !== '' ? formData.spentAmount : 0,
                    periodStart: formData.periodStart,
                    periodEnd: formData.periodEnd,
                    status: formData.status
                };

                try {
                    if (isEdit) {
                        await api.budgets.update(budget.id, payload);
                        showToast('Budget updated successfully', 'success');
                    } else {
                        await api.budgets.create(payload);
                        showToast('Budget created successfully', 'success');
                    }
                    closeModal();
                    await loadData();
                } catch (error) {
                    showToast(error.message || 'Operation failed', 'error');
                    if (error.validationErrors) {
                        const errors = { ...error.validationErrors };
                        if (errors['warehouse.id'] && !errors['warehouse']) {
                            errors['warehouse'] = errors['warehouse.id'];
                        }
                        showFormErrors(modalBody, errors);
                    }
                }
            }
        });
    }

    /**
     * Handle budget deletion.
     * @param {object} budget
     */
    function handleDelete(budget) {
        showConfirm(`Are you sure you want to delete budget #${budget.id}?`, async () => {
            try {
                await api.budgets.delete(budget.id);
                showToast('Budget deleted successfully', 'success');
                await loadData();
            } catch (error) {
                showToast(error.message || 'Failed to delete budget', 'error');
            }
        });
    }

    addBtn.addEventListener('click', () => openBudgetModal());

    await loadData();
}
