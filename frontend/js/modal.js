/* ============================================
   NEXORA WMS — Modal & Dialog Management System
   Autonomous Warehouse Intelligence Platform
   ============================================ */

import { escapeHtml } from './utils.js';

const MODAL_ICONS = {
    close: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    warning: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    danger: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
};

/**
 * Display a responsive modal dialog.
 * Guarantees reliable close/cancel/backdrop/escape interactions.
 */
export function showModal(config) {
    const {
        title,
        bodyHtml,
        submitLabel = 'Save',
        submitClass = 'btn-primary',
        onSubmit,
        onOpen,
        closeLabel,
    } = config;

    document.querySelectorAll('.modal-backdrop').forEach((el) => {
        try { el.remove(); } catch (_) {}
    });

    const closeBtnText = closeLabel || (onSubmit ? 'Cancel' : 'Close');

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal-header">
                <h3 class="modal-title" id="modal-title">${escapeHtml(title)}</h3>
                <button type="button" class="modal-close" data-close aria-label="Close modal">${MODAL_ICONS.close}</button>
            </div>
            <div class="modal-body">${bodyHtml}</div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline" data-close>${escapeHtml(closeBtnText)}</button>
                ${onSubmit ? `<button type="button" class="btn ${submitClass}" data-submit>${escapeHtml(submitLabel)}</button>` : ''}
            </div>
        </div>
    `;

    let isClosed = false;

    function closeModal() {
        if (isClosed) return;
        isClosed = true;

        document.removeEventListener('keydown', handleKeyDown);
        backdrop.style.pointerEvents = 'none';
        backdrop.classList.add('closing');

        let removed = false;
        const doRemove = () => {
            if (removed) return;
            removed = true;
            if (backdrop && backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
        };

        backdrop.addEventListener('animationend', doRemove, { once: true });
        setTimeout(doRemove, 160);
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            e.preventDefault();
            closeModal();
            return;
        }
        if (e.key === 'Enter' && onSubmit) {
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT')) {
                e.preventDefault();
                const submitBtn = backdrop.querySelector('[data-submit]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        }
    }
    document.addEventListener('keydown', handleKeyDown);

    let mouseDownTarget = null;
    backdrop.addEventListener('mousedown', (e) => {
        mouseDownTarget = e.target;
    });

    backdrop.addEventListener('click', (e) => {
        if (e.target.closest('[data-close]')) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
            return;
        }
        if (e.target === backdrop && mouseDownTarget === backdrop) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        }
    });

    if (onSubmit) {
        const submitBtn = backdrop.querySelector('[data-submit]');
        if (submitBtn) {
            submitBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (submitBtn.disabled) return;

                const origHtml = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner" style="width:14px; height:14px; border-width:2px; margin-right:6px; display:inline-block; vertical-align:middle;"></span> Processing...`;

                try {
                    await onSubmit(backdrop.querySelector('.modal-body'), closeModal);
                } catch (err) {
                    console.error('Modal onSubmit error:', err);
                } finally {
                    if (!isClosed && submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = origHtml;
                    }
                }
            });
        }
    }

    document.body.appendChild(backdrop);

    if (typeof onOpen === 'function') {
        try {
            onOpen(backdrop.querySelector('.modal'));
        } catch (err) {
            console.error('Modal onOpen callback error:', err);
        }
    }

    setTimeout(() => {
        const firstInput = backdrop.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) firstInput.focus();
    }, 50);

    return backdrop;
}

export function showConfirm(message, onConfirm, options = {}) {
    const isDanger = options.confirmClass === 'btn-danger' || !options.confirmClass;
    const icon = isDanger ? MODAL_ICONS.danger : MODAL_ICONS.warning;

    showModal({
        title: options.title || 'Confirm Action',
        bodyHtml: `
            <div style="display:flex; gap:1rem; align-items:flex-start; padding: 0.5rem 0;">
                <div style="color:${isDanger ? 'var(--danger)' : 'var(--warning)'}; flex-shrink:0;">
                    ${icon}
                </div>
                <p style="margin:0; line-height:1.5; color:var(--text-primary); font-size:0.95rem;">${escapeHtml(message)}</p>
            </div>
        `,
        submitLabel: options.confirmLabel || (isDanger ? 'Delete' : 'Confirm'),
        submitClass: options.confirmClass || 'btn-danger',
        onSubmit: async (body, close) => {
            if (typeof onConfirm === 'function') {
                await onConfirm();
            }
            close();
        },
    });
}

export default {
    showModal,
    showConfirm,
};
