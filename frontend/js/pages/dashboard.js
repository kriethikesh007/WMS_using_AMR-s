/* ============================================
   NEXORA WMS — Dashboard Page Module
   ============================================
   Aggregates and displays system-wide metrics,
   real-time AMR fleet status, recent order activity,
   inventory allocation, and pick operations.
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
    statCard,
    showLoading,
    ICONS
} from '../components.js';

/**
 * Safely execute an API call returning an array on error or fallback.
 * Displays a toast notification if a specific module fails.
 * @param {string} name - Module name for error display
 * @param {function} fetcher - Function returning API promise
 * @returns {Promise<Array>}
 */
async function safeFetch(name, fetcher, failureTracker = null) {
    try {
        const response = await fetcher();
        if (Array.isArray(response)) {
            return response;
        }
        if (response && typeof response === 'object' && Array.isArray(response.content)) {
            return response.content;
        }
        return response || [];
    } catch (error) {
        console.warn(`[Dashboard] ${name} unavailable:`, error.message);
        if (failureTracker) failureTracker.push(name);
        return [];
    }
}

/**
 * Helper to get icon and color variable for AMR statuses.
 * @param {string} status
 * @returns {{ label: string, icon: string, color: string }}
 */
function getAmrStatusMeta(status) {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'IDLE':
        case 'STANDBY':
            return { label: 'Idle', icon: ICONS.clock, color: 'primary' };
        case 'BUSY':
        case 'WORKING':
        case 'NAVIGATING':
        case 'PICKING':
            return { label: 'Busy', icon: ICONS.zap, color: 'status-success' };
        case 'ACTIVE':
            return { label: 'Active', icon: ICONS.zap, color: 'status-success' };
        case 'CHARGING':
            return { label: 'Charging', icon: ICONS.battery, color: 'accent-amber' };
        case 'MAINTENANCE':
            return { label: 'Maintenance', icon: ICONS.settings, color: 'accent-orange' };
        case 'OFFLINE':
        case 'ERROR':
        case 'DISABLED':
            return { label: 'Offline', icon: ICONS.alert, color: 'status-danger' };
        default:
            return { label: formatEnum(s), icon: ICONS.robot, color: 'primary' };
    }
}

/**
 * Main render function for the Dashboard page.
 * @param {HTMLElement} container - Target container element
 */
export async function render(container) {
    // 1. Initial page scaffold with header and loading placeholder
    container.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="page-title">Dashboard</h1>
                <p class="page-subtitle text-muted">System Overview & Warehouse Performance Metrics</p>
            </div>
            <div class="page-actions">
                <button class="btn btn-secondary" id="btn-refresh-dashboard" style="display: inline-flex; align-items: center; gap: 0.5rem;">
                    <span class="btn-icon" style="display: flex; width: 1.2rem; height: 1.2rem;">${ICONS.refresh}</span> Refresh
                </button>
            </div>
        </div>
        <div id="dashboard-body" class="dashboard-body">
            <!-- Dynamic Dashboard Content -->
        </div>
    `;

    const dashboardBody = container.querySelector('#dashboard-body');
    const refreshBtn = container.querySelector('#btn-refresh-dashboard');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadDashboardData());
    }

    /**
     * Load all module data in parallel and render dashboard sections.
     */
    async function loadDashboardData() {
        showLoading(dashboardBody);

        try {
            // Fetch all 10 modules in parallel using Promise.all
            const failedModules = [];
            const [
                warehouses,
                bins,
                products,
                inventory,
                amrs,
                merchants,
                orders,
                picks,
                invoices,
                budgets,
            ] = await Promise.all([
                safeFetch('warehouses', () => api.warehouses.list(), failedModules),
                safeFetch('bins', () => api.bins.list(), failedModules),
                safeFetch('products', () => api.products.list(), failedModules),
                safeFetch('inventory', () => api.inventory.list(), failedModules),
                safeFetch('AMRs', () => api.amrs.list(), failedModules),
                safeFetch('merchants', () => api.merchants.list(), failedModules),
                safeFetch('orders', () => api.orders.list(), failedModules),
                safeFetch('picks', () => api.picks.list(), failedModules),
                safeFetch('invoices', () => api.invoices.list(), failedModules),
                safeFetch('budgets', () => api.budgets.list(), failedModules),
            ]);

            if (failedModules.length > 0) {
                showToast(
                    failedModules.length >= 5
                        ? 'Backend server offline at localhost:8080. Operating in offline preview mode.'
                        : `Could not load: ${failedModules.join(', ')}`,
                    'warning'
                );
            }

            // Ensure all results are arrays
            const warehousesList = Array.isArray(warehouses) ? warehouses : [];
            const binsList = Array.isArray(bins) ? bins : [];
            const productsList = Array.isArray(products) ? products : [];
            const inventoryList = Array.isArray(inventory) ? inventory : [];
            const amrsList = Array.isArray(amrs) ? amrs : [];
            const merchantsList = Array.isArray(merchants) ? merchants : [];
            const ordersList = Array.isArray(orders) ? orders : [];
            const picksList = Array.isArray(picks) ? picks : [];
            const invoicesList = Array.isArray(invoices) ? invoices : [];
            const budgetsList = Array.isArray(budgets) ? budgets : [];

            // ── Computed Metrics ──

            // Top Stats
            const totalWarehouses = warehousesList.length;
            const totalProducts = productsList.length;
            const totalOrders = ordersList.length;
            const totalAmrs = amrsList.length;

            // Second Stats
            const activeAmrsCount = amrsList.filter(a => {
                const s = String(a.status || '').toUpperCase();
                return s === 'ACTIVE' || s === 'BUSY' || s === 'WORKING' || s === 'NAVIGATING' || s === 'PICKING' || s === 'ONLINE';
            }).length;

            const pendingOrdersCount = ordersList.filter(o => {
                const s = String(o.status || '').toUpperCase();
                return s === 'CREATED' || s === 'PROCESSING' || s === 'PENDING';
            }).length;

            const completedOrdersCount = ordersList.filter(o => {
                const s = String(o.status || '').toUpperCase();
                return s === 'COMPLETED' || s === 'DELIVERED' || s === 'FULFILLED';
            }).length;

            const totalInvoices = invoicesList.length;

            // AMR Fleet Status Breakdown
            const amrStatusCounts = {};
            for (const a of amrsList) {
                const s = String(a.status || 'UNKNOWN').toUpperCase();
                amrStatusCounts[s] = (amrStatusCounts[s] || 0) + 1;
            }

            const standardAmrStatuses = ['IDLE', 'BUSY', 'CHARGING', 'MAINTENANCE', 'OFFLINE'];
            const allAmrStatuses = [...standardAmrStatuses];
            for (const s of Object.keys(amrStatusCounts)) {
                if (!allAmrStatuses.includes(s)) {
                    allAmrStatuses.push(s);
                }
            }

            // Inventory Overview Metrics
            const totalQuantity = inventoryList.reduce((sum, item) => {
                const q = Number(item.quantity ?? item.totalQuantity ?? item.qty ?? 0);
                return sum + (isNaN(q) ? 0 : q);
            }, 0);

            const totalReserved = inventoryList.reduce((sum, item) => {
                const r = Number(item.reservedQuantity ?? item.reserved ?? item.quantityReserved ?? 0);
                return sum + (isNaN(r) ? 0 : r);
            }, 0);

            const totalAvailable = Math.max(0, totalQuantity - totalReserved);
            const reservedPercent = totalQuantity > 0 ? Math.round((totalReserved / totalQuantity) * 100) : 0;

            // Pick Activity Metrics
            const picksCreated = picksList.filter(p => String(p.status || '').toUpperCase() === 'CREATED').length;
            const picksInProgress = picksList.filter(p => {
                const s = String(p.status || '').toUpperCase();
                return s === 'IN_PROGRESS' || s === 'INPROGRESS';
            }).length;
            const picksCompleted = picksList.filter(p => String(p.status || '').toUpperCase() === 'COMPLETED').length;
            const picksFailed = picksList.filter(p => {
                const s = String(p.status || '').toUpperCase();
                return s === 'FAILED' || s === 'CANCELLED' || s === 'ERROR';
            }).length;

            // Recent Orders: Last 5 orders sorted newest first
            const recentOrders = [...ordersList]
                .sort((a, b) => {
                    const timeA = new Date(a.createdAt || a.orderDate || a.createdDate || 0).getTime() || 0;
                    const timeB = new Date(b.createdAt || b.orderDate || b.createdDate || 0).getTime() || 0;
                    if (timeB !== timeA) return timeB - timeA;
                    return (Number(b.id) || 0) - (Number(a.id) || 0);
                })
                .slice(0, 5);

            // ── Render HTML Sections ──
            dashboardBody.innerHTML = `
                <!-- 1. Top Stats Row -->
                <div class="stats-grid mb-4">
                    ${statCard('Total Warehouses', formatNumber(totalWarehouses), ICONS.warehouse, 'primary')}
                    ${statCard('Total Products', formatNumber(totalProducts), ICONS.product, 'primary')}
                    ${statCard('Total Orders', formatNumber(totalOrders), ICONS.order, 'accent-violet')}
                    ${statCard('Total AMRs', formatNumber(totalAmrs), ICONS.robot, 'accent-green')}
                </div>

                <!-- 2. Second Stats Row -->
                <div class="stats-grid mb-4">
                    ${statCard('Active AMRs', formatNumber(activeAmrsCount), ICONS.zap, 'status-success')}
                    ${statCard('Pending Orders', formatNumber(pendingOrdersCount), ICONS.clock, 'status-warning')}
                    ${statCard('Completed Orders', formatNumber(completedOrdersCount), ICONS.check, 'status-success')}
                    ${statCard('Total Invoices', formatNumber(totalInvoices), ICONS.invoice, 'primary')}
                </div>

                <!-- System Summary Bar -->
                <div class="system-summary-bar mb-4" style="display: flex; gap: 1.5rem; flex-wrap: wrap; padding: 0.75rem 1.25rem; background: var(--glass-bg, rgba(255, 255, 255, 0.03)); border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08)); border-radius: 8px; font-size: 0.875rem;">
                    <span class="text-muted" style="display: flex; align-items: center; gap: 4px;"><span style="width:16px; height:16px;">${ICONS.merchant}</span> Registered Merchants: <strong class="text-light">${formatNumber(merchantsList.length)}</strong></span>
                    <span class="text-muted" style="display: flex; align-items: center; gap: 4px;"><span style="width:16px; height:16px;">${ICONS.bin}</span> Storage Bins: <strong class="text-light">${formatNumber(binsList.length)}</strong></span>
                    <span class="text-muted" style="display: flex; align-items: center; gap: 4px;"><span style="width:16px; height:16px;">${ICONS.budget}</span> Active Budgets: <strong class="text-light">${formatNumber(budgetsList.length)}</strong></span>
                    <span class="text-muted" style="display: flex; align-items: center; gap: 4px;"><span style="width:16px; height:16px;">${ICONS.activity}</span> Total Pick Tasks: <strong class="text-light">${formatNumber(picksList.length)}</strong></span>
                </div>

                <!-- 3. Two-Column Grid: Recent Orders & AMR Fleet Status -->
                <div class="dashboard-grid mb-4">
                    <!-- Left: Recent Orders Table -->
                    <div class="glass-card">
                        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <div>
                                <h3 class="card-title">Recent Orders</h3>
                                <p class="card-subtitle text-muted text-sm" style="margin: 0;">Last 5 orders placed in the system</p>
                            </div>
                            <span class="status-badge status-info">${recentOrders.length} Recent</span>
                        </div>
                        <div class="card-body" id="recent-orders-container">
                            <!-- Table inserted dynamically -->
                        </div>
                    </div>

                    <!-- Right: AMR Fleet Status -->
                    <div class="glass-card">
                        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <div>
                                <h3 class="card-title">AMR Fleet Status</h3>
                                <p class="card-subtitle text-muted text-sm" style="margin: 0;">Robot availability and operational status</p>
                            </div>
                            <span class="status-badge status-success">${formatNumber(totalAmrs)} Total Robots</span>
                        </div>
                        <div class="card-body">
                            <div class="amr-fleet-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.85rem;">
                                ${allAmrStatuses.map(status => {
                                    const meta = getAmrStatusMeta(status);
                                    const count = amrStatusCounts[status] || 0;
                                    return statCard(meta.label, formatNumber(count), meta.icon, meta.color);
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. Bottom Row: Inventory Overview & Pick Activity -->
                <div class="dashboard-grid">
                    <!-- Left: Inventory Overview -->
                    <div class="glass-card">
                        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <div>
                                <h3 class="card-title">Inventory Overview</h3>
                                <p class="card-subtitle text-muted text-sm" style="margin: 0;">Stock distribution and reservations across bins</p>
                            </div>
                            <span class="status-badge status-info">${formatNumber(inventoryList.length)} SKUs</span>
                        </div>
                        <div class="card-body">
                            <div class="inventory-stats-grid mb-3" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.85rem;">
                                ${statCard('Total Quantity', formatNumber(totalQuantity), ICONS.product, 'primary')}
                                ${statCard('Total Reserved', formatNumber(totalReserved), ICONS.lock, 'accent-amber')}
                                ${statCard('Available Qty', formatNumber(totalAvailable), ICONS.check, 'status-success')}
                                ${statCard('Storage Bins', formatNumber(binsList.length), ICONS.bin, 'accent-violet')}
                            </div>
                            <div class="allocation-bar-section" style="padding-top: 0.5rem;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.4rem;">
                                    <span class="text-muted">Stock Allocation Ratio</span>
                                    <span class="text-muted"><strong>${reservedPercent}%</strong> Reserved</span>
                                </div>
                                <div class="progress-bar-bg" style="background: rgba(255, 255, 255, 0.08); border-radius: 9999px; height: 8px; overflow: hidden;">
                                    <div class="progress-bar-fill" style="width: ${Math.min(100, reservedPercent)}%; background: var(--accent-amber, #f59e0b); height: 100%; border-radius: 9999px; transition: width 0.3s ease;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Pick Activity -->
                    <div class="glass-card">
                        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <div>
                                <h3 class="card-title">Pick Activity</h3>
                                <p class="card-subtitle text-muted text-sm" style="margin: 0;">Active picking operations and fulfillment status</p>
                            </div>
                            <span class="status-badge status-info">${formatNumber(picksList.length)} Total Picks</span>
                        </div>
                        <div class="card-body">
                            <div class="pick-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.85rem;">
                                ${statCard('Created', formatNumber(picksCreated), ICONS.order, 'status-info')}
                                ${statCard('In Progress', formatNumber(picksInProgress), ICONS.clock, 'status-warning')}
                                ${statCard('Completed', formatNumber(picksCompleted), ICONS.check, 'status-success')}
                                ${statCard('Failed', formatNumber(picksFailed), ICONS.close, 'status-danger')}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // ── Mount Recent Orders Table ──
            const tableContainer = dashboardBody.querySelector('#recent-orders-container');
            if (tableContainer) {
                const ordersTable = buildTable({
                    columns: [
                        {
                            key: 'orderNumber',
                            label: 'Order #',
                            render: (row) => {
                                const display = row.orderNumber || (row.id ? `#ORD-${row.id}` : '—');
                                return `<span class="font-medium text-light font-mono">${escapeHtml(String(display))}</span>`;
                            },
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (row) => statusBadge(row.status || 'UNKNOWN'),
                        },
                        {
                            key: 'createdAt',
                            label: 'Created',
                            render: (row) => formatDateTime(row.createdAt),
                        },
                    ],
                    data: recentOrders,
                    emptyMessage: 'No orders recorded yet',
                });

                tableContainer.appendChild(ordersTable);
            }
        } catch (error) {
            console.error('[Dashboard] Unexpected error rendering dashboard:', error);
            showToast(`Dashboard error: ${error.message || 'Failed to render dashboard'}`, 'error');
            dashboardBody.innerHTML = `
                <div class="empty-state animate-fade-in" style="padding: 3rem 1rem; text-align: center;">
                    <div style="width: 48px; height: 48px; margin: 0 auto 1rem; color: var(--status-warning, #f59e0b);">${ICONS.alert}</div>
                    <h3>Failed to Load Dashboard</h3>
                    <p class="text-muted">${escapeHtml(error.message || 'An error occurred while aggregating module data.')}</p>
                    <button class="btn btn-primary" id="btn-retry-dashboard" style="margin-top: 1rem; display: inline-flex; align-items: center; gap: 0.5rem; justify-content: center;">
                        <span style="display: flex; width: 1.2rem; height: 1.2rem;">${ICONS.refresh}</span> Retry
                    </button>
                </div>
            `;
            const retryBtn = dashboardBody.querySelector('#btn-retry-dashboard');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => loadDashboardData());
            }
        }
    }

    // Initial load
    await loadDashboardData();
}
