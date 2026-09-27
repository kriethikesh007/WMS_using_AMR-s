/* ============================================
   WMS — Merchant Management Page Module
   ============================================ */

import api from '../api.js';
import { formatDate, formatDateTime, formatCurrency, formatNumber, formatEnum, getStatusColor, escapeHtml } from '../utils.js';
import { showToast, statusBadge, buildTable, formField, getFormData, showFormErrors, statCard, showLoading, ICONS } from '../components.js';
import { showModal, showConfirm } from '../modal.js';

/**
 * Render the Merchant management page into the specified container.
 * @param {HTMLElement} container
 */
export async function render(container) {
    container.innerHTML = `
        <div class="page-container animate-fade-in">
            <div class="page-header">
                <div class="page-title-group">
                    <h1 class="page-title">E-Commerce Merchants</h1>
                    <p class="page-subtitle text-muted">Manage registered sellers, client contacts, and fulfillment partnerships</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" id="btn-add-merchant">
                        ${ICONS.plus} Add Merchant
                    </button>
                </div>
            </div>
            <div class="stats-grid" id="merchant-stats"></div>
            <div class="table-section" id="merchant-table-wrapper"></div>
        </div>
    `;

    const statsContainer = container.querySelector('#merchant-stats');
    const tableWrapper = container.querySelector('#merchant-table-wrapper');
    const addBtn = container.querySelector('#btn-add-merchant');

    addBtn.addEventListener('click', () => openModal());

    /**
     * Load merchants from API and update UI
     */
    async function loadData() {
        try {
            showLoading(tableWrapper);
            const merchants = await api.merchants.list() || [];
            renderStats(merchants);
            renderTable(merchants);
        } catch (error) {
            showToast(error.message || 'Failed to load merchants', 'error');
            tableWrapper.innerHTML = `
                <div class="table-empty">
                    <div class="table-empty-icon">${ICONS.alert}</div>
                    <div>${escapeHtml(error.message || 'Failed to load merchants')}</div>
                </div>
            `;
        }
    }

    /**
     * Render stat cards
     * @param {Array<object>} merchants
     */
    function renderStats(merchants) {
        const total = merchants.length;
        const active = merchants.filter(m => m.status === 'ACTIVE').length;
        const inactive = merchants.filter(m => m.status === 'INACTIVE').length;

        statsContainer.innerHTML = `
            ${statCard('Total Merchants', formatNumber(total), ICONS.merchant, 'accent')}
            ${statCard('Active', formatNumber(active), ICONS.check, 'success')}
            ${statCard('Inactive', formatNumber(inactive), ICONS.alert, 'danger')}
        `;
    }

    /**
     * Render data table
     * @param {Array<object>} merchants
     */
    function renderTable(merchants) {
        tableWrapper.innerHTML = '';

        const columns = [
            {
                key: 'id',
                label: 'ID',
            },
            {
                key: 'merchantCode',
                label: 'Merchant Code',
                render: (row) => `<strong>${escapeHtml(row.merchantCode)}</strong>`,
            },
            {
                key: 'businessName',
                label: 'Business Name',
                render: (row) => escapeHtml(row.businessName),
            },
            {
                key: 'contactName',
                label: 'Contact',
                render: (row) => escapeHtml(row.contactName),
            },
            {
                key: 'email',
                label: 'Email',
                render: (row) => escapeHtml(row.email),
            },
            {
                key: 'phone',
                label: 'Phone',
                render: (row) => escapeHtml(row.phone),
            },
            {
                key: 'status',
                label: 'Status',
                render: (row) => statusBadge(row.status),
            },
        ];

        const table = buildTable({
            columns,
            data: merchants,
            onEdit: (merchant) => openModal(merchant),
            onDelete: (merchant) => handleDelete(merchant),
            emptyMessage: 'No merchants found',
        });

        tableWrapper.appendChild(table);
    }

    /**
     * Open modal dialog to create or edit a merchant
     * @param {object|null} merchant
     */
    function openModal(merchant = null) {
        const isEdit = Boolean(merchant && merchant.id);
        const title = isEdit ? 'Edit Merchant' : 'Add New Merchant';
        const submitLabel = isEdit ? 'Update Merchant' : 'Create Merchant';

        const bodyHtml = `
            <form id="merchant-form" novalidate>
                ${formField({
                    name: 'merchantCode',
                    label: 'Merchant Code',
                    type: 'text',
                    required: true,
                    value: merchant?.merchantCode || '',
                    placeholder: 'e.g. MCH-001',
                })}
                ${formField({
                    name: 'businessName',
                    label: 'Business Name',
                    type: 'text',
                    required: true,
                    value: merchant?.businessName || '',
                    placeholder: 'e.g. Acme Corporation',
                })}
                ${formField({
                    name: 'contactName',
                    label: 'Contact Name',
                    type: 'text',
                    required: true,
                    value: merchant?.contactName || '',
                    placeholder: 'e.g. Jane Doe',
                })}
                ${formField({
                    name: 'email',
                    label: 'Email',
                    type: 'email',
                    required: true,
                    value: merchant?.email || '',
                    placeholder: 'e.g. jane@acme.com',
                })}
                ${formField({
                    name: 'phone',
                    label: 'Phone',
                    type: 'text',
                    required: true,
                    value: merchant?.phone || '',
                    placeholder: 'e.g. +91 98765 43210',
                })}
                ${formField({
                    name: 'status',
                    label: 'Status',
                    type: 'select',
                    required: true,
                    value: merchant?.status || 'ACTIVE',
                    options: [
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'INACTIVE', label: 'Inactive' },
                    ],
                })}
            </form>
        `;

        showModal({
            title,
            bodyHtml,
            submitLabel,
            submitClass: 'btn-primary',
            onSubmit: async (modalBody, closeModal) => {
                const formData = getFormData(modalBody);

                const payload = {
                    merchantCode: formData.merchantCode,
                    businessName: formData.businessName,
                    contactName: formData.contactName,
                    email: formData.email,
                    phone: formData.phone,
                    status: formData.status,
                };

                try {
                    if (isEdit) {
                        await api.merchants.update(merchant.id, payload);
                        showToast('Merchant updated successfully', 'success');
                    } else {
                        await api.merchants.create(payload);
                        showToast('Merchant created successfully', 'success');
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
     * Handle merchant deletion
     * @param {object} merchant
     */
    function handleDelete(merchant) {
        showConfirm(`Are you sure you want to delete merchant "${merchant.businessName || merchant.merchantCode}"?`, async () => {
            try {
                await api.merchants.delete(merchant.id);
                showToast('Merchant deleted successfully', 'success');
                await loadData();
            } catch (error) {
                showToast(error.message || 'Failed to delete merchant', 'error');
            }
        });
    }

    // Initial data load
    await loadData();
}
