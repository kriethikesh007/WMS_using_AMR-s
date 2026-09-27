/* ============================================
   WMS — Fulfillment & Pick Management Page Module
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
    ICONS,
} from '../components.js';
import { showModal, showConfirm } from '../modal.js';

/**
 * Render the Fulfillment page module.
 * @param {HTMLElement} container
 */
export async function render(container) {
    container.innerHTML = `
        <div class="page-container animate-fade-in">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Fulfillment & Pick Operations</h1>
                    <p class="page-subtitle text-muted">Manage robotic pick execution, AMR robot dispatches, and fulfillment progress</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-create-pick">
                        ${ICONS.plus} Create Pick
                    </button>
                </div>
            </div>

            <div id="fulfillment-stats"></div>

            <div class="page-body" style="margin-top: 1.5rem;">
                <div class="table-toolbar" style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
                    <div style="display: flex; gap: 0.75rem; align-items: center; flex: 1; min-width: 260px;">
                        <input type="text" class="form-input" id="search-picks" placeholder="Search by Order#, AMR, or Pick ID..." style="max-width: 320px;">
                        <select class="form-select" id="filter-pick-status" style="max-width: 180px;">
                            <option value="">All Statuses</option>
                            <option value="CREATED">Created</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                    <button class="btn btn-sm" id="btn-refresh-picks" title="Refresh pick list">${ICONS.refresh} Refresh</button>
                </div>

                <div id="fulfillment-table-container"></div>
            </div>
        </div>
    `;

    const statsContainer = container.querySelector('#fulfillment-stats');
    const tableContainer = container.querySelector('#fulfillment-table-container');
    const btnCreatePick = container.querySelector('#btn-create-pick');
    const btnRefresh = container.querySelector('#btn-refresh-picks');
    const searchInput = container.querySelector('#search-picks');
    const statusFilter = container.querySelector('#filter-pick-status');

    let allPicks = [];
    let searchQuery = '';
    let selectedStatus = '';

    // Bind toolbar listeners
    btnCreatePick.addEventListener('click', () => openCreatePickModal(loadData));
    btnRefresh.addEventListener('click', () => loadData());

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderTableSection();
    });

    statusFilter.addEventListener('change', (e) => {
        selectedStatus = e.target.value;
        renderTableSection();
    });

    /**
     * Load picks data from backend API.
     */
    async function loadData() {
        showLoading(tableContainer);
        try {
            const picks = await api.picks.list();
            allPicks = Array.isArray(picks) ? picks : [];
            renderStats(allPicks);
            renderTableSection();
        } catch (err) {
            showToast(err.message || 'Failed to load fulfillment picks', 'error');
            tableContainer.innerHTML = `
                <div class="table-empty">
                    <div class="table-empty-icon">${ICONS.alert}</div>
                    <div>Failed to load fulfillment picks: ${escapeHtml(err.message || 'Unknown error')}</div>
                    <button class="btn btn-sm" id="btn-retry-load" style="margin-top: 1rem;">Retry</button>
                </div>
            `;
            container.querySelector('#btn-retry-load')?.addEventListener('click', loadData);
        }
    }

    /**
     * Render the 5 required stat cards.
     * @param {Array<object>} picks
     */
    function renderStats(picks) {
        const total = picks.length;
        const created = picks.filter((p) => p.status === 'CREATED').length;
        const inProgress = picks.filter((p) => p.status === 'IN_PROGRESS').length;
        const completed = picks.filter((p) => p.status === 'COMPLETED').length;
        const failed = picks.filter((p) => p.status === 'FAILED').length;

        statsContainer.innerHTML = `
            <div class="stats-grid">
                ${statCard('Total Picks', total, ICONS.product, 'info')}
                ${statCard('Created', created, ICONS.inventory, 'neutral')}
                ${statCard('In Progress', inProgress, ICONS.zap, 'warning')}
                ${statCard('Completed', completed, ICONS.check, 'success')}
                ${statCard('Failed', failed, ICONS.close, 'danger')}
            </div>
        `;
    }

    /**
     * Filter picks according to active search and status filter.
     * @returns {Array<object>}
     */
    function getFilteredPicks() {
        return allPicks.filter((pick) => {
            if (selectedStatus && pick.status !== selectedStatus) {
                return false;
            }
            if (searchQuery) {
                const idMatch = String(pick.id).toLowerCase().includes(searchQuery);
                const orderMatch = (pick.order?.orderNumber || (pick.order?.id ? `order #${pick.order.id}` : ''))
                    .toLowerCase()
                    .includes(searchQuery);
                const amrMatch = (pick.amr?.robotCode || (pick.amr?.id ? `amr #${pick.amr.id}` : ''))
                    .toLowerCase()
                    .includes(searchQuery);
                const statusMatch = (pick.status || '').toLowerCase().includes(searchQuery);
                return idMatch || orderMatch || amrMatch || statusMatch;
            }
            return true;
        });
    }

    /**
     * Render the picks data table.
     */
    function renderTableSection() {
        const filteredPicks = getFilteredPicks();

        const columns = [
            {
                key: 'id',
                label: 'ID',
                render: (row) => `
                    <button class="btn btn-sm btn-ghost" data-pick-action="view-timeline" data-pick-id="${row.id}" title="Click to view pick timeline" style="font-weight: 600; cursor: pointer; text-decoration: underline; background: none; border: none; color: inherit; padding: 0;">
                        #${escapeHtml(row.id)} ⏱️
                    </button>
                `,
            },
            {
                key: 'order',
                label: 'Order#',
                render: (row) => {
                    if (!row.order) return '<span class="text-muted">—</span>';
                    const orderText = row.order.orderNumber || `#${row.order.id}`;
                    return `<span style="font-weight: 500;">${escapeHtml(orderText)}</span>`;
                },
            },
            {
                key: 'amr',
                label: 'AMR',
                render: (row) => {
                    if (!row.amr) return '<span class="text-muted">Unassigned</span>';
                    const code = row.amr.robotCode || `AMR #${row.amr.id}`;
                    return `<span>${escapeHtml(code)}</span>`;
                },
            },
            {
                key: 'status',
                label: 'Status',
                render: (row) => statusBadge(row.status),
            },
            {
                key: 'createdAt',
                label: 'Created',
                render: (row) => (row.createdAt ? formatDateTime(row.createdAt) : '<span class="text-muted">—</span>'),
            },
            {
                key: 'assignedAt',
                label: 'Assigned',
                render: (row) => {
                    if (!row.assignedAt) return '<span class="text-muted">—</span>';
                    const time = formatDateTime(row.assignedAt);
                    const robot = row.amr?.robotCode
                        ? ` <small class="text-muted">(${escapeHtml(row.amr.robotCode)})</small>`
                        : '';
                    return `<span>${time}${robot}</span>`;
                },
            },
            {
                key: 'startedAt',
                label: 'Started',
                render: (row) => (row.startedAt ? formatDateTime(row.startedAt) : '<span class="text-muted">—</span>'),
            },
            {
                key: 'completedAt',
                label: 'Completed',
                render: (row) => {
                    if (!row.completedAt) return '<span class="text-muted">—</span>';
                    const time = formatDateTime(row.completedAt);
                    const failTag = row.status === 'FAILED' ? ' <small class="text-danger">(Failed)</small>' : '';
                    return `<span>${time}${failTag}</span>`;
                },
            },
            {
                key: 'actions',
                label: 'Actions',
                render: (row) => {
                    if (row.status === 'CREATED') {
                        return `
                            <div class="table-actions">
                                <button class="btn btn-sm btn-primary" data-pick-action="assign-amr" data-pick-id="${row.id}">
                                    Assign AMR
                                </button>
                            </div>
                        `;
                    }
                    if (row.status === 'ASSIGNED') {
                        return `
                            <div class="table-actions">
                                <button class="btn btn-sm btn-info" data-pick-action="start-pick" data-pick-id="${row.id}">
                                    Start Pick
                                </button>
                            </div>
                        `;
                    }
                    if (row.status === 'IN_PROGRESS') {
                        return `
                            <div class="table-actions">
                                <button class="btn btn-sm btn-success" data-pick-action="complete-pick" data-pick-id="${row.id}">
                                    Complete
                                </button>
                                <button class="btn btn-sm btn-danger" data-pick-action="fail-pick" data-pick-id="${row.id}">
                                    Fail
                                </button>
                            </div>
                        `;
                    }
                    // COMPLETED / FAILED → no action buttons
                    return '<span class="text-muted">—</span>';
                },
            },
        ];

        const tableElement = buildTable({
            columns,
            data: filteredPicks,
            emptyMessage: searchQuery || selectedStatus ? 'No matching picks found' : 'No fulfillment picks found',
        });

        // Event delegation for table action buttons
        tableElement.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-pick-action]');
            if (!btn) return;

            const action = btn.dataset.pickAction;
            const pickId = btn.dataset.pickId;
            const pick = allPicks.find((p) => String(p.id) === String(pickId));
            if (!pick) return;

            if (action === 'assign-amr') {
                openAssignAMRModal(pick, loadData);
            } else if (action === 'start-pick') {
                handleStartPick(pick.id);
            } else if (action === 'complete-pick') {
                handleCompletePick(pick.id);
            } else if (action === 'fail-pick') {
                handleFailPick(pick.id);
            } else if (action === 'view-timeline') {
                openTimelineModal(pick);
            }
        });

        tableContainer.innerHTML = '';
        tableContainer.appendChild(tableElement);
    }

    /**
     * Open modal to create a new pick for a PROCESSING order.
     * @param {function} onSuccess
     */
    async function openCreatePickModal(onSuccess) {
        try {
            const orders = await api.orders.list();
            const orderList = Array.isArray(orders) ? orders : [];
            const processingOrders = orderList.filter((o) => o.status === 'PROCESSING');

            if (processingOrders.length === 0) {
                showToast('No orders currently in PROCESSING status available for picking', 'warning');
                return;
            }

            const orderOptions = processingOrders.map((o) => ({
                value: String(o.id),
                label: `${o.orderNumber || `Order #${o.id}`} (ID: ${o.id})`,
            }));

            const bodyHtml = `
                <div class="form-container">
                    ${formField({
                        name: 'orderId',
                        label: 'Select Processing Order',
                        type: 'select',
                        required: true,
                        options: orderOptions,
                    })}
                </div>
            `;

            showModal({
                title: 'Create Pick Task',
                bodyHtml,
                submitLabel: 'Create Pick',
                submitClass: 'btn-primary',
                onSubmit: async (modalBody, closeModal) => {
                    const formData = getFormData(modalBody);
                    if (!formData.orderId) {
                        showFormErrors(modalBody, { orderId: 'Please select an order' });
                        return;
                    }

                    try {
                        await api.picks.create(formData.orderId);
                        showToast('Pick task created successfully', 'success');
                        closeModal();
                        if (onSuccess) onSuccess();
                    } catch (err) {
                        showToast(err.message || 'Failed to create pick', 'error');
                        if (err.validationErrors) {
                            showFormErrors(modalBody, err.validationErrors);
                        }
                    }
                },
            });
        } catch (err) {
            showToast(err.message || 'Failed to load orders', 'error');
        }
    }

    /**
     * Open modal to assign an AVAILABLE AMR to a CREATED pick.
     * @param {object} pick
     * @param {function} onSuccess
     */
    async function openAssignAMRModal(pick, onSuccess) {
        try {
            const amrs = await api.amrs.list();
            const amrList = Array.isArray(amrs) ? amrs : [];
            const availableAmrs = amrList.filter((a) => a.status === 'AVAILABLE');

            if (availableAmrs.length === 0) {
                showToast('No AVAILABLE AMRs currently available for assignment', 'warning');
                return;
            }

            const amrOptions = availableAmrs.map((a) => ({
                value: String(a.id),
                label: `${a.robotCode || `AMR #${a.id}`}${a.batteryLevel != null ? ` (Battery: ${a.batteryLevel}%)` : ''}`,
            }));

            const bodyHtml = `
                <div class="form-container">
                    <p class="text-muted" style="margin-bottom: 1rem;">
                        Assign an autonomous robot to Pick <strong>#${escapeHtml(pick.id)}</strong>
                        (Order: <strong>${escapeHtml(pick.order?.orderNumber || (pick.order?.id ? `#${pick.order.id}` : '—'))}</strong>).
                    </p>
                    ${formField({
                        name: 'amrId',
                        label: 'Select Available AMR',
                        type: 'select',
                        required: true,
                        options: amrOptions,
                    })}
                </div>
            `;

            showModal({
                title: `Assign AMR — Pick #${pick.id}`,
                bodyHtml,
                submitLabel: 'Assign Robot',
                submitClass: 'btn-primary',
                onSubmit: async (modalBody, closeModal) => {
                    const formData = getFormData(modalBody);
                    if (!formData.amrId) {
                        showFormErrors(modalBody, { amrId: 'Please select an AMR' });
                        return;
                    }

                    try {
                        await api.picks.assignAMR(pick.id, formData.amrId);
                        showToast(`AMR assigned to Pick #${pick.id} successfully`, 'success');
                        closeModal();
                        if (onSuccess) onSuccess();
                    } catch (err) {
                        showToast(err.message || 'Failed to assign AMR', 'error');
                        if (err.validationErrors) {
                            showFormErrors(modalBody, err.validationErrors);
                        }
                    }
                },
            });
        } catch (err) {
            showToast(err.message || 'Failed to load AMRs', 'error');
        }
    }

    /**
     * Start pick action (ASSIGNED -> IN_PROGRESS).
     * @param {number|string} pickId
     */
    async function handleStartPick(pickId) {
        try {
            await api.picks.start(pickId);
            showToast(`Pick #${pickId} started successfully`, 'success');
            loadData();
        } catch (err) {
            showToast(err.message || 'Failed to start pick', 'error');
        }
    }

    /**
     * Complete pick action (IN_PROGRESS -> COMPLETED).
     * @param {number|string} pickId
     */
    async function handleCompletePick(pickId) {
        try {
            await api.picks.complete(pickId);
            showToast(`Pick #${pickId} completed successfully`, 'success');
            loadData();
        } catch (err) {
            showToast(err.message || 'Failed to complete pick', 'error');
        }
    }

    /**
     * Fail pick action (IN_PROGRESS -> FAILED).
     * @param {number|string} pickId
     */
    function handleFailPick(pickId) {
        showConfirm(`Are you sure you want to mark Pick #${pickId} as FAILED?`, async () => {
            try {
                await api.picks.fail(pickId);
                showToast(`Pick #${pickId} marked as failed`, 'warning');
                loadData();
            } catch (err) {
                showToast(err.message || 'Failed to update pick status', 'error');
            }
        });
    }

    /**
     * Show timeline modal for a pick.
     * @param {object} pick
     */
    function openTimelineModal(pick) {
        const isCreated = !!pick.createdAt;
        const isAssigned = !!pick.assignedAt;
        const isStarted = !!pick.startedAt;
        const isCompleted = pick.status === 'COMPLETED';
        const isFailed = pick.status === 'FAILED';
        const hasEnded = !!pick.completedAt;

        const steps = [
            {
                title: 'Created',
                desc: pick.createdAt ? formatDateTime(pick.createdAt) : 'Awaiting creation',
                state: isCreated ? 'completed' : 'pending',
                icon: '📋',
            },
            {
                title: 'Assigned',
                desc: pick.assignedAt
                    ? `${formatDateTime(pick.assignedAt)}${pick.amr?.robotCode ? ` (AMR: ${escapeHtml(pick.amr.robotCode)})` : ''}`
                    : 'Pending robot assignment',
                state: isAssigned ? 'completed' : (pick.status === 'CREATED' ? 'current' : 'pending'),
                icon: '🤖',
            },
            {
                title: 'Started',
                desc: pick.startedAt ? formatDateTime(pick.startedAt) : 'Pending pick execution',
                state: isStarted ? 'completed' : (pick.status === 'ASSIGNED' ? 'current' : 'pending'),
                icon: '⚡',
            },
            {
                title: isFailed ? 'Failed' : 'Completed',
                desc: pick.completedAt ? formatDateTime(pick.completedAt) : (isFailed ? 'Failed' : 'Pending completion'),
                state: isFailed ? 'failed' : (isCompleted ? 'completed' : (pick.status === 'IN_PROGRESS' ? 'current' : 'pending')),
                icon: isFailed ? '❌' : (isCompleted ? '✅' : '🏁'),
            },
        ];

        const stepsHtml = steps.map((s, idx) => {
            let borderColor = 'rgba(255, 255, 255, 0.15)';
            if (s.state === 'completed') {
                borderColor = 'var(--success, #10b981)';
            } else if (s.state === 'current') {
                borderColor = 'var(--accent-cyan, #00d2ff)';
            } else if (s.state === 'failed') {
                borderColor = 'var(--danger, #ef4444)';
            }

            return `
                <div class="timeline-step" style="display: flex; gap: 1rem; position: relative;">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <div style="width: 2.25rem; height: 2.25rem; border-radius: 50%; border: 2px solid ${borderColor}; background: rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; font-size: 1rem; z-index: 2;">
                            ${s.icon}
                        </div>
                        ${idx < steps.length - 1 ? `<div style="width: 2px; flex: 1; min-height: 2rem; background: ${s.state === 'completed' ? 'var(--success, #10b981)' : 'rgba(255,255,255,0.1)'};"></div>` : ''}
                    </div>
                    <div style="padding-bottom: ${idx < steps.length - 1 ? '1.5rem' : '0.5rem'}; flex: 1;">
                        <div style="font-weight: 600; font-size: 0.95rem; color: ${s.state === 'current' ? 'var(--accent-cyan, #00d2ff)' : 'inherit'};">
                            ${escapeHtml(s.title)}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted, #94a3b8); margin-top: 0.2rem;">
                            ${s.desc}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const bodyHtml = `
            <div class="pick-timeline-details" style="padding: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.05em;">Order</div>
                        <div style="font-weight: 600; font-size: 1rem;">${escapeHtml(pick.order?.orderNumber || (pick.order?.id ? `Order #${pick.order.id}` : '—'))}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.05em;">Assigned Robot</div>
                        <div style="font-weight: 600; font-size: 1rem;">${pick.amr?.robotCode ? escapeHtml(pick.amr.robotCode) : '<span class="text-muted">Unassigned</span>'}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.8rem; color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.05em;">Status</div>
                        <div style="margin-top: 0.2rem;">${statusBadge(pick.status)}</div>
                    </div>
                </div>

                <div class="timeline-steps" style="margin-top: 1rem;">
                    ${stepsHtml}
                </div>
            </div>
        `;

        showModal({
            title: `Pick #${pick.id} Timeline`,
            bodyHtml,
        });
    }

    // Initial load
    await loadData();
}

export default { render };
