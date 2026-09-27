/* ============================================
   WMS — Bin Management Page Module
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
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'OCCUPIED', label: 'Occupied' },
    { value: 'FULL', label: 'Full' },
    { value: 'INACTIVE', label: 'Inactive' },
];

/**
 * Render the Bins management page into the given container.
 * @param {HTMLElement} container
 */
export async function render(container) {
    let bins = [];
    let warehouses = [];

    // Base layout
    container.innerHTML = `
        <div class="page-container animate-fade-in">
            <div class="page-header">
                <div class="page-header-text">
                    <h1 class="page-title">Storage Bins</h1>
                    <p class="page-subtitle text-muted">Manage warehouse bin locations, capacities, and stock assignments</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-add-bin">
                        ${ICONS.plus} Add Bin
                    </button>
                </div>
            </div>
            <div class="stats-grid" id="bin-stats"></div>
            <div class="table-section" id="bin-table-wrapper"></div>
        </div>
    `;

    const addBtn = container.querySelector('#btn-add-bin');
    addBtn.addEventListener('click', () => openBinModal());

    const statsContainer = container.querySelector('#bin-stats');
    const tableWrapper = container.querySelector('#bin-table-wrapper');

    /**
     * Fetch bins and warehouses from the API and refresh UI.
     */
    async function loadData() {
        showLoading(tableWrapper);

        try {
            const [binsData, warehousesData] = await Promise.all([
                api.bins.list(),
                api.warehouses.list().catch(() => []),
            ]);

            bins = Array.isArray(binsData) ? binsData : [];
            warehouses = Array.isArray(warehousesData) ? warehousesData : [];

            renderStats(bins);
            renderTable(bins);
        } catch (error) {
            console.error('Failed to load bins data:', error);
            showToast(error.message || 'Failed to load bins', 'error');
            tableWrapper.innerHTML = `
                <div class="table-empty">
                    <div class="table-empty-icon">${ICONS.alert}</div>
                    <div>${escapeHtml(error.message || 'Failed to load bins')}</div>
                    <button class="btn btn-sm mt-3" id="btn-retry-bins">Retry</button>
                </div>
            `;
            tableWrapper.querySelector('#btn-retry-bins')?.addEventListener('click', loadData);
        }
    }

    /**
     * Render the stat cards summarizing bin metrics.
     * @param {Array<object>} data
     */
    function renderStats(data) {
        const total = data.length;
        const available = data.filter(b => b.status === 'AVAILABLE').length;
        const occupied = data.filter(b => b.status === 'OCCUPIED').length;
        const full = data.filter(b => b.status === 'FULL').length;

        statsContainer.innerHTML = `
            ${statCard('Total Bins', total, ICONS.bin, 'primary')}
            ${statCard('Available', available, ICONS.check, 'emerald')}
            ${statCard('Occupied', occupied, ICONS.refresh, 'amber')}
            ${statCard('Full', full, ICONS.alert, 'rose')}
        `;
    }

    /**
     * Render the data table for bins.
     * @param {Array<object>} data
     */
    function renderTable(data) {
        tableWrapper.innerHTML = '';

        const table = buildTable({
            columns: [
                {
                    key: 'id',
                    label: 'ID',
                },
                {
                    key: 'binCode',
                    label: 'Bin Code',
                    render: (row) => `<strong>${escapeHtml(row.binCode || '—')}</strong>`,
                },
                {
                    key: 'location',
                    label: 'Location',
                    render: (row) => escapeHtml(row.location || '—'),
                },
                {
                    key: 'capacity',
                    label: 'Capacity',
                    render: (row) => row.capacity != null
                        ? (typeof formatNumber === 'function' ? formatNumber(row.capacity) : row.capacity)
                        : '<span class="text-muted">—</span>',
                },
                {
                    key: 'status',
                    label: 'Status',
                    render: (row) => statusBadge(row.status),
                },
                {
                    key: 'warehouse.name',
                    label: 'Warehouse',
                    render: (row) => escapeHtml(row.warehouse?.name || '—'),
                },
            ],
            data,
            onEdit: (bin) => openBinModal(bin),
            onDelete: (bin) => handleDeleteBin(bin),
            emptyMessage: 'No bins found. Click "+ Add Bin" to create one.',
        });

        tableWrapper.appendChild(table);
    }

    /**
     * Open create or edit modal for a bin.
     * @param {object|null} bin - Existing bin object if editing, null if creating
     */
    async function openBinModal(bin = null) {
        const isEdit = Boolean(bin && bin.id);

        // Ensure warehouses list is available for selection
        if (!warehouses || warehouses.length === 0) {
            try {
                const fetched = await api.warehouses.list();
                if (Array.isArray(fetched)) warehouses = fetched;
            } catch (_) {
                // Ignore fallback to empty list
            }
        }

        const warehouseOptions = warehouses.map(w => ({
            value: String(w.id),
            label: w.name ? `${w.name}` : `Warehouse #${w.id}`,
        }));

        const bodyHtml = `
            <form id="bin-form" onsubmit="return false;">
                ${formField({
                    name: 'binCode',
                    label: 'Bin Code',
                    type: 'text',
                    required: true,
                    value: isEdit ? (bin.binCode || '') : '',
                    placeholder: 'e.g. BIN-A-101',
                })}
                ${formField({
                    name: 'location',
                    label: 'Location',
                    type: 'text',
                    required: true,
                    value: isEdit ? (bin.location || '') : '',
                    placeholder: 'e.g. Aisle 1, Shelf A',
                })}
                ${formField({
                    name: 'capacity',
                    label: 'Capacity',
                    type: 'number',
                    required: true,
                    value: isEdit && bin.capacity != null ? bin.capacity : '',
                    placeholder: 'e.g. 100',
                    attrs: { min: '1', step: '1' },
                })}
                ${formField({
                    name: 'status',
                    label: 'Status',
                    type: 'select',
                    required: true,
                    value: isEdit ? (bin.status || 'AVAILABLE') : 'AVAILABLE',
                    options: STATUS_OPTIONS,
                })}
                ${formField({
                    name: 'warehouse',
                    label: 'Warehouse',
                    type: 'select',
                    required: true,
                    value: isEdit && bin.warehouse ? String(bin.warehouse.id) : '',
                    options: warehouseOptions,
                })}
            </form>
        `;

        showModal({
            title: isEdit ? 'Edit Bin' : 'Add New Bin',
            bodyHtml,
            submitLabel: isEdit ? 'Save Changes' : 'Create Bin',
            submitClass: 'btn-primary',
            onSubmit: async (modalBody, closeModal) => {
                const formData = getFormData(modalBody);

                // Client-side validation
                const errors = {};
                if (!formData.binCode || !String(formData.binCode).trim()) {
                    errors.binCode = 'Bin code is required';
                }
                if (!formData.location || !String(formData.location).trim()) {
                    errors.location = 'Location is required';
                }
                if (
                    formData.capacity === '' ||
                    formData.capacity == null ||
                    isNaN(formData.capacity) ||
                    Number(formData.capacity) <= 0
                ) {
                    errors.capacity = 'Capacity must be a positive integer';
                }
                if (!formData.status) {
                    errors.status = 'Status is required';
                }
                if (!formData.warehouse) {
                    errors.warehouse = 'Warehouse is required';
                }

                if (Object.keys(errors).length > 0) {
                    showFormErrors(modalBody, errors);
                    return;
                }

                const payload = {
                    binCode: String(formData.binCode).trim(),
                    location: String(formData.location).trim(),
                    capacity: parseInt(formData.capacity, 10),
                    status: formData.status,
                    warehouse: {
                        id: parseInt(formData.warehouse, 10),
                    },
                };

                try {
                    if (isEdit) {
                        await api.bins.update(bin.id, payload);
                        showToast('Bin updated successfully', 'success');
                    } else {
                        await api.bins.create(payload);
                        showToast('Bin created successfully', 'success');
                    }
                    closeModal();
                    await loadData();
                } catch (error) {
                    showToast(error.message || 'Failed to save bin', 'error');
                    if (error.validationErrors) {
                        const fieldErrors = { ...error.validationErrors };
                        if (fieldErrors['warehouse.id'] && !fieldErrors['warehouse']) {
                            fieldErrors['warehouse'] = fieldErrors['warehouse.id'];
                        }
                        showFormErrors(modalBody, fieldErrors);
                    }
                }
            },
        });
    }

    /**
     * Handle bin deletion with user confirmation.
     * @param {object} bin
     */
    function handleDeleteBin(bin) {
        showConfirm(`Are you sure you want to delete bin "${bin.binCode || bin.id}"?`, async () => {
            try {
                await api.bins.delete(bin.id);
                showToast(`Bin "${bin.binCode || bin.id}" deleted successfully`, 'success');
                await loadData();
            } catch (error) {
                showToast(error.message || 'Failed to delete bin', 'error');
            }
        });
    }

    // Initial data load
    await loadData();
}

export default { render };
