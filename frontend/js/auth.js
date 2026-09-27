/* ==========================================================================
   NEXORA WMS — Authentication & Security Gateway
   Autonomous Warehouse Intelligence Platform
   ========================================================================== */

import api, { getAuthToken, getAuthUser, setAuthSession, clearAuthSession } from './api.js';
import { showToast } from './components.js';
import { escapeHtml } from './utils.js';

// SVG Icons
const EYE_SHOW_ICON = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const EYE_HIDE_ICON = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

export function isAuthenticated() {
    return Boolean(getAuthToken());
}

export function getCurrentUser() {
    return getAuthUser();
}

export function isAdmin() {
    if (!isAuthenticated()) return false;
    const u = getAuthUser();
    return u && (u.role === 'ROLE_ADMIN' || u.role === 'ADMIN');
}

export function isOperator() {
    if (!isAuthenticated()) return false;
    const u = getAuthUser();
    return u && (u.role === 'ROLE_OPERATOR' || u.role === 'OPERATOR');
}

export function requireAdmin(actionName = 'This action') {
    if (!isAuthenticated()) {
        showAuthModal({
            mode: 'login',
            reason: `${actionName} requires Administrator authentication.`,
        });
        return false;
    }
    if (!isAdmin()) {
        showToast(`Access Denied: ${actionName} requires Administrator privileges (ROLE_ADMIN).`, 'warning', 5000);
        return false;
    }
    return true;
}

/**
 * Execute login against existing backend /api/auth/login
 */
export async function login(username, password) {
    const res = await api.auth.login({ username, password });
    if (res && res.token) {
        setAuthSession(res.token, {
            username: res.username,
            role: res.role,
            fullName: res.fullName || res.username,
        });
        return res;
    }
    throw new Error('Invalid authentication response from server');
}

/**
 * Execute registration against existing backend /api/auth/register
 */
export async function register(userData) {
    const res = await api.auth.register(userData);
    if (res && res.token) {
        setAuthSession(res.token, {
            username: res.username,
            role: res.role,
            fullName: res.fullName || res.username,
        });
        return res;
    }
    return res;
}

/**
 * Sign out and clear stored JWT session
 */
export function logout() {
    const user = getAuthUser();
    clearAuthSession();
    showToast(user ? `Signed out (${user.username})` : 'Signed out successfully', 'info');
    window.location.reload();
}

/**
 * Renders the top header user indicator or sign-in button
 */
export function renderHeaderAuth(container) {
    if (!container) return;

    const user = getAuthUser();
    const authed = isAuthenticated() && user;

    if (authed) {
        const roleClean = (user.role || 'ROLE_OPERATOR').replace('ROLE_', '');
        const isAdminUser = roleClean === 'ADMIN';
        const displayName = user.username || 'Operator';
        const initials = displayName.slice(0, 2).toUpperCase();

        container.innerHTML = `
            <div class="header-user-pill" title="Signed in as ${escapeHtml(user.fullName || user.username)} (${escapeHtml(roleClean)})">
                <div class="user-avatar">${escapeHtml(initials)}</div>
                <div class="user-meta">
                    <span class="user-name">${escapeHtml(displayName)}</span>
                    <span class="user-role-badge ${isAdminUser ? 'role-admin' : 'role-operator'}">
                        ${isAdminUser ? 'ADMIN' : 'OPERATOR'}
                    </span>
                </div>
                <button type="button" class="btn-logout" id="header-logout-btn" title="Sign Out (${escapeHtml(displayName)})" aria-label="Sign Out">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        `;

        const logoutBtn = container.querySelector('#header-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Sign out of NEXORA WMS?')) {
                    logout();
                }
            });
        }
    } else {
        container.innerHTML = `
            <button type="button" class="btn btn-sm btn-primary auth-signin-btn" id="header-signin-btn" style="box-shadow: 0 0 14px rgba(34, 197, 94, 0.4);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <span style="font-weight:700;">Sign In</span>
            </button>
        `;

        const signinBtn = container.querySelector('#header-signin-btn');
        if (signinBtn) {
            signinBtn.addEventListener('click', () => {
                showAuthModal({ mode: 'login' });
            });
        }
    }

    // Synchronize sidebar item if present
    const sidebarLabel = document.getElementById('sidebar-auth-label');
    if (sidebarLabel) {
        sidebarLabel.textContent = authed ? `Operator: ${user.username}` : 'Operator Sign In';
    }
}

/**
 * Display the redesigned Enterprise Authentication Modal
 */
export function showAuthModal(options = {}) {
    const {
        mode = 'login',
        reason = null,
        onSuccess = null,
    } = options;

    // Remove any existing auth modal
    document.querySelectorAll('.auth-modal-backdrop').forEach(el => el.remove());

    const backdrop = document.createElement('div');
    backdrop.className = 'auth-modal-backdrop';

    backdrop.innerHTML = `
        <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <!-- Brand Header -->
            <div class="auth-modal__header">
                <div class="auth-modal__logo" title="NEXORA WMS">
                    <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
                        <path d="M26 74 V26 L74 74 V26" stroke="#22C55E" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="50" cy="50" r="7" fill="#4ADE80"/>
                    </svg>
                </div>
                <div class="auth-modal__title-group">
                    <h3 class="auth-modal__title" id="auth-modal-title">NEXORA WMS</h3>
                    <div class="auth-modal__subtitle">Autonomous Warehouse Intelligence</div>
                    <span class="auth-modal__badge">Security Gateway</span>
                </div>
                <button type="button" class="auth-modal__close" data-close aria-label="Close authentication modal" title="Close">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <!-- Optional Notice / Reason Banner -->
            ${reason ? `
                <div class="auth-modal__reason">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <span>${escapeHtml(reason)}</span>
                </div>
            ` : ''}

            <!-- Polished Segmented Tabs -->
            <div class="auth-modal__tabs-container">
                <div class="auth-modal__tabs" role="tablist">
                    <button type="button" class="auth-modal__tab ${mode === 'login' ? 'active' : ''}" data-tab="login" role="tab" aria-selected="${mode === 'login'}">Sign In</button>
                    <button type="button" class="auth-modal__tab ${mode === 'register' ? 'active' : ''}" data-tab="register" role="tab" aria-selected="${mode === 'register'}">Register Operator</button>
                </div>
            </div>

            <!-- Modal Body Content -->
            <div class="auth-modal__body">
                <!-- ==================== SIGN IN VIEW ==================== -->
                <form class="auth-modal__form" id="form-auth-login" style="${mode === 'login' ? '' : 'display: none;'}">
                    <div class="auth-modal__error" id="login-error-banner" style="display: none;"></div>

                    <div class="auth-modal__field">
                        <label class="auth-modal__label" for="login-username">OPERATOR ID / USERNAME</label>
                        <div class="auth-modal__input-wrapper">
                            <span class="auth-modal__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </span>
                            <input class="auth-modal__input" id="login-username" name="username" type="text" placeholder="e.g. admin" required autocomplete="username" spellcheck="false">
                        </div>
                    </div>

                    <div class="auth-modal__field">
                        <label class="auth-modal__label" for="login-password">ACCESS KEY / PASSWORD</label>
                        <div class="auth-modal__input-wrapper">
                            <span class="auth-modal__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </span>
                            <input class="auth-modal__input" id="login-password" name="password" type="password" placeholder="••••••••" required autocomplete="current-password">
                            <button type="button" class="auth-modal__password-toggle" id="btn-toggle-login-pwd" aria-label="Toggle password visibility" title="Show/Hide password">
                                ${EYE_SHOW_ICON}
                            </button>
                        </div>
                    </div>

                    <!-- Subtle Secondary Demo Access Control -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 8px 0 16px;">
                        <button type="button" class="auth-modal__demo" id="btn-demo-admin" title="1-Click Fill: Full Admin Permissions" style="margin: 0; padding: 8px 6px;">
                            <span class="auth-modal__demo-spark">⚡</span>
                            <span class="auth-modal__demo-text">Admin · <strong>admin</strong></span>
                        </button>
                        <button type="button" class="auth-modal__demo" id="btn-demo-operator" title="1-Click Fill: Floor Operator Permissions" style="margin: 0; padding: 8px 6px;">
                            <span class="auth-modal__demo-spark">⚡</span>
                            <span class="auth-modal__demo-text">Operator · <strong>operator</strong></span>
                        </button>
                    </div>

                    <!-- Primary Authenticate CTA -->
                    <button type="submit" class="auth-modal__submit" id="btn-login-submit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <span>Authenticate Operator</span>
                    </button>
                </form>

                <!-- ==================== REGISTER VIEW ==================== -->
                <form class="auth-modal__form" id="form-auth-register" style="${mode === 'register' ? '' : 'display: none;'}">
                    <div class="auth-modal__error" id="register-error-banner" style="display: none;"></div>

                    <div class="auth-modal__field">
                        <label class="auth-modal__label" for="reg-fullname">FULL NAME</label>
                        <div class="auth-modal__input-wrapper">
                            <span class="auth-modal__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </span>
                            <input class="auth-modal__input" id="reg-fullname" name="fullName" type="text" placeholder="e.g. Warehouse Operations Lead" spellcheck="false">
                        </div>
                    </div>

                    <div class="auth-modal__field">
                        <label class="auth-modal__label" for="reg-username">OPERATOR ID / USERNAME</label>
                        <div class="auth-modal__input-wrapper">
                            <span class="auth-modal__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><line x1="1.05" y1="12" x2="7" y2="12"></line><line x1="17.01" y1="12" x2="22.96" y2="12"></line></svg>
                            </span>
                            <input class="auth-modal__input" id="reg-username" name="username" type="text" placeholder="e.g. operator1" required minlength="3" autocomplete="username" spellcheck="false">
                        </div>
                    </div>

                    <div class="auth-modal__field">
                        <label class="auth-modal__label" for="reg-password">ACCESS KEY / PASSWORD</label>
                        <div class="auth-modal__input-wrapper">
                            <span class="auth-modal__icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            </span>
                            <input class="auth-modal__input" id="reg-password" name="password" type="password" placeholder="Min 6 characters" required minlength="6" autocomplete="new-password">
                            <button type="button" class="auth-modal__password-toggle" id="btn-toggle-reg-pwd" aria-label="Toggle password visibility" title="Show/Hide password">
                                ${EYE_SHOW_ICON}
                            </button>
                        </div>
                    </div>

                    <div class="auth-modal__field">
                        <label class="auth-modal__label" for="reg-role">SYSTEM ROLE</label>
                        <select class="auth-modal__select" id="reg-role" name="role">
                            <option value="ROLE_OPERATOR">ROLE_OPERATOR (Warehouse Operations)</option>
                            <option value="ROLE_MANAGER">ROLE_MANAGER (Logistics & Inventory)</option>
                            <option value="ROLE_ADMIN">ROLE_ADMIN (Full Platform Authority)</option>
                        </select>
                    </div>

                    <!-- Register Primary Button -->
                    <button type="submit" class="auth-modal__submit" id="btn-register-submit" style="margin-top: 6px;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        <span>Create Operator</span>
                    </button>

                    <button type="button" class="auth-modal__switch-link" id="btn-back-to-signin">
                        Back to Sign In
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);

    // Form elements
    const loginForm = backdrop.querySelector('#form-auth-login');
    const registerForm = backdrop.querySelector('#form-auth-register');
    const tabBtns = backdrop.querySelectorAll('.auth-modal__tab');
    const loginErrorBanner = backdrop.querySelector('#login-error-banner');
    const registerErrorBanner = backdrop.querySelector('#register-error-banner');
    const demoAdminBtn = backdrop.querySelector('#btn-demo-admin');
    const demoOperatorBtn = backdrop.querySelector('#btn-demo-operator');
    const loginSubmitBtn = backdrop.querySelector('#btn-login-submit');
    const registerSubmitBtn = backdrop.querySelector('#btn-register-submit');
    const backToSigninBtn = backdrop.querySelector('#btn-back-to-signin');

    // Password toggles
    const toggleLoginPwdBtn = backdrop.querySelector('#btn-toggle-login-pwd');
    const loginPwdInput = backdrop.querySelector('#login-password');
    if (toggleLoginPwdBtn && loginPwdInput) {
        toggleLoginPwdBtn.addEventListener('click', () => {
            const isPassword = loginPwdInput.getAttribute('type') === 'password';
            loginPwdInput.setAttribute('type', isPassword ? 'text' : 'password');
            toggleLoginPwdBtn.innerHTML = isPassword ? EYE_HIDE_ICON : EYE_SHOW_ICON;
        });
    }

    const toggleRegPwdBtn = backdrop.querySelector('#btn-toggle-reg-pwd');
    const regPwdInput = backdrop.querySelector('#reg-password');
    if (toggleRegPwdBtn && regPwdInput) {
        toggleRegPwdBtn.addEventListener('click', () => {
            const isPassword = regPwdInput.getAttribute('type') === 'password';
            regPwdInput.setAttribute('type', isPassword ? 'text' : 'password');
            toggleRegPwdBtn.innerHTML = isPassword ? EYE_HIDE_ICON : EYE_SHOW_ICON;
        });
    }

    // Modal close helper
    function closeAuthModal() {
        backdrop.classList.add('closing');
        setTimeout(() => {
            try { backdrop.remove(); } catch (_) {}
        }, 180);
    }

    backdrop.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', closeAuthModal);
    });

    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeAuthModal();
    });

    // Escape key listener
    function handleKeyDown(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            document.removeEventListener('keydown', handleKeyDown);
            closeAuthModal();
        }
    }
    document.addEventListener('keydown', handleKeyDown);

    // Tab switching function
    function switchTab(targetTab) {
        tabBtns.forEach(btn => {
            const isActive = btn.dataset.tab === targetTab;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (targetTab === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            setTimeout(() => {
                const u = backdrop.querySelector('#login-username');
                if (u) u.focus();
            }, 60);
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            setTimeout(() => {
                const fn = backdrop.querySelector('#reg-fullname');
                if (fn) fn.focus();
            }, 60);
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    if (backToSigninBtn) {
        backToSigninBtn.addEventListener('click', () => switchTab('login'));
    }

    // 1-Click Quick Demo autofill
    if (demoOperatorBtn) {
        demoOperatorBtn.addEventListener('click', () => {
            const u = backdrop.querySelector('#login-username');
            const p = backdrop.querySelector('#login-password');
            if (u && p) {
                u.value = 'operator';
                p.value = 'operator123';
                u.focus();
                demoOperatorBtn.style.borderColor = '#4ade80';
                setTimeout(() => { demoOperatorBtn.style.borderColor = ''; }, 400);
            }
        });
    }

    if (demoAdminBtn) {
        demoAdminBtn.addEventListener('click', () => {
            const u = backdrop.querySelector('#login-username');
            const p = backdrop.querySelector('#login-password');
            if (u && p) {
                u.value = 'admin';
                p.value = 'admin123';
                u.focus();
                demoAdminBtn.style.borderColor = '#4ade80';
                setTimeout(() => {
                    demoAdminBtn.style.borderColor = '';
                }, 400);
            }
        });
    }

    // Sign In Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginErrorBanner.style.display = 'none';
        loginErrorBanner.innerHTML = '';

        const username = backdrop.querySelector('#login-username').value.trim();
        const password = backdrop.querySelector('#login-password').value;

        if (!username || !password) {
            loginErrorBanner.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span>Please enter both Operator ID and Access Key.</span>
            `;
            loginErrorBanner.style.display = 'flex';
            return;
        }

        const originalBtnContent = loginSubmitBtn.innerHTML;
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.innerHTML = `
            <span class="auth-spinner"></span>
            <span>Authenticating...</span>
        `;

        try {
            const authResult = await login(username, password);
            showToast(`Authenticated as ${authResult.username} (${(authResult.role || '').replace('ROLE_', '')})`, 'success');
            closeAuthModal();

            if (typeof onSuccess === 'function') {
                onSuccess(authResult);
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error('Login error:', err);
            const msg = err.status === 401
                ? 'Invalid operator credentials. Please check your Operator ID and Access Key.'
                : (err.message || 'Authentication failed. Please verify server connection.');

            loginErrorBanner.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <div><strong>Authentication failed:</strong> ${escapeHtml(msg)}</div>
            `;
            loginErrorBanner.style.display = 'flex';
        } finally {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.innerHTML = originalBtnContent;
        }
    });

    // Register Submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerErrorBanner.style.display = 'none';
        registerErrorBanner.innerHTML = '';

        const username = backdrop.querySelector('#reg-username').value.trim();
        const fullName = backdrop.querySelector('#reg-fullname').value.trim();
        const password = backdrop.querySelector('#reg-password').value;
        const role = backdrop.querySelector('#reg-role').value;

        if (!username || !password) {
            registerErrorBanner.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <span>Operator ID and Access Key are required.</span>
            `;
            registerErrorBanner.style.display = 'flex';
            return;
        }

        const originalBtnContent = registerSubmitBtn.innerHTML;
        registerSubmitBtn.disabled = true;
        registerSubmitBtn.innerHTML = `
            <span class="auth-spinner"></span>
            <span>Registering Operator...</span>
        `;

        try {
            const authResult = await register({ username, fullName, password, role });
            showToast(`Operator ${username} registered successfully`, 'success');
            closeAuthModal();

            if (typeof onSuccess === 'function') {
                onSuccess(authResult);
            } else {
                window.location.reload();
            }
        } catch (err) {
            console.error('Registration error:', err);
            registerErrorBanner.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <div><strong>Registration failed:</strong> ${escapeHtml(err.message || 'Operator ID may already be in use.')}</div>
            `;
            registerErrorBanner.style.display = 'flex';
        } finally {
            registerSubmitBtn.disabled = false;
            registerSubmitBtn.innerHTML = originalBtnContent;
        }
    });

    // Auto-focus username
    setTimeout(() => {
        const u = backdrop.querySelector('#login-username');
        if (u) u.focus();
    }, 100);
}

/**
 * Initialize Authentication Gateway listeners and header controls
 */
export function initAuth() {
    const headerAuthContainer = document.getElementById('header-auth');
    if (headerAuthContainer) {
        renderHeaderAuth(headerAuthContainer);
    }

    const sidebarAuthBtn = document.getElementById('sidebar-auth-btn');
    if (sidebarAuthBtn) {
        sidebarAuthBtn.addEventListener('click', () => {
            if (isAuthenticated()) {
                const u = getAuthUser();
                if (confirm(`Signed in as ${u ? u.username : 'Operator'}. Do you want to sign out?`)) {
                    logout();
                }
            } else {
                showAuthModal({ mode: 'login' });
            }
        });
    }

    // Re-render header on auth session change
    window.addEventListener('auth:change', () => {
        const container = document.getElementById('header-auth');
        if (container) renderHeaderAuth(container);
    });

    // Automatically pop login modal when an API returns 401 Unauthorized
    window.addEventListener('auth:forbidden', () => {
        showToast('Access Denied: This operation requires Administrator privileges (ROLE_ADMIN).', 'warning', 5000);
    });

    window.addEventListener('auth:unauthorized', () => {
        showAuthModal({
            mode: 'login',
            reason: 'Session expired or authorization required. Please authenticate to continue.',
        });
    });
}
