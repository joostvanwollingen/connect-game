const Toast = {
    show(message, type = 'info', duration = 2400) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`.trim();
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            setTimeout(() => {
                toast.remove();
            }, 200);
        }, duration);
    }
};
