/* ============================================
   NEXORA WMS — Reusable UI Components
   Autonomous Warehouse Intelligence Platform
   ============================================ */

import { escapeHtml, getStatusColor, formatEnum, capitalize } from './utils.js';

// ─── SVG Icon Library (Enterprise Industrial Robotics Theme) ─────────────────
export const ICONS = {
    // Navigation / Modules
    dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>`,
    warehouse: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    bin: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    product: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
    inventory: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>`,
    robot: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>`,
    merchant: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-5z"></path><line x1="3" y1="7" x2="21" y2="7"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
    order: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    fulfillment: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
    invoice: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
    budget: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,

    // Actions
    plus: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
    refresh: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>`,
    close: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,

    // Metrics / Status Indicators
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    alert: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    activity: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
    zap: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    battery: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect><line x1="23" y1="13" x2="23" y2="11"></line></svg>`,
    clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    lock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
    settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
    users: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,

    // Theme Switch
    sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
    moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,

    // Empty States
    inbox: `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`,
};

// ─── Toast Notification System ───────────────────────────────────────────────
let toastContainer = null;
function ensureToastContainer() {
    if (!toastContainer || !toastContainer.parentNode) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

const TOAST_ICONS = {
    success: ICONS.check,
    error: ICONS.close,
    warning: ICONS.alert,
    info: ICONS.activity,
};

const recentToasts = new Map();

export function showToast(message, type = 'info', duration = 4000) {
    if (!message) return;
    const key = `${type}:${message}`;
    const now = Date.now();
    if (recentToasts.has(key) && now - recentToasts.get(key) < 2500) {
        return; // Suppress duplicate toast spam
    }
    recentToasts.set(key, now);

    const container = ensureToastContainer();

    // Limit active toasts to at most 3
    while (container.children.length >= 3) {
        container.firstElementChild.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `
        <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
        <div class="toast-content">
            <div class="toast-title">${capitalize(type)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close-btn" aria-label="Dismiss">${ICONS.close}</button>
    `;

    const closeBtn = toast.querySelector('.toast-close-btn');
    function dismiss() {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => toast.remove());
        setTimeout(() => { try { toast.remove(); } catch (_) {} }, 300);
    }
    if (closeBtn) closeBtn.addEventListener('click', dismiss);

    container.appendChild(toast);
    setTimeout(dismiss, duration);
}

// ─── Status Badge ────────────────────────────────────────────────────────────
export function statusBadge(status) {
    if (!status) return '<span class="text-muted">—</span>';
    const colorClass = getStatusColor(status);
    const display = formatEnum(status);
    return `<span class="status-badge ${colorClass}">${escapeHtml(display)}</span>`;
}

// ─── Deep Object Access ──────────────────────────────────────────────────────
function getDeep(obj, path) {
    if (!path) return null;
    return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
}

// ─── Data Table Builder ──────────────────────────────────────────────────────
export function buildTable(config) {
    const { columns, data, onEdit, onDelete, actions = [], emptyMessage = 'No records found' } = config;
    const container = document.createElement('div');
    container.className = 'table-container animate-fade-in';

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="table-empty">
                <div class="table-empty-icon">${ICONS.inbox}</div>
                <div class="table-empty-title" style="font-weight:600; font-size:1rem; margin-top:0.5rem; color:var(--text-primary);">${escapeHtml(emptyMessage)}</div>
                <div class="table-empty-desc" style="font-size:0.85rem; color:var(--text-muted); margin-top:0.25rem;">New items will automatically appear here once registered.</div>
            </div>
        `;
        return container;
    }

    const hasActions = onEdit || onDelete || actions.length > 0;
    let headerHtml = columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('');
    if (hasActions) headerHtml += '<th>Actions</th>';

    let bodyHtml = data.map((row, idx) => {
        let cells = columns.map(col => {
            const rawVal = getDeep(row, col.key);
            let value;
            if (col.render) {
                value = col.render(row, idx, rawVal);
            } else {
                value = rawVal;
            }
            return `<td>${value != null ? value : '<span class="text-muted">—</span>'}</td>`;
        }).join('');

        if (hasActions) {
            let actionsHtml = '<td><div class="table-actions">';
            if (onEdit) {
                actionsHtml += `<button class="btn btn-sm btn-secondary" data-action="edit" data-index="${idx}" title="Edit">${ICONS.edit} Edit</button>`;
            }
            actions.forEach((act, ai) => {
                actionsHtml += `<button class="btn btn-sm ${act.class || 'btn-secondary'}" data-action="custom-${ai}" data-index="${idx}" title="${escapeHtml(act.label)}">${act.icon || escapeHtml(act.label)}</button>`;
            });
            if (onDelete) {
                actionsHtml += `<button class="btn btn-sm btn-danger" data-action="delete" data-index="${idx}" title="Delete">${ICONS.trash}</button>`;
            }
            actionsHtml += '</div></td>';
            cells += actionsHtml;
        }

        return `<tr>${cells}</tr>`;
    }).join('');

    container.innerHTML = `<table class="data-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;

    container.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const index = parseInt(btn.dataset.index);
        const row = data[index];
        if (action === 'edit' && onEdit) onEdit(row);
        if (action === 'delete' && onDelete) onDelete(row);
        if (action.startsWith('custom-')) {
            const ai = parseInt(action.split('-')[1]);
            if (actions[ai] && actions[ai].onClick) actions[ai].onClick(row);
        }
    });

    return container;
}

// ─── Re-export Modal Functions ───────────────────────────────────────────────
export { showModal, showConfirm } from './modal.js';

// ─── Form Field Generator ────────────────────────────────────────────────────
export function formField(field) {
    const { name, label, type = 'text', required = false, value = '', placeholder = '', options = [], attrs = {} } = field;
    const req = required ? 'required' : '';
    const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
    const escapedVal = escapeHtml(value);
    let input;

    if (type === 'select') {
        const optHtml = options.map(o => {
            const isSel = String(o.value) === String(value) ? 'selected' : '';
            return `<option value="${escapeHtml(o.value)}" ${isSel}>${escapeHtml(o.label)}</option>`;
        }).join('');
        input = `<select class="form-select" name="${name}" ${req} ${attrStr}><option value="">Select...</option>${optHtml}</select>`;
    } else if (type === 'textarea') {
        input = `<textarea class="form-textarea" name="${name}" placeholder="${escapeHtml(placeholder)}" ${req} ${attrStr}>${escapedVal}</textarea>`;
    } else {
        input = `<input class="form-input" type="${type}" name="${name}" value="${escapedVal}" placeholder="${escapeHtml(placeholder)}" ${req} ${attrStr}>`;
    }

    return `
        <div class="form-group">
            <label class="form-label">${escapeHtml(label)}${required ? ' <span class="form-required" style="color:var(--danger)">*</span>' : ''}</label>
            ${input}
            <div class="form-error" data-error="${name}"></div>
        </div>
    `;
}

// ─── Form Data Extraction ────────────────────────────────────────────────────
export function getFormData(container) {
    const data = {};
    container.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.name) {
            let val = el.value.trim();
            if (el.type === 'number' && val !== '') {
                val = parseFloat(val);
            }
            data[el.name] = val;
        }
    });
    return data;
}

// ─── Form Error Display ──────────────────────────────────────────────────────
export function showFormErrors(container, errors) {
    container.querySelectorAll('.form-error').forEach(el => (el.textContent = ''));
    container.querySelectorAll('.form-input.error, .form-select.error, .form-textarea.error').forEach(el => el.classList.remove('error'));
    if (!errors) return;

    Object.entries(errors).forEach(([field, message]) => {
        const errorEl = container.querySelector(`[data-error="${field}"]`);
        const inputEl = container.querySelector(`[name="${field}"]`);
        if (errorEl) errorEl.textContent = message;
        if (inputEl) inputEl.classList.add('error');
    });
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
export function statCard(label, value, icon = '', colorVar = '') {
    if (typeof label === 'object' && label !== null) {
        const opts = label;
        label = opts.label;
        value = opts.value;
        icon = opts.icon || '';
        colorVar = opts.colorVar || opts.color || '';
    }

    let colorStyle = '';
    if (colorVar) {
        if (colorVar.startsWith('accent-') || colorVar.startsWith('status-') || colorVar.startsWith('var(')) {
            colorStyle = `color: var(--${colorVar}, var(--primary));`;
        } else {
            colorStyle = `color: var(--${colorVar}, var(--primary));`;
        }
    }

    return `
        <div class="stat-card">
            ${icon ? `<div class="stat-card-icon" style="${colorStyle}">${icon}</div>` : ''}
            <div class="stat-card-label">${escapeHtml(label)}</div>
            <div class="stat-card-value">${escapeHtml(String(value != null ? value : 0))}</div>
        </div>
    `;
}

// ─── Loading State ───────────────────────────────────────────────────────────
export function showLoading(container) {
    container.innerHTML = `
        <div class="page-loading animate-fade-in">
            <div class="spinner"></div>
            <span>Loading data...</span>
        </div>
    `;
}

// ─── Skeleton Loaders ────────────────────────────────────────────────────────
export function skeletonCards(count = 4) {
    return `<div class="stats-grid">${Array(count).fill('<div class="skeleton-card"><div class="skeleton-line skeleton-short"></div><div class="skeleton-line skeleton-number"></div></div>').join('')}</div>`;
}

export function skeletonTable(rows = 5, cols = 4) {
    const headerCells = Array(cols).fill('<th><div class="skeleton-line skeleton-short"></div></th>').join('');
    const bodyRows = Array(rows).fill(`<tr>${Array(cols).fill('<td><div class="skeleton-line"></div></td>').join('')}</tr>`).join('');
    return `<div class="table-container"><table class="data-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
}

// ─── Theme Management ────────────────────────────────────────────────────────
export function initTheme() {
    const saved = localStorage.getItem('nexora-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    return saved;
}

export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nexora-theme', next);
    updateThemeToggleIcon(next);
    return next;
}

export function updateThemeToggleIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
        btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
}
