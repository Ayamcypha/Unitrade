// API endpoints
const API_ENDPOINTS = {
    profile: '/api/profile',
    updateProfile: '/api/profile/update',
    updatePassword: '/api/profile/password',
    updateNotifications: '/api/profile/notifications',
    uploadPicture: '/api/profile/picture'
};

let cropper = null;

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const profileAvatar = document.getElementById('profileAvatar');
const avatarInput = document.getElementById('avatarInput');
const settingsForm = document.getElementById('settingsForm');
const toast = document.getElementById('toast');

// Mock user data - In real app, this would come from an API
let currentUser = {
    name: 'John Doe',
    email: 'john.doe@ug.edu.gh',
    university: 'ug',
    phone: '+233 20 123 4567',
    bio: 'Computer Science student at UG. Passionate about technology and trading.',
    avatar: '../assets/default-avatar.png',
    coverImage: null
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadListings();
    loadReviews();
    loadSavedItems();
    setupEventListeners();
    initializeImageCropper();
});

// Setup Event Listeners
function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // Avatar upload
    avatarInput.addEventListener('change', handleAvatarUpload);

    // Settings form
    settingsForm.addEventListener('submit', handleSettingsSubmit);

    // Edit profile button
    document.querySelector('.edit-profile-btn').addEventListener('click', () => {
        switchTab('settings');
        document.getElementById('settingsForm').scrollIntoView({ behavior: 'smooth' });
    });
}

// Initialize image cropper
function initializeImageCropper() {
    const cropperModal = document.createElement('div');
    cropperModal.className = 'modal';
    cropperModal.id = 'cropperModal';
    cropperModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Crop Profile Picture</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="cropper-container">
                    <img id="cropperImage" src="" alt="Image to crop">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn secondary" id="cancelCrop">Cancel</button>
                <button class="btn primary" id="saveCrop">Save</button>
            </div>
        </div>
    `;
    document.body.appendChild(cropperModal);

    // Close modal functionality
    document.querySelector('.close-btn').addEventListener('click', () => {
        cropperModal.style.display = 'none';
    });

    document.getElementById('cancelCrop').addEventListener('click', () => {
        cropperModal.style.display = 'none';
    });
}

// Handle avatar upload with cropping
async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error');
        return;
    }

    try {
        const reader = new FileReader();
        reader.onload = (e) => {
            const cropperModal = document.getElementById('cropperModal');
            const cropperImage = document.getElementById('cropperImage');
            
            // Initialize cropper
            cropperImage.src = e.target.result;
            cropperModal.style.display = 'block';
            
            if (window.cropper) {
                window.cropper.destroy();
            }
            
            window.cropper = new Cropper(cropperImage, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false
            });

            // Handle save crop
            document.getElementById('saveCrop').onclick = () => {
                const canvas = window.cropper.getCroppedCanvas({
                    width: 300,
                    height: 300
                });

                canvas.toBlob(async (blob) => {
                    try {
                        // In a real app, you would upload the blob to your server here
                        const imageUrl = URL.createObjectURL(blob);
                        profileAvatar.src = imageUrl;
                        currentUser.avatar = imageUrl;
                        showToast('Profile picture updated successfully', 'success');
                    } catch (error) {
                        showToast('Error saving profile picture', 'error');
                        console.error('Error:', error);
                    }
                    cropperModal.style.display = 'none';
                    window.cropper.destroy();
                }, 'image/jpeg', 0.9);
            };
        };
        reader.readAsDataURL(file);
    } catch (error) {
        showToast('Error processing image', 'error');
        console.error('Avatar upload error:', error);
    }
}

// Handle settings form submission
async function handleSettingsSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update user data
        currentUser = {
            ...currentUser,
            name: data.fullName,
            email: data.email,
            university: data.university,
            phone: data.phone,
            bio: data.bio
        };

        // Update UI
        updateProfileUI();
        showToast('Profile updated successfully', 'success');

        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    } catch (error) {
        showToast('Error saving profile', 'error');
        console.error('Settings save error:', error);
    }
}

// Update profile UI with current user data
function updateProfileUI() {
    // Update header info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userUniversity').textContent = 
        document.getElementById('university').options[
            document.getElementById('university').selectedIndex
        ].text;
    
    // Update form fields
    document.getElementById('fullName').value = currentUser.name;
    document.getElementById('email').value = currentUser.email;
    document.getElementById('university').value = currentUser.university;
    document.getElementById('phone').value = currentUser.phone;
    document.getElementById('bio').value = currentUser.bio;

    // Update avatar
    if (currentUser.avatar) {
        profileAvatar.src = currentUser.avatar;
    }
}

// Load user data
function loadUserData() {
    updateProfileUI();
}

// Switch tabs
function switchTab(tabId) {
    // Update buttons
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update content
    tabPanes.forEach(pane => {
        pane.classList.toggle('active', pane.id === tabId);
    });
}

// Show toast message
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Load mock data functions
function loadListings() {
    const mockListings = [
        {
            id: 1,
            title: 'MacBook Pro 2021',
            price: 'GH₵ 12,000',
            image: '../assets/laptop.jpg',
            status: 'active'
        },
        {
            id: 2,
            title: 'iPhone 13 Pro',
            price: 'GH₵ 8,000',
            image: '../assets/phone.jpg',
            status: 'sold'
        }
    ];

    const listingsGrid = document.getElementById('listingsGrid');
    listingsGrid.innerHTML = mockListings.map(listing => `
        <div class="listing-card">
            <div class="listing-image">
                <img src="${listing.image}" alt="${listing.title}">
            </div>
            <div class="listing-details">
                <h3>${listing.title}</h3>
                <p class="listing-price">${listing.price}</p>
                <span class="listing-status status-${listing.status}">
                    ${listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
            </div>
        </div>
    `).join('');
}

function loadReviews() {
    const mockReviews = [
        {
            id: 1,
            reviewer: 'Jane Smith',
            avatar: '../assets/avatar1.jpg',
            rating: 5,
            date: '2024-03-10',
            content: 'Great seller! Item was exactly as described and delivery was prompt.'
        },
        {
            id: 2,
            reviewer: 'Mike Johnson',
            avatar: '../assets/avatar2.jpg',
            rating: 4,
            date: '2024-03-08',
            content: 'Good communication and fair price. Would buy from again.'
        }
    ];

    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = mockReviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="reviewer-avatar">
                    <img src="${review.avatar}" alt="${review.reviewer}">
                </div>
                <div class="reviewer-info">
                    <h4>${review.reviewer}</h4>
                    <div class="review-rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}
                    </div>
                </div>
            </div>
            <p class="review-content">${review.content}</p>
        </div>
    `).join('');
}

function loadSavedItems() {
    const mockSavedItems = [
        {
            id: 1,
            title: 'MacBook Pro 2021',
            price: 'GH₵ 12,000',
            image: '../assets/laptop.jpg'
        },
        {
            id: 2,
            title: 'iPhone 13 Pro',
            price: 'GH₵ 8,000',
            image: '../assets/phone.jpg'
        }
    ];

    const savedItemsGrid = document.getElementById('savedItemsGrid');
    savedItemsGrid.innerHTML = mockSavedItems.map(item => `
        <div class="listing-card">
            <div class="listing-image">
                <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="listing-details">
                <h3>${item.title}</h3>
                <p class="listing-price">${item.price}</p>
            </div>
        </div>
    `).join('');
}
