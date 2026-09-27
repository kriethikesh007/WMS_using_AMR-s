/* ============================================
   WMS — Invoice Page Module
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

export async function render(container) {
    container.innerHTML = `
        <div class="page-container animate-fade-in">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Customer Invoices</h1>
                    <p class="page-subtitle text-muted">Track order billings, manage merchant payments, and view accounts receivable</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-create-invoice">
                        ${ICONS.plus} Generate Invoice
                    </button>
                </div>
            </div>

            <div class="stats-grid" id="invoice-stats"></div>

            <div class="table-section">
                <div id="invoice-table-container"></div>
            </div>
        </div>
    `;

    const statsContainer = container.querySelector('#invoice-stats');
    const tableContainer = container.querySelector('#invoice-table-container');
    const createBtn = container.querySelector('#btn-create-invoice');

    const columns = [
        {
            key: 'id',
            label: 'ID',
        },
        {
            key: 'invoiceNumber',
            label: 'Invoice #',
            render: (row) => `<strong class="font-mono text-primary">${escapeHtml(row.invoiceNumber || '—')}</strong>`,
        },
        {
            key: 'order',
            label: 'Order Reference',
            render: (row) => {
                const orderNum = row.order?.orderNumber || (row.order?.id ? `#ORD-${row.order.id}` : null);
                return orderNum ? `<span class="font-mono">${escapeHtml(orderNum)}</span>` : '<span class="text-muted">—</span>';
            },
        },
        {
            key: 'totalAmount',
            label: 'Total Amount',
            render: (row) => `<strong style="font-size:1.05rem; font-family:var(--font-mono);">${formatCurrency(row.totalAmount)}</strong>`,
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => statusBadge(row.status),
        },
        {
            key: 'createdAt',
            label: 'Date Issued',
            render: (row) => formatDateTime(row.createdAt),
        },
    ];

    function renderStats(invoices) {
        const list = Array.isArray(invoices) ? invoices : [];
        const totalInvoices = list.length;
        const generatedCount = list.filter((inv) => inv.status === 'GENERATED').length;
        const paidCount = list.filter((inv) => inv.status === 'PAID').length;
        const totalRevenue = list
            .filter((inv) => inv.status === 'PAID')
            .reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);

        statsContainer.innerHTML = `
            ${statCard('Total Invoices', formatNumber(totalInvoices), ICONS.invoice, 'accent-blue')}
            ${statCard('Pending Payment', formatNumber(generatedCount), ICONS.refresh, 'status-warning')}
            ${statCard('Paid Invoices', formatNumber(paidCount), ICONS.check, 'status-success')}
            ${statCard('Collected Revenue', formatCurrency(totalRevenue), ICONS.budget, 'accent-green')}
        `;
    }

    async function loadData() {
        showLoading(tableContainer);

        try {
            const invoices = await api.invoices.list();
            const list = Array.isArray(invoices) ? invoices : [];

            renderStats(list);

            const table = buildTable({
                columns,
                data: list,
                emptyMessage: 'No invoices generated yet. Click "+ Generate Invoice" to invoice a completed order.',
                actions: [
                    {
                        label: 'Mark as Paid',
                        icon: `${ICONS.budget} Pay`,
                        class: 'btn-success',
                        onClick: (row) => handlePayInvoice(row),
                    },
                ],
            });

            // Adjust pay button visibility: only show pay button if status is GENERATED
            table.querySelectorAll('tbody tr').forEach((tr, idx) => {
                const inv = list[idx];
                if (inv && inv.status !== 'GENERATED') {
                    const payBtn = tr.querySelector('[data-action^="custom-"]');
                    if (payBtn) payBtn.remove();
                }
            });

            tableContainer.innerHTML = '';
            tableContainer.appendChild(table);
        } catch (error) {
            tableContainer.innerHTML = `
                <div class="table-empty">
                    <div class="table-empty-icon">${ICONS.alert}</div>
                    <div>Failed to load invoices: ${escapeHtml(error.message)}</div>
                    <button class="btn btn-sm btn-primary mt-3" id="btn-retry-invoices">Retry</button>
                </div>
            `;
            tableContainer.querySelector('#btn-retry-invoices')?.addEventListener('click', loadData);
            showToast(error.message || 'Failed to load invoices', 'error');
        }
    }

    function handlePayInvoice(invoice) {
        showConfirm(`Record payment of ${formatCurrency(invoice.totalAmount)} for Invoice "${invoice.invoiceNumber}"?`, async () => {
            try {
                await api.invoices.pay(invoice.id);
                showToast(`Invoice ${invoice.invoiceNumber} marked as PAID`, 'success');
                await loadData();
            } catch (err) {
                showToast(err.message || 'Failed to process payment', 'error');
            }
        });
    }

    async function openCreateModal() {
        try {
            createBtn.disabled = true;
            const [orders, picks, existingInvoices] = await Promise.all([
                api.orders.list().catch(() => []),
                api.picks.list().catch(() => []),
                api.invoices.list().catch(() => []),
            ]);

            const invoicedOrderIds = new Set(
                (Array.isArray(existingInvoices) ? existingInvoices : []).map(i => i.order?.id).filter(Boolean)
            );

            const completedPickOrderIds = new Set(
                (Array.isArray(picks) ? picks : [])
                    .filter(p => p.status === 'COMPLETED')
                    .map(p => p.order?.id)
                    .filter(Boolean)
            );

            // An order is eligible if it is COMPLETED or has a COMPLETED pick, and hasn't been invoiced yet
            const eligibleOrders = (Array.isArray(orders) ? orders : []).filter(order => {
                if (invoicedOrderIds.has(order.id)) return false;
                return order.status === 'COMPLETED' || completedPickOrderIds.has(order.id);
            });

            const orderOptions = eligibleOrders.map((order) => {
                const orderNum = order.orderNumber || `Order #${order.id}`;
                return {
                    value: String(order.id),
                    label: `${orderNum} (Status: ${order.status})`,
                };
            });

            const infoNote = orderOptions.length === 0
                ? '<div class="card" style="padding:1rem; margin-bottom:1rem; border-color:rgba(245,158,11,0.3); background:rgba(245,158,11,0.06);"><p class="text-warning text-sm" style="margin:0;">⚠ No uninvoiced completed orders available. Orders must complete their pick operations before invoicing.</p></div>'
                : '<p class="text-muted text-sm" style="margin-bottom: 1rem;">Select a fulfilled sales order to generate an official invoice. Total amounts and line items are calculated automatically.</p>';

            const bodyHtml = `
                <form id="create-invoice-form">
                    ${infoNote}
                    ${formField({
                        name: 'orderId',
                        label: 'Fulfilled Sales Order',
                        type: 'select',
                        required: true,
                        options: orderOptions,
                    })}
                </form>
            `;

            showModal({
                title: 'Generate Customer Invoice',
                bodyHtml,
                submitLabel: 'Create Invoice',
                submitClass: 'btn-primary',
                onSubmit: async (modalBody, closeModal) => {
                    const formData = getFormData(modalBody);
                    const orderId = formData.orderId;

                    if (!orderId) {
                        showFormErrors(modalBody, { orderId: 'Please select an eligible order' });
                        return;
                    }

                    try {
                        await api.invoices.create(orderId);
                        showToast('Invoice generated successfully', 'success');
                        closeModal();
                        await loadData();
                    } catch (error) {
                        showToast(error.message || 'Failed to generate invoice', 'error');
                        if (error.validationErrors) {
                            showFormErrors(modalBody, error.validationErrors);
                        }
                    }
                },
            });
        } catch (error) {
            showToast(error.message || 'Failed to prepare invoice dialog', 'error');
        } finally {
            createBtn.disabled = false;
        }
    }

    createBtn.addEventListener('click', openCreateModal);

    await loadData();
}

export default { render };
