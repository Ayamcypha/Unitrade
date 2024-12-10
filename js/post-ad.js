// Global variables to store uploaded images
let uploadedImages = [];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

// Handle character count for description
document.addEventListener('DOMContentLoaded', function() {
    const description = document.getElementById('description');
    const charCount = document.querySelector('.char-count');
    
    if (description && charCount) {
        description.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = `${count}/1000`;
            
            if (count > 900) {
                charCount.style.color = '#dc3545';
            } else {
                charCount.style.color = '#6c757d';
            }
        });
    }
});

function handleImageUpload(input, index) {
    const file = input.files[0];
    if (!file) return;

    // Check file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        input.value = '';
        return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload only image files');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = input.parentElement.querySelector('.preview');
        const icon = preview.querySelector('i');
        const text = preview.querySelector('span');
        
        preview.style.backgroundImage = `url(${e.target.result})`;
        if (icon) icon.style.display = 'none';
        if (text) text.style.display = 'none';
        
        uploadedImages[index] = {
            file: file,
            dataUrl: e.target.result
        };
    };
    
    reader.readAsDataURL(file);
}

// Handle image upload and preview
function handleImageUpload(input, index) {
    const file = input.files[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        showToast('Image size should be less than 2MB', 'error');
        input.value = '';
        return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
        showToast('Please upload only image files', 'error');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = input.parentElement.querySelector('.preview');
        const icon = input.parentElement.querySelector('i');
        
        preview.style.backgroundImage = `url(${e.target.result})`;
        icon.style.display = 'none';
        
        // Store the image data
        uploadedImages[index] = {
            file: file,
            dataUrl: e.target.result
        };
    };
    
    reader.readAsDataURL(file);
}

// Handle form submission
async function handlePostAd(event) {
    event.preventDefault();
    
    // Check authentication
    if (!isAuthenticated()) {
        showToast('Please login to post an advertisement', 'error');
        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 2000);
        return false;
    }
    
    // Validate form
    const form = event.target;
    if (!validateForm(form)) {
        showToast('Please fill in all required fields', 'error');
        return false;
    }
    
    // Check if at least one image is uploaded
    if (uploadedImages.length === 0) {
        showToast('Please upload at least one image', 'error');
        return false;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
        // First, handle the payment
        const paymentResult = await processPayment();
        if (!paymentResult.success) {
            throw new Error('Payment failed');
        }

        // Then, upload images
        const imageUrls = await uploadImages(uploadedImages);

        // Finally, create the advertisement
        const adData = {
            title: form.title.value,
            category: form.category.value,
            price: parseFloat(form.price.value),
            description: form.description.value,
            location: form.location.value,
            images: imageUrls,
            paymentId: paymentResult.paymentId
        };

        // Submit to backend
        const response = await fetch('/api/advertisements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(adData)
        });

        if (!response.ok) {
            throw new Error('Failed to create advertisement');
        }

        // Show success message and redirect
        showToast('Advertisement posted successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/pages/my-ads.html';
        }, 2000);

    } catch (error) {
        console.error('Error posting advertisement:', error);
        showToast(error.message || 'Failed to post advertisement', 'error');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }

    return false;
}

// Process payment for posting advertisement
async function processPayment() {
    try {
        // TODO: Implement actual payment processing
        // This is a placeholder for payment processing logic
        const response = await fetch('/api/payments/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                amount: 5.00,
                currency: 'GBP',
                type: 'advertisement_fee'
            })
        });

        const data = await response.json();
        return {
            success: true,
            paymentId: data.paymentId
        };
    } catch (error) {
        console.error('Payment processing error:', error);
        throw new Error('Payment processing failed');
    }
}

// Upload images to server
async function uploadImages(images) {
    const uploadedUrls = [];
    
    for (let imageData of images) {
        if (!imageData) continue;

        const formData = new FormData();
        formData.append('image', imageData.file);

        try {
            const response = await fetch('/api/uploads/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const data = await response.json();
            uploadedUrls.push(data.imageUrl);
        } catch (error) {
            console.error('Image upload error:', error);
            throw new Error('Failed to upload images');
        }
    }

    return uploadedUrls;
}

// Validate form data
function validateForm(form) {
    const requiredFields = ['title', 'category', 'price', 'description', 'location'];
    let isValid = true;

    requiredFields.forEach(field => {
        const input = form[field];
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}
