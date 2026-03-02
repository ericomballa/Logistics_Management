export const toast = {
    show(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        container.appendChild(el);

        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
        }, 3000);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); }
};

export const formatters = {
    date(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },
    currency(amount) {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' }).format(amount);
    }
};

export function renderLoader() {
    return `<div class="spinner"></div><p style="text-align:center;color:var(--text-muted)">Chargement...</p>`;
}

// Mobile Menu Toggle
export const mobileMenu = {
    init() {
        // Create menu button and overlay if they don't exist
        if (!document.querySelector('.mobile-menu-btn')) {
            const menuBtn = document.createElement('button');
            menuBtn.className = 'mobile-menu-btn';
            menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            menuBtn.onclick = () => this.toggle();
            document.body.appendChild(menuBtn);
        }

        if (!document.querySelector('.mobile-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'mobile-overlay';
            overlay.onclick = () => this.close();
            document.body.appendChild(overlay);
        }
    },

    toggle() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        if (sidebar) {
            sidebar.classList.toggle('mobile-open');
            overlay.classList.toggle('active');
        }
    },

    close() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('active');
        }
    }
};
