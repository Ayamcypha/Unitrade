// Payment configuration
const PAYMENT_CONFIG = {
    amount: 10, // Amount in Ghana cedis
    currency: 'GHS',
    paymentMethod: 'MTN Mobile Money'
};

// Payment status tracking
let paymentStatus = {
    isPaid: false,
    transactionId: null,
    timestamp: null
};

// Initialize payment modal
function initializePayment() {
    const modal = document.getElementById('paymentModal');
    const phoneInput = document.getElementById('mobileMoneyNumber');
    
    // Format phone number as user types
    phoneInput.addEventListener('input', (e) => {
        let number = e.target.value.replace(/\D/g, '');
        if (number.startsWith('233')) {
            number = number.substring(3);
        }
        if (number.startsWith('0')) {
            number = number.substring(1);
        }
        // Format for MTN Ghana numbers
        if (number.length > 0) {
            number = '+233' + number;
        }
        e.target.value = number;
    });
}

// Validate MTN number
function validateMTNNumber(number) {
    // Remove any non-digit characters
    const cleanNumber = number.replace(/\D/g, '');
    
    // Check if it's a valid MTN Ghana number
    const mtnPrefixes = ['23324', '23354', '23355', '23359'];
    return mtnPrefixes.some(prefix => cleanNumber.startsWith(prefix)) && cleanNumber.length === 12;
}

// Process payment
async function processPayment(phoneNumber) {
    try {
        showLoadingState();
        
        // In a real implementation, you would:
        // 1. Call your backend API to initiate MTN MoMo payment
        // 2. Handle the payment response
        // 3. Verify the transaction
        
        // Simulated API call
        const response = await simulatePaymentAPI(phoneNumber);
        
        if (response.success) {
            paymentStatus = {
                isPaid: true,
                transactionId: response.transactionId,
                timestamp: new Date().toISOString()
            };
            showSuccessMessage('Payment successful! Your ad will be posted shortly.');
            closePaymentModal();
            return true;
        } else {
            showErrorMessage(response.message || 'Payment failed. Please try again.');
            return false;
        }
    } catch (error) {
        console.error('Payment error:', error);
        showErrorMessage('An error occurred. Please try again.');
        return false;
    } finally {
        hideLoadingState();
    }
}

// Simulate payment API call (replace with actual MTN MoMo API integration)
function simulatePaymentAPI(phoneNumber) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate successful payment
            resolve({
                success: true,
                transactionId: 'MOMO' + Date.now(),
                message: 'Payment processed successfully'
            });
        }, 2000);
    });
}

// UI Helper functions
function showLoadingState() {
    document.getElementById('paymentSubmitBtn').disabled = true;
    document.getElementById('paymentSpinner').style.display = 'inline-block';
}

function hideLoadingState() {
    document.getElementById('paymentSubmitBtn').disabled = false;
    document.getElementById('paymentSpinner').style.display = 'none';
}

function showSuccessMessage(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show success';
    setTimeout(() => toast.className = 'toast', 3000);
}

function showErrorMessage(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show error';
    setTimeout(() => toast.className = 'toast', 3000);
}

function openPaymentModal() {
    document.getElementById('paymentModal').style.display = 'flex';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

// Export payment status for other modules
function getPaymentStatus() {
    return paymentStatus;
}

// Reset payment status
function resetPaymentStatus() {
    paymentStatus = {
        isPaid: false,
        transactionId: null,
        timestamp: null
    };
}
