// Currency formatting
function formatCurrency(amount) {
    return `GH₵${parseFloat(amount).toFixed(2)}`;
}

// Number formatting with suffixes (K, M)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Export functions
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
