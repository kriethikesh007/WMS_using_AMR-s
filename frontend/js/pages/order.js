/* ============================================
   WMS — Order Page Module
   ============================================
   Manages warehouse orders, dynamic line items,
   and fulfillment lifecycle workflows.
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

// Cached list of available products for order item selection
let productsCache = [];

// Available order status choices
const ORDER_STATUS_OPTIONS = [
    { value: 'CREATED', label: 'Created' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

/**
 * Format order items array as comma-separated 'ProductName x Qty' summary.
 * @param {Array<object>} items
 * @returns {string}
 */
function formatOrderItems(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return '<span class="text-muted">—</span>';
    }

    return items
        .map((item) => {
            const prod = item.product;
            const name = prod?.name || (prod?.id ? `Product #${prod.id}` : 'Item');
            const qty = item.quantity != null ? item.quantity : 1;
            return `${escapeHtml(name)} x ${qty}`;
        })
        .join(', ');
}

/**
 * Build HTML for a single dynamic order item row.
 * @param {object|null} item - Existing item data or null
 * @returns {HTMLElement}
 */
function createItemRowElement(item = null) {
    const row = document.createElement('div');
    row.className = 'order-item-row';
    if (item?.id) {
        row.dataset.itemId = item.id;
    }
    row.style.cssText = 'display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;';

    const selectedProductId = item?.product?.id != null ? String(item.product.id) : '';
    const quantity = item?.quantity != null ? item.quantity : 1;

    let productOptions = '<option value="">Select Product...</option>';
    productsCache.forEach((p) => {
        const isSelected = String(p.id) === selectedProductId ? 'selected' : '';
        const priceStr = p.price != null ? ` (${formatCurrency(p.price)})` : '';
        const skuStr = p.sku ? ` [${p.sku}]` : '';
        productOptions += `<option value="${p.id}" ${isSelected}>${escapeHtml(p.name || `Product #${p.id}`)}${skuStr}${priceStr}</option>`;
    });

    row.innerHTML = `
        <div style="flex: 2;">
            <select class="form-select order-item-product" required>
                ${productOptions}
            </select>
        </div>
        <div style="flex: 1; max-width: 110px;">
            <input type="number" class="form-input order-item-quantity" min="1" step="1" value="${quantity}" placeholder="Qty" required>
        </div>
        <div>
            <button type="button" class="btn btn-sm btn-danger order-item-remove" title="Remove item" style="padding: 0.45rem 0.65rem;">✕</button>
        </div>
    `;

    return row;
}

/**
 * Main export: renders the Order management page into the container.
 * @param {HTMLElement} container
 */
export async function render(container) {
    container.innerHTML = `
        <div class="page-container animate-fade-in">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Sales Orders</h1>
                    <p class="page-subtitle text-muted">Manage customer demand, multi-line items, inventory checks, and picking dispatch</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-add-order">
                        ${ICONS.plus} Create Order
                    </button>
                </div>
            </div>
            <div id="order-stats"></div>
            <div id="order-table-container"></div>
        </div>
    `;

    const statsContainer = container.querySelector('#order-stats');
    const tableContainer = container.querySelector('#order-table-container');
    const addBtn = container.querySelector('#btn-add-order');

    addBtn.addEventListener('click', () => {
        openOrderModal(null, loadData);
    });

    /**
     * Load orders and products from backend, then update UI.
     */
    async function loadData() {
        showLoading(tableContainer);

        try {
            const [ordersData, productsData] = await Promise.all([
                api.orders.list(),
                api.products.list().catch((err) => {
                    console.warn('Failed to load products list:', err);
                    return [];
                }),
            ]);

            const orders = Array.isArray(ordersData) ? ordersData : [];
            productsCache = Array.isArray(productsData) ? productsData : [];

            renderStats(statsContainer, orders);
            renderTable(tableContainer, orders, loadData);
        } catch (error) {
            showToast(error.message || 'Failed to load orders', 'error');
            tableContainer.innerHTML = `
                <div class="table-container">
                    <div class="table-empty">
                        <div class="table-empty-icon">${ICONS.alert}</div>
                        <div>Failed to load orders: ${escapeHtml(error.message)}</div>
                        <button class="btn btn-sm btn-primary" id="btn-retry-orders" style="margin-top: 1rem;">Retry</button>
                    </div>
                </div>
            `;
            const retryBtn = tableContainer.querySelector('#btn-retry-orders');
            if (retryBtn) {
                retryBtn.addEventListener('click', loadData);
            }
        }
    }

    await loadData();
}

/**
 * Render stat cards summarizing order metrics.
 * @param {HTMLElement} container
 * @param {Array<object>} orders
 */
function renderStats(container, orders) {
    const total = orders.length;
    const created = orders.filter((o) => o.status === 'CREATED').length;
    const processing = orders.filter((o) => o.status === 'PROCESSING').length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;

    container.innerHTML = `
        <div class="stats-grid animate-fade-in">
            ${statCard('Total Orders', total, ICONS.product, 'primary')}
            ${statCard('Created', created, ICONS.order, 'info')}
            ${statCard('Processing', processing, ICONS.zap, 'warning')}
            ${statCard('Completed', completed, ICONS.check, 'success')}
        </div>
    `;
}

/**
 * Render the orders data table with columns and workflow action buttons.
 * @param {HTMLElement} container
 * @param {Array<object>} orders
 * @param {function} onReload
 */
function renderTable(container, orders, onReload) {
    container.innerHTML = '';

    const tableElement = buildTable({
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'orderNumber', label: 'Order Number' },
            {
                key: 'status',
                label: 'Status',
                render: (row) => statusBadge(row.status),
            },
            {
                key: 'items',
                label: 'Items (summary)',
                render: (row) => formatOrderItems(row.items),
            },
            {
                key: 'createdAt',
                label: 'Created At',
                render: (row) => formatDateTime(row.createdAt),
            },
        ],
        data: orders,
        onEdit: (order) => openOrderModal(order, onReload),
        onDelete: (order) => handleDelete(order, onReload),
        emptyMessage: 'No orders found',
    });

    // Inject contextual workflow action buttons per row based on status
    const rows = tableElement.querySelectorAll('tbody tr');
    rows.forEach((tr, idx) => {
        const order = orders[idx];
        if (!order) return;

        const actionsDiv = tr.querySelector('.table-actions');
        if (!actionsDiv) return;

        // Ensure actions row wraps neatly if multiple buttons exist
        actionsDiv.style.display = 'flex';
        actionsDiv.style.alignItems = 'center';
        actionsDiv.style.gap = '0.35rem';
        actionsDiv.style.flexWrap = 'wrap';

        const deleteBtn = actionsDiv.querySelector('[data-action="delete"]');

        if (order.status === 'CREATED') {
            const processBtn = document.createElement('button');
            processBtn.className = 'btn btn-sm btn-primary';
            processBtn.textContent = 'Process';
            processBtn.title = 'Move order to PROCESSING';
            processBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handlePick(order, processBtn, onReload);
            });
            actionsDiv.insertBefore(processBtn, deleteBtn);
        } else if (order.status === 'PROCESSING') {
            const checkBtn = document.createElement('button');
            checkBtn.className = 'btn btn-sm btn-info';
            checkBtn.textContent = 'Check Inventory';
            checkBtn.title = 'Check stock availability for this order';
            checkBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleCheckInventory(order, checkBtn, onReload);
            });
            actionsDiv.insertBefore(checkBtn, deleteBtn);

            const reserveBtn = document.createElement('button');
            reserveBtn.className = 'btn btn-sm btn-warning';
            reserveBtn.textContent = 'Reserve Inventory';
            reserveBtn.title = 'Reserve required inventory items';
            reserveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleReserveInventory(order, reserveBtn, onReload);
            });
            actionsDiv.insertBefore(reserveBtn, deleteBtn);
        }
        // For COMPLETED and CANCELLED, no workflow action buttons are shown
    });

    container.appendChild(tableElement);
}

/**
 * Handle Process action (calls PUT /orders/{id}/pick).
 * @param {object} order
 * @param {HTMLButtonElement} button
 * @param {function} onReload
 */
async function handlePick(order, button, onReload) {
    if (button.disabled) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Processing...';

    try {
        await api.orders.pick(order.id);
        showToast(`Order #${order.orderNumber || order.id} moved to PROCESSING`, 'success');
        await onReload();
    } catch (error) {
        showToast(error.message || 'Failed to process order', 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
}

/**
 * Handle Check Inventory action (calls PUT /orders/{id}/check-inventory).
 * @param {object} order
 * @param {HTMLButtonElement} button
 * @param {function} onReload
 */
async function handleCheckInventory(order, button, onReload) {
    if (button.disabled) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Checking...';

    try {
        await api.orders.checkInventory(order.id);
        showToast(`Inventory checked for Order #${order.orderNumber || order.id}`, 'info');
        await onReload();
    } catch (error) {
        showToast(error.message || 'Inventory check failed', 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
}

/**
 * Handle Reserve Inventory action (calls PUT /orders/{id}/reserve-inventory).
 * @param {object} order
 * @param {HTMLButtonElement} button
 * @param {function} onReload
 */
async function handleReserveInventory(order, button, onReload) {
    if (button.disabled) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Reserving...';

    try {
        await api.orders.reserveInventory(order.id);
        showToast(`Inventory reserved for Order #${order.orderNumber || order.id}`, 'success');
        await onReload();
    } catch (error) {
        showToast(error.message || 'Failed to reserve inventory', 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
}

/**
 * Handle Delete order with confirmation dialog.
 * @param {object} order
 * @param {function} onReload
 */
function handleDelete(order, onReload) {
    showConfirm(
        `Are you sure you want to delete order "${order.orderNumber || order.id}"? This action cannot be undone.`,
        async () => {
            try {
                await api.orders.delete(order.id);
                showToast('Order deleted successfully', 'success');
                await onReload();
            } catch (error) {
                showToast(error.message || 'Failed to delete order', 'error');
            }
        }
    );
}

/**
 * Open Modal for creating or editing an Order.
 * @param {object|null} existingOrder
 * @param {function} onReload
 */
async function openOrderModal(existingOrder = null, onReload) {
    const isEdit = Boolean(existingOrder && existingOrder.id);
    let order = existingOrder;

    // In edit mode, ensure fresh complete details with items
    if (isEdit) {
        try {
            order = await api.orders.get(existingOrder.id);
        } catch (e) {
            console.warn('Could not fetch latest order details, falling back to cached row:', e);
            order = existingOrder;
        }
    }

    // Ensure products list is available for item selection
    if (!productsCache || productsCache.length === 0) {
        try {
            productsCache = (await api.products.list()) || [];
        } catch (e) {
            console.warn('Could not fetch products list:', e);
            productsCache = [];
        }
    }

    const bodyHtml = `
        <div class="order-form">
            ${formField({
                name: 'orderNumber',
                label: 'Order Number',
                type: 'text',
                required: true,
                value: order?.orderNumber || '',
                placeholder: 'e.g. ORD-1001',
            })}

            ${formField({
                name: 'status',
                label: 'Status',
                type: 'select',
                required: true,
                value: order?.status || 'CREATED',
                options: ORDER_STATUS_OPTIONS,
            })}

            <div class="form-group" style="margin-top: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <label class="form-label" style="margin-bottom: 0;">Order Items *</label>
                    <button type="button" class="btn btn-sm btn-primary" id="btn-add-modal-item">
                        ${ICONS.plus} Add Item
                    </button>
                </div>
                <div id="modal-order-items-list" style="display: flex; flex-direction: column;">
                    <!-- Dynamic item rows will be inserted here -->
                </div>
                <div class="form-error" data-error="items"></div>
            </div>
        </div>
    `;

    showModal({
        title: isEdit ? `Edit Order #${order.orderNumber || order.id}` : 'Create New Order',
        bodyHtml,
        submitLabel: isEdit ? 'Save Changes' : 'Create Order',
        submitClass: 'btn-primary',
        onOpen: (modalElement) => {
            const itemsContainer = modalElement.querySelector('#modal-order-items-list');
            const addItemBtn = modalElement.querySelector('#btn-add-modal-item');

            function updateEmptyState() {
                const rows = itemsContainer.querySelectorAll('.order-item-row');
                let emptyNotice = itemsContainer.querySelector('.order-items-empty');

                if (rows.length === 0) {
                    if (!emptyNotice) {
                        emptyNotice = document.createElement('div');
                        emptyNotice.className = 'order-items-empty text-muted';
                        emptyNotice.style.cssText =
                            'padding: 1rem; text-align: center; border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 6px; font-size: 0.875rem;';
                        emptyNotice.textContent = 'No items added yet. Click "+ Add Item" to add products.';
                        itemsContainer.appendChild(emptyNotice);
                    }
                } else if (emptyNotice) {
                    emptyNotice.remove();
                }
            }

            function attachRowListeners(row) {
                const removeBtn = row.querySelector('.order-item-remove');
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        row.remove();
                        updateEmptyState();
                    });
                }
            }

            addItemBtn.addEventListener('click', () => {
                const newRow = createItemRowElement(null);
                itemsContainer.appendChild(newRow);
                attachRowListeners(newRow);
                updateEmptyState();
            });

            // Populate existing items or initialize with 1 item row
            if (order && Array.isArray(order.items) && order.items.length > 0) {
                order.items.forEach((item) => {
                    const row = createItemRowElement(item);
                    itemsContainer.appendChild(row);
                    attachRowListeners(row);
                });
            } else {
                const initialRow = createItemRowElement(null);
                itemsContainer.appendChild(initialRow);
                attachRowListeners(initialRow);
            }

            updateEmptyState();
        },
        onSubmit: async (modalBody, closeModal) => {
            // Reset validation errors
            showFormErrors(modalBody, null);
            const itemsErrorEl = modalBody.querySelector('[data-error="items"]');
            if (itemsErrorEl) itemsErrorEl.textContent = '';

            const formData = getFormData(modalBody);
            const orderNumber = (formData.orderNumber || '').trim();
            const status = formData.status || 'CREATED';

            // Validate orderNumber
            if (!orderNumber) {
                showToast('Order Number is required', 'warning');
                showFormErrors(modalBody, { orderNumber: 'Order Number is required' });
                return;
            }

            // Extract dynamic line items
            const itemRows = modalBody.querySelectorAll('.order-item-row');
            if (itemRows.length === 0) {
                showToast('Please add at least one item to the order', 'warning');
                if (itemsErrorEl) itemsErrorEl.textContent = 'At least one item is required';
                return;
            }

            const itemsPayload = [];
            let hasItemError = false;

            itemRows.forEach((row) => {
                const prodSelect = row.querySelector('.order-item-product');
                const qtyInput = row.querySelector('.order-item-quantity');

                const productId = prodSelect.value ? parseInt(prodSelect.value, 10) : null;
                const quantity = qtyInput.value ? parseInt(qtyInput.value, 10) : null;

                if (!productId) {
                    prodSelect.classList.add('error');
                    hasItemError = true;
                } else {
                    prodSelect.classList.remove('error');
                }

                if (!quantity || quantity < 1) {
                    qtyInput.classList.add('error');
                    hasItemError = true;
                } else {
                    qtyInput.classList.remove('error');
                }

                if (productId && quantity && quantity >= 1) {
                    const itemData = {
                        product: { id: productId },
                        quantity: quantity,
                    };
                    if (row.dataset.itemId) {
                        itemData.id = parseInt(row.dataset.itemId, 10);
                    }
                    itemsPayload.push(itemData);
                }
            });

            if (hasItemError) {
                showToast('Please select a product and valid quantity (≥ 1) for all items', 'warning');
                if (itemsErrorEl) itemsErrorEl.textContent = 'Please fix item errors above';
                return;
            }

            const payload = {
                orderNumber,
                status,
                items: itemsPayload,
            };

            try {
                if (isEdit) {
                    await api.orders.update(order.id, payload);
                    showToast('Order updated successfully', 'success');
                } else {
                    await api.orders.create(payload);
                    showToast('Order created successfully', 'success');
                }
                closeModal();
                await onReload();
            } catch (error) {
                showToast(error.message || 'Failed to save order', 'error');
                if (error.validationErrors) {
                    showFormErrors(modalBody, error.validationErrors);
                }
            }
        },
    });
}
