/* ============================================
   NEXORA WMS — Application Router & Bootstrap
   Autonomous Warehouse Intelligence Platform
   ============================================ */

import { initTheme, toggleTheme, updateThemeToggleIcon } from './components.js';
import { initAuth, isAuthenticated, showAuthModal } from './auth.js';

const PAGE_MODULES = {
    dashboard:   () => import('./pages/dashboard.js'),
    warehouse:   () => import('./pages/warehouse.js'),
    bin:         () => import('./pages/bin.js'),
    product:     () => import('./pages/product.js'),
    inventory:   () => import('./pages/inventory.js'),
    amr:         () => import('./pages/amr.js'),
    merchant:    () => import('./pages/merchant.js'),
    order:       () => import('./pages/order.js'),
    fulfillment: () => import('./pages/fulfillment.js'),
    invoice:     () => import('./pages/invoice.js'),
    budget:      () => import('./pages/budget.js'),
};

const PAGE_TITLES = {
    dashboard:   'System Dashboard',
    warehouse:   'Warehouses',
    bin:         'Storage Bins',
    product:     'Product Catalog',
    inventory:   'Inventory & Stock',
    amr:         'AMR Robot Fleet',
    merchant:    'E-Commerce Merchants',
    order:       'Sales Orders',
    fulfillment: 'Fulfillment & Picks',
    invoice:     'Customer Invoices',
    budget:      'Budgets & Expenses',
};

let currentPage = null;

function getPageFromHash() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    return hash.split('/')[0];
}

// ─── Theme Initialization & Persistence ──────────────────────────────────────
const activeTheme = initTheme();
updateThemeToggleIcon(activeTheme);

const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        toggleTheme();
    });
}

// ─── Mobile Sidebar Controls ─────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');

function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

function toggleMobileSidebar() {
    if (sidebar) sidebar.classList.toggle('open');
    if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
}

if (menuToggle) {
    menuToggle.addEventListener('click', toggleMobileSidebar);
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
}

// ─── Navigation Engine ───────────────────────────────────────────────────────
async function navigateTo(pageName) {
    if (!PAGE_MODULES[pageName]) {
        pageName = 'dashboard';
    }

    closeMobileSidebar();
    currentPage = pageName;

    // Update active sidebar nav link
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });

    // Update page & header title
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = PAGE_TITLES[pageName] || pageName;
    document.title = 'NEXORA WMS — ' + (PAGE_TITLES[pageName] || pageName);

    const content = document.getElementById('page-content');
    if (!content) return;

    const loader = PAGE_MODULES[pageName];
    content.innerHTML = `
        <div class="page-loading animate-fade-in">
            <div class="spinner"></div>
            <span>Loading ${PAGE_TITLES[pageName] || pageName}...</span>
        </div>
    `;

    try {
        const module = await loader();
        content.innerHTML = '';
        if (typeof module.render === 'function') {
            await module.render(content);
        } else if (module.default && typeof module.default.render === 'function') {
            await module.default.render(content);
        } else if (typeof module.default === 'function') {
            await module.default(content);
        }
    } catch (err) {
        console.error(`Error loading page module [${pageName}]:`, err);
        content.innerHTML = `
            <div class="card animate-fade-in" style="margin-top: 2rem; text-align: center; padding: 3rem;">
                <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--danger);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <h3 style="color: var(--danger); margin-bottom: 0.5rem; font-weight: 700;">Failed to Load Module</h3>
                <p class="text-muted" style="margin-bottom: 1.5rem;">${err.message || 'Network error or unable to resolve module dependencies'}</p>
                <button class="btn btn-primary" onclick="window.location.reload()">Reload Application</button>
            </div>
        `;
    }
}

// ─── Real-Time Header Clock ──────────────────────────────────────────────────
function updateClock() {
    const el = document.getElementById('header-clock');
    if (el) {
        el.textContent = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

window.addEventListener('hashchange', () => navigateTo(getPageFromHash()));
setInterval(updateClock, 1000);
updateClock();

// Initialize Authentication & Security Gateway
initAuth();

navigateTo(getPageFromHash());
