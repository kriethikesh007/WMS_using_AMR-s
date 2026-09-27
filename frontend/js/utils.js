export function formatDate(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}
export function formatDateTime(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
export function formatCurrency(amount) {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
}
export function formatNumber(n) {
    if (n == null) return '—';
    return new Intl.NumberFormat('en-IN').format(n);
}
export function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
const STATUS_COLORS = {
    ACTIVE: 'success', INACTIVE: 'danger', MAINTENANCE: 'warning',
    AVAILABLE: 'success', OCCUPIED: 'accent', FULL: 'warning',
    BUSY: 'accent', CHARGING: 'violet', OFFLINE: 'danger',
    CREATED: 'info', PROCESSING: 'warning', COMPLETED: 'success', CANCELLED: 'danger',
    ASSIGNED: 'accent', IN_PROGRESS: 'warning', FAILED: 'danger',
    GENERATED: 'info', PAID: 'success',
    EXHAUSTED: 'danger', CLOSED: 'neutral',
};
export function getStatusColor(status) { return STATUS_COLORS[status] || 'neutral'; }
export function capitalize(str) { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); }
export function formatEnum(value) { if (!value) return '—'; return value.split('_').map(capitalize).join(' '); }