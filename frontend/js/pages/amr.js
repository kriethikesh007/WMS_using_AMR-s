/* ============================================
   WMS — Autonomous Mobile Robot (AMR) Module
   ============================================ */

import api from '../api.js';
import { formatDate, formatDateTime, formatCurrency, formatNumber, formatEnum, getStatusColor, escapeHtml } from '../utils.js';
import { showToast, statusBadge, buildTable, formField, getFormData, showFormErrors, statCard, showLoading, ICONS } from '../components.js';
import { showModal, showConfirm } from '../modal.js';

const AMR_STATUS_OPTIONS = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'BUSY', label: 'Busy' },
    { value: 'CHARGING', label: 'Charging' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'OFFLINE', label: 'Offline' }
];

export async function render(container) {
    container.innerHTML = `
        <div class="page-container animate-fade-in">
            <div class="page-header">
                <div class="page-header-title">
                    <h1 class="page-title">AMR Robot Fleet</h1>
                    <p class="page-subtitle text-muted">Manage Autonomous Mobile Robots, battery health, and real-time bay locations</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-add-amr">
                        ${ICONS.plus} Add Robot
                    </button>
                </div>
            </div>
            <div id="amr-stats" class="stats-grid"></div>
            <div id="amr-table-container"></div>
        </div>
    `;

    const statsContainer = container.querySelector('#amr-stats');
    const tableContainer = container.querySelector('#amr-table-container');
    const addBtn = container.querySelector('#btn-add-amr');

    let warehouses = [];
    let bins = [];

    addBtn.addEventListener('click', () => openModal());

    function renderStats(amrs) {
        const total = amrs.length;
        const available = amrs.filter(a => a.status === 'AVAILABLE').length;
        const busy = amrs.filter(a => a.status === 'BUSY').length;
        const charging = amrs.filter(a => a.status === 'CHARGING').length;
        const offlineOrMaint = amrs.filter(a => ['MAINTENANCE', 'OFFLINE'].includes(a.status)).length;

        statsContainer.innerHTML = `
            ${statCard('Total Robots', total, ICONS.robot, 'primary')}
            ${statCard('Available', available, ICONS.check, 'status-success')}
            ${statCard('Active / Busy', busy, ICONS.zap, 'status-warning')}
            ${statCard('Charging / Docked', charging, ICONS.battery, 'accent-violet')}
            ${statCard('Offline / Maint', offlineOrMaint, ICONS.alert, 'status-danger')}
        `;
    }

    function renderTable(amrs) {
        tableContainer.innerHTML = '';

        const table = buildTable({
            columns: [
                {
                    key: 'id',
                    label: 'ID'
                },
                {
                    key: 'robotCode',
                    label: 'Robot Code',
                    render: (row) => `<strong class="font-mono text-primary">${escapeHtml(row.robotCode || '—')}</strong>`
                },
                {
                    key: 'status',
                    label: 'Status',
                    render: (row) => statusBadge(row.status)
                },
                {
                    key: 'batteryLevel',
                    label: 'Battery Level',
                    render: (row) => {
                        const level = row.batteryLevel != null ? Math.max(0, Math.min(100, Number(row.batteryLevel))) : 0;
                        const batteryClass = level >= 60 ? 'high' : level >= 25 ? 'medium' : 'low';
                        return `
                            <div class="battery-indicator">
                                <div class="battery-bar"><div class="battery-fill ${batteryClass}" style="width:${level}%"></div></div>
                                <span class="font-semibold">${level}%</span>
                            </div>
                        `;
                    }
                },
                {
                    key: 'warehouse',
                    label: 'Assigned Warehouse',
                    render: (row) => row.warehouse?.name ? escapeHtml(row.warehouse.name) : '<span class="text-muted">—</span>'
                },
                {
                    key: 'currentBin',
                    label: 'Docking / Current Bin',
                    render: (row) => row.currentBin?.binCode ? `<code class="font-mono">${escapeHtml(row.currentBin.binCode)}</code>` : '<span class="text-muted">In Transit</span>'
                },
                {
                    key: 'createdAt',
                    label: 'Registered On',
                    render: (row) => row.createdAt ? formatDateTime(row.createdAt) : '<span class="text-muted">—</span>'
                }
            ],
            data: amrs,
            onEdit: (amr) => openModal(amr),
            onDelete: (amr) => handleDelete(amr),
            emptyMessage: 'No AMRs registered in fleet. Click "+ Add Robot" to commission a new unit.'
        });

        tableContainer.appendChild(table);
    }

    async function openModal(amr = null) {
        const isEdit = Boolean(amr);

        try {
            const [whData, binData] = await Promise.all([
                api.warehouses.list().catch(() => []),
                api.bins.list().catch(() => [])
            ]);
            warehouses = Array.isArray(whData) ? whData : [];
            bins = Array.isArray(binData) ? binData : [];
        } catch (err) {
            console.warn('Failed to load dependency data for AMR modal:', err);
        }

        const warehouseOptions = warehouses.map(w => ({
            value: String(w.id),
            label: w.name ? w.name : `Warehouse #${w.id}`
        }));

        const binOptions = bins.map(b => ({
            value: String(b.id),
            label: `${b.binCode} (${b.warehouse?.name || 'Warehouse'})`
        }));

        const bodyHtml = `
            <form id="amr-form">
                ${formField({
                    name: 'robotCode',
                    label: 'Robot Code',
                    type: 'text',
                    required: true,
                    value: amr ? amr.robotCode : '',
                    placeholder: 'e.g. AMR-001'
                })}
                ${formField({
                    name: 'status',
                    label: 'Fleet Status',
                    type: 'select',
                    required: true,
                    value: amr ? amr.status : 'AVAILABLE',
                    options: AMR_STATUS_OPTIONS
                })}
                ${formField({
                    name: 'batteryLevel',
                    label: 'Battery Level (%)',
                    type: 'number',
                    required: true,
                    value: amr && amr.batteryLevel != null ? amr.batteryLevel : 100,
                    placeholder: '0 - 100',
                    attrs: { min: '0', max: '100', step: '1' }
                })}
                ${formField({
                    name: 'warehouse',
                    label: 'Operating Warehouse',
                    type: 'select',
                    required: true,
                    value: amr?.warehouse?.id ? String(amr.warehouse.id) : '',
                    options: warehouseOptions
                })}
                ${formField({
                    name: 'currentBin',
                    label: 'Current / Docked Bin (Optional)',
                    type: 'select',
                    required: false,
                    value: amr?.currentBin?.id ? String(amr.currentBin.id) : '',
                    options: binOptions
                })}
            </form>
        `;

        showModal({
            title: isEdit ? `Edit Robot ${amr.robotCode || '#' + amr.id}` : 'Commission New AMR Unit',
            bodyHtml,
            submitLabel: isEdit ? 'Save Changes' : 'Commission Robot',
            submitClass: 'btn-primary',
            onSubmit: async (body, closeModal) => {
                const formData = getFormData(body);

                if (!formData.robotCode) {
                    showFormErrors(body, { robotCode: 'Robot code is required' });
                    return;
                }
                if (!formData.warehouse) {
                    showFormErrors(body, { warehouse: 'Operating warehouse is required' });
                    return;
                }

                const payload = {
                    robotCode: formData.robotCode ? formData.robotCode.trim() : '',
                    status: formData.status,
                    batteryLevel: formData.batteryLevel !== '' && formData.batteryLevel != null ? Number(formData.batteryLevel) : 100,
                    warehouse: formData.warehouse ? { id: Number(formData.warehouse) } : null,
                    currentBin: formData.currentBin ? { id: Number(formData.currentBin) } : null,
                };

                try {
                    if (isEdit) {
                        await api.amrs.update(amr.id, payload);
                        showToast(`AMR "${payload.robotCode}" updated successfully`, 'success');
                    } else {
                        await api.amrs.create(payload);
                        showToast(`AMR "${payload.robotCode}" commissioned successfully`, 'success');
                    }
                    closeModal();
                    await loadData();
                } catch (error) {
                    showToast(error.message, 'error');
                    if (error.validationErrors) {
                        const formErrors = { ...error.validationErrors };
                        if (formErrors['warehouse.id'] && !formErrors['warehouse']) {
                            formErrors['warehouse'] = formErrors['warehouse.id'];
                        }
                        showFormErrors(body, formErrors);
                    }
                }
            }
        });
    }

    function handleDelete(amr) {
        showConfirm(`Are you sure you want to decommission AMR "${amr.robotCode || amr.id}"?`, async () => {
            try {
                await api.amrs.delete(amr.id);
                showToast(`AMR "${amr.robotCode || amr.id}" decommissioned successfully`, 'success');
                await loadData();
            } catch (error) {
                showToast(error.message || 'Failed to delete AMR', 'error');
            }
        });
    }

    async function loadData() {
        showLoading(tableContainer);
        try {
            const amrs = await api.amrs.list();
            const list = Array.isArray(amrs) ? amrs : [];
            renderStats(list);
            renderTable(list);
        } catch (error) {
            showToast(error.message || 'Failed to load AMR fleet', 'error');
            tableContainer.innerHTML = `
                <div class="table-empty">
                    <div class="table-empty-icon">${ICONS.alert}</div>
                    <div>Failed to load AMRs: ${escapeHtml(error.message)}</div>
                </div>
            `;
        }
    }

    await loadData();
}

export default { render };
