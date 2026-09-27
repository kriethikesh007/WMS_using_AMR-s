/* ============================================
   WMS — Warehouse Page Module
   ============================================ */

import api from '../api.js';
import {
    formatDate,
    formatDateTime,
    formatCurrency,
    formatNumber,
    formatEnum,
    getStatusColor,
    escapeHtml,
} from '../utils.js';
import {
    showToast,
    statusBadge,
    buildTable,
    formField,
    getFormData,
    showFormErrors,
    statCard,
    showLoading,
    ICONS
} from '../components.js';
import { showModal, showConfirm } from '../modal.js';

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
];

/**
 * Build warehouse form fields HTML.
 * @param {object} [warehouse]
 * @returns {string} HTML string
 */
function getWarehouseFormHtml(warehouse = null) {
    return `
        ${formField({
            name: 'name',
            label: 'Name',
            type: 'text',
            required: true,
            value: warehouse ? warehouse.name : '',
            placeholder: 'Enter warehouse name',
        })}
        ${formField({
            name: 'location',
            label: 'Location',
            type: 'text',
            required: true,
            value: warehouse ? warehouse.location : '',
            placeholder: 'Enter warehouse location',
        })}
        ${formField({
            name: 'capacity',
            label: 'Capacity',
            type: 'number',
            required: true,
            value: warehouse && warehouse.capacity != null ? warehouse.capacity : '',
            placeholder: 'Enter capacity',
            attrs: { min: '1', step: '1' },
        })}
        ${formField({
            name: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            value: warehouse ? warehouse.status : 'ACTIVE',
            options: STATUS_OPTIONS,
        })}
    `;
}

/**
 * Render the Warehouse management page.
 * @param {HTMLElement} container
 */
export async function render(container) {
    container.innerHTML = `
        <div class="page-container animate-fade-in">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Warehouses</h1>
                    <p class="page-subtitle text-muted">Manage fulfillment centers, capacity allocations, and facility operations</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-add-warehouse">
                        ${ICONS.plus} Add Facility
                    </button>
                </div>
            </div>
            <div id="warehouse-stats" class="stats-grid"></div>
            <div id="warehouse-table-container"></div>
        </div>
    `;

    const statsContainer = container.querySelector('#warehouse-stats');
    const tableContainer = container.querySelector('#warehouse-table-container');
    const addBtn = container.querySelector('#btn-add-warehouse');

    addBtn.addEventListener('click', () => openCreateModal());

    /**
     * Render statistics cards.
     * @param {Array<object>} warehouses
     */
    function renderStats(warehouses) {
        const list = Array.isArray(warehouses) ? warehouses : [];
        const total = list.length;
        const active = list.filter(w => w.status === 'ACTIVE').length;
        const inactive = list.filter(w => w.status === 'INACTIVE').length;
        const maintenance = list.filter(w => w.status === 'MAINTENANCE').length;

        statsContainer.innerHTML = `
            ${statCard('Total Warehouses', total, ICONS.warehouse, 'primary')}
            ${statCard('Active', active, ICONS.check, 'success')}
            ${statCard('Inactive', inactive, ICONS.alert, 'danger')}
            ${statCard('Maintenance', maintenance, ICONS.alert, 'warning')}
        `;
    }

    /**
     * Render the data table.
     * @param {Array<object>} warehouses
     */
    function renderTable(warehouses) {
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'location', label: 'Location' },
            {
                key: 'capacity',
                label: 'Capacity',
                render: (row) => formatNumber(row.capacity),
            },
            {
                key: 'status',
                label: 'Status',
                render: (row) => statusBadge(row.status),
            },
            {
                key: 'createdAt',
                label: 'Created At',
                render: (row) => formatDateTime(row.createdAt),
            },
        ];

        const tableEl = buildTable({
            columns,
            data: warehouses,
            emptyMessage: 'No warehouses found',
            onEdit: (warehouse) => openEditModal(warehouse),
            onDelete: (warehouse) => handleDelete(warehouse),
        });

        tableContainer.innerHTML = '';
        tableContainer.appendChild(tableEl);
    }

    /**
     * Fetch warehouse data and update UI.
     */
    async function loadData() {
        showLoading(tableContainer);
        try {
            const warehouses = await api.warehouses.list();
            renderStats(warehouses);
            renderTable(warehouses);
        } catch (error) {
            showToast(error.message, 'error');
            tableContainer.innerHTML = `
                <div class="table-empty">
                    <div class="table-empty-icon">${ICONS.alert}</div>
                    <div>Failed to load warehouses: ${escapeHtml(error.message)}</div>
                </div>
            `;
        }
    }

    /**
     * Open modal to create a new warehouse.
     */
    function openCreateModal() {
        showModal({
            title: 'Add New Warehouse',
            bodyHtml: getWarehouseFormHtml(),
            submitLabel: 'Create',
            submitClass: 'btn-primary',
            onSubmit: async (modalBody, closeModal) => {
                const formData = getFormData(modalBody);
                const payload = {
                    name: formData.name,
                    location: formData.location,
                    capacity: typeof formData.capacity === 'number' && !isNaN(formData.capacity) ? formData.capacity : null,
                    status: formData.status,
                };

                try {
                    await api.warehouses.create(payload);
                    showToast('Warehouse created successfully', 'success');
                    closeModal();
                    await loadData();
                } catch (error) {
                    showToast(error.message, 'error');
                    if (error.validationErrors) {
                        showFormErrors(modalBody, error.validationErrors);
                    }
                }
            },
        });
    }

    /**
     * Open modal to edit an existing warehouse.
     * @param {object} warehouse
     */
    function openEditModal(warehouse) {
        showModal({
            title: 'Edit Warehouse',
            bodyHtml: getWarehouseFormHtml(warehouse),
            submitLabel: 'Save Changes',
            submitClass: 'btn-primary',
            onSubmit: async (modalBody, closeModal) => {
                const formData = getFormData(modalBody);
                const payload = {
                    name: formData.name,
                    location: formData.location,
                    capacity: typeof formData.capacity === 'number' && !isNaN(formData.capacity) ? formData.capacity : null,
                    status: formData.status,
                };

                try {
                    await api.warehouses.update(warehouse.id, payload);
                    showToast('Warehouse updated successfully', 'success');
                    closeModal();
                    await loadData();
                } catch (error) {
                    showToast(error.message, 'error');
                    if (error.validationErrors) {
                        showFormErrors(modalBody, error.validationErrors);
                    }
                }
            },
        });
    }

    /**
     * Confirm and delete warehouse.
     * @param {object} warehouse
     */
    function handleDelete(warehouse) {
        showConfirm(`Are you sure you want to delete warehouse "${warehouse.name}"?`, async () => {
            try {
                await api.warehouses.delete(warehouse.id);
                showToast('Warehouse deleted successfully', 'success');
                await loadData();
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    await loadData();
}
