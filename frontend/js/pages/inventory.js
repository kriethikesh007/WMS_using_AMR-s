import api from '../api.js';
import { formatNumber, escapeHtml } from '../utils.js';
import { showToast, buildTable, formField, getFormData, showFormErrors, statCard, showLoading, ICONS } from '../components.js';
import { showModal, showConfirm } from '../modal.js';

export async function render(container) {
    showLoading(container);
    let inventoryList = [];
    let productsList = [];
    let binsList = [];

    container.innerHTML = `
        <div class="page-container animate-fade-in">
            <div class="page-header">
                <div>
                    <h1 class="page-title">Inventory & Stock</h1>
                    <p class="page-subtitle text-muted">Track physical quantities, safety buffers, and bin allocations</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-add-inventory">
                        ${ICONS.plus} Add Stock
                    </button>
                </div>
            </div>
            <div class="stats-grid" id="inventory-stats"></div>
            <div id="inventory-table-container"></div>
        </div>
    `;

    const statsContainer = container.querySelector('#inventory-stats');
    const tableContainer = container.querySelector('#inventory-table-container');
    const btnAdd = container.querySelector('#btn-add-inventory');
    btnAdd.addEventListener('click', () => openCreateModal());

    async function loadData() {
        try {
            const [inventories, products, bins] = await Promise.all([
                api.inventory.list(),
                api.products.list(),
                api.bins.list(),
            ]);
            inventoryList = Array.isArray(inventories) ? inventories : [];
            productsList = Array.isArray(products) ? products : [];
            binsList = Array.isArray(bins) ? bins : [];
            renderStats();
            renderTable();
        } catch (error) {
            showToast(error.message || 'Failed to load inventory data', 'error');
        }
    }

    function renderStats() {
        const totalRecords = inventoryList.length;
        const totalQty = inventoryList.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        const totalReserved = inventoryList.reduce((sum, item) => sum + (Number(item.reservedQuantity) || 0), 0);
        const totalAvailable = Math.max(0, totalQty - totalReserved);
        statsContainer.innerHTML = statCard('Total Records', formatNumber(totalRecords), ICONS.inventory, 'accent') +
            statCard('Total Quantity', formatNumber(totalQty), ICONS.product, 'info') +
            statCard('Total Reserved', formatNumber(totalReserved), ICONS.lock, 'warning') +
            statCard('Total Available', formatNumber(totalAvailable), ICONS.check, 'success');
    }

    function renderTable() {
        tableContainer.innerHTML = '';
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'product', label: 'Product', render: r => escapeHtml(r.product ? r.product.name : '—') },
            { key: 'sku', label: 'SKU', render: r => '<code class=\"font-mono text-sm\">' + escapeHtml(r.product ? r.product.sku : '—') + '</code>' },
            { key: 'bin', label: 'Bin', render: r => escapeHtml(r.bin ? r.bin.binCode : '—') },
            { key: 'warehouse', label: 'Warehouse', render: r => escapeHtml(r.bin && r.bin.warehouse ? r.bin.warehouse.name : '—') },
            { key: 'quantity', label: 'Physical Qty', render: r => '<strong>' + formatNumber(r.quantity) + '</strong>' },
            { key: 'reservedQuantity', label: 'Reserved', render: r => '<span class=\"text-muted\">' + formatNumber(r.reservedQuantity) + '</span>' },
            { key: 'available', label: 'Available', render: r => {
                const avail = Math.max(0, (r.quantity || 0) - (r.reservedQuantity || 0));
                const fillClass = avail > 10 ? 'high' : avail > 0 ? 'medium' : 'low';
                return '<div class=\"qty-bar\"><span class=\"font-semibold\">' + formatNumber(avail) + '</span><div class=\"qty-bar-track\"><div class=\"qty-bar-fill ' + fillClass + '\" style=\"width: ' + Math.min(100, avail * 2) + '%\"></div></div></div>';
            }},
        ];
        const table = buildTable({
            columns,
            data: inventoryList,
            onEdit: (row) => openEditModal(row),
            onDelete: (row) => handleDelete(row),
            emptyMessage: 'No inventory records found. Click \"+ Add Stock\" to allocate items to bins.',
        });
        tableContainer.appendChild(table);
    }

    function getFormHtml(inventory = null) {
        const prodOptions = productsList.map(p => ({ value: String(p.id), label: p.name + ' (' + p.sku + ')' }));
        const binOptions = binsList.map(b => ({ value: String(b.id), label: b.binCode + ' — ' + (b.warehouse ? b.warehouse.name : '') }));
        return formField({ name: 'productId', label: 'Product', type: 'select', required: true, value: inventory?.product?.id || '', options: prodOptions }) +
            formField({ name: 'binId', label: 'Bin', type: 'select', required: true, value: inventory?.bin?.id || '', options: binOptions }) +
            '<div class=\"form-row\">' +
            formField({ name: 'quantity', label: 'Physical Quantity', type: 'number', required: true, value: inventory?.quantity ?? 0, attrs: { min: '0' } }) +
            formField({ name: 'reservedQuantity', label: 'Reserved Quantity', type: 'number', required: true, value: inventory?.reservedQuantity ?? 0, attrs: { min: '0' } }) +
            '</div>';
    }

    function openCreateModal() {
        showModal({
            title: 'Add Inventory Allocation',
            bodyHtml: getFormHtml(),
            submitLabel: 'Create Record',
            onSubmit: async (modalBody, closeModal) => {
                const fd = getFormData(modalBody);
                if (!fd.productId) return showFormErrors(modalBody, { productId: 'Select product' });
                if (!fd.binId) return showFormErrors(modalBody, { binId: 'Select bin' });
                try {
                    await api.inventory.create({ product: { id: Number(fd.productId) }, bin: { id: Number(fd.binId) }, quantity: fd.quantity || 0, reservedQuantity: fd.reservedQuantity || 0 });
                    showToast('Inventory added', 'success');
                    closeModal();
                    await loadData();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        });
    }

    function openEditModal(inventory) {
        showModal({
            title: 'Edit Inventory #' + inventory.id,
            bodyHtml: getFormHtml(inventory),
            submitLabel: 'Save Changes',
            onSubmit: async (modalBody, closeModal) => {
                const fd = getFormData(modalBody);
                try {
                    await api.inventory.update(inventory.id, { product: { id: Number(fd.productId || inventory.product?.id) }, bin: { id: Number(fd.binId || inventory.bin?.id) }, quantity: fd.quantity || 0, reservedQuantity: fd.reservedQuantity || 0 });
                    showToast('Inventory updated', 'success');
                    closeModal();
                    await loadData();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        });
    }

    function handleDelete(inventory) {
        showConfirm('Delete inventory record for ' + (inventory.product?.name || 'product') + ' in ' + (inventory.bin?.binCode || 'bin') + '?', async () => {
            try {
                await api.inventory.delete(inventory.id);
                showToast('Inventory deleted', 'success');
                await loadData();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    await loadData();
}

export default { render };