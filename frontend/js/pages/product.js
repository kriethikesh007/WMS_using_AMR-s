/* ============================================
   WMS — Product Page Module
   ============================================ */

import api from '../api.js';
import { formatDate, formatDateTime, formatCurrency, formatNumber, formatEnum, getStatusColor, escapeHtml } from '../utils.js';
import { showToast, statusBadge, buildTable, formField, getFormData, showFormErrors, statCard, showLoading, ICONS } from '../components.js';
import { showModal, showConfirm } from '../modal.js';

/**
 * Render the Product page.
 * @param {HTMLElement} container - DOM container element
 */
export async function render(container) {
    container.innerHTML = `
        <div class="page-container animate-fade-in">
            <div class="page-header">
                <div class="page-title-group">
                    <h1 class="page-title">Products</h1>
                    <p class="page-subtitle text-muted">Manage product catalog, SKUs, inventory specifications, and pricing</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-add-product">
                        ${ICONS.plus} Add Product
                    </button>
                </div>
            </div>
            <div class="stats-grid" id="product-stats"></div>
            <div class="table-section" id="product-table-wrapper"></div>
        </div>
    `;

    const statsContainer = container.querySelector('#product-stats');
    const tableWrapper = container.querySelector('#product-table-wrapper');
    const addBtn = container.querySelector('#btn-add-product');

    let products = [];

    /**
     * Load product list from API and refresh UI.
     */
    async function loadData() {
        showLoading(tableWrapper);
        try {
            const data = await api.products.list();
            products = Array.isArray(data) ? data : [];
            renderStats();
            renderTable();
        } catch (error) {
            showToast(error.message || 'Failed to load products', 'error');
            tableWrapper.innerHTML = `
                <div class="table-empty">
                    <div class="table-empty-icon">${ICONS.alert}</div>
                    <div>Failed to load products. Please check connection.</div>
                </div>
            `;
        }
    }

    /**
     * Render the metric stat cards.
     */
    function renderStats() {
        const total = products.length;
        const active = products.filter(p => p.status === 'ACTIVE').length;
        const inactive = products.filter(p => p.status === 'INACTIVE').length;

        statsContainer.innerHTML = `
            ${statCard('Total Products', formatNumber(total), ICONS.product, 'accent')}
            ${statCard('Active', formatNumber(active), ICONS.check, 'success')}
            ${statCard('Inactive', formatNumber(inactive), ICONS.close, 'danger')}
        `;
    }

    /**
     * Render the product data table.
     */
    function renderTable() {
        tableWrapper.innerHTML = '';
        const table = buildTable({
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Name', render: (row) => escapeHtml(row.name) },
                { key: 'sku', label: 'SKU', render: (row) => `<code>${escapeHtml(row.sku)}</code>` },
                {
                    key: 'price',
                    label: 'Price',
                    render: (row) => formatCurrency(row.price),
                },
                {
                    key: 'status',
                    label: 'Status',
                    render: (row) => statusBadge(row.status),
                },
            ],
            data: products,
            emptyMessage: 'No products found. Click "Add Product" to create one.',
            onEdit: (product) => openModal(product),
            onDelete: (product) => handleDelete(product),
        });
        tableWrapper.appendChild(table);
    }

    /**
     * Open modal dialog for adding or editing a product.
     * @param {object|null} product - Product to edit, or null to create
     */
    function openModal(product = null) {
        const isEdit = Boolean(product && product.id);
        const title = isEdit ? 'Edit Product' : 'Add New Product';
        const submitLabel = isEdit ? 'Update Product' : 'Create Product';

        const bodyHtml = `
            <div class="product-form">
                ${formField({
                    name: 'name',
                    label: 'Product Name',
                    type: 'text',
                    required: true,
                    value: product ? product.name : '',
                    placeholder: 'Enter product name (2-100 characters)',
                    attrs: { minlength: '2', maxlength: '100' },
                })}
                ${formField({
                    name: 'sku',
                    label: 'SKU',
                    type: 'text',
                    required: true,
                    value: product ? product.sku : '',
                    placeholder: 'Enter unique SKU (3-50 characters)',
                    attrs: { minlength: '3', maxlength: '50' },
                })}
                ${formField({
                    name: 'price',
                    label: 'Price',
                    type: 'number',
                    required: true,
                    value: product && product.price != null ? product.price : '',
                    placeholder: '0.00',
                    attrs: { step: '0.01', min: '0.01' },
                })}
                ${formField({
                    name: 'status',
                    label: 'Status',
                    type: 'select',
                    required: true,
                    value: product ? product.status : 'ACTIVE',
                    options: [
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'INACTIVE', label: 'Inactive' },
                    ],
                })}
                ${formField({
                    name: 'description',
                    label: 'Description',
                    type: 'textarea',
                    required: false,
                    value: product && product.description ? product.description : '',
                    placeholder: 'Enter product description (optional, max 500 characters)',
                    attrs: { maxlength: '500', rows: '3' },
                })}
            </div>
        `;

        showModal({
            title,
            bodyHtml,
            submitLabel,
            submitClass: 'btn-primary',
            onSubmit: async (modalBody, closeModal) => {
                const formData = getFormData(modalBody);

                const payload = {
                    name: formData.name ? formData.name.trim() : '',
                    sku: formData.sku ? formData.sku.trim() : '',
                    price: formData.price !== '' && !isNaN(formData.price) ? Number(formData.price) : null,
                    status: formData.status,
                    description: formData.description ? formData.description.trim() : null,
                };

                try {
                    if (isEdit) {
                        await api.products.update(product.id, payload);
                        showToast('Product updated successfully', 'success');
                    } else {
                        await api.products.create(payload);
                        showToast('Product created successfully', 'success');
                    }
                    closeModal();
                    await loadData();
                } catch (error) {
                    showToast(error.message || 'Operation failed', 'error');
                    if (error.validationErrors) {
                        showFormErrors(modalBody, error.validationErrors);
                    }
                }
            },
        });
    }

    /**
     * Handle deleting a product with confirmation.
     * @param {object} product - Product to delete
     */
    function handleDelete(product) {
        showConfirm(`Are you sure you want to delete product "${product.name}" (${product.sku})?`, async () => {
            try {
                await api.products.delete(product.id);
                showToast('Product deleted successfully', 'success');
                await loadData();
            } catch (error) {
                showToast(error.message || 'Failed to delete product', 'error');
            }
        });
    }

    addBtn.addEventListener('click', () => openModal());

    await loadData();
}
