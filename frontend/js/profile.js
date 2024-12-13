// API endpoints
const API_ENDPOINTS = {
    profile: '/api/profile',
    updateProfile: '/api/profile/update',
    updatePassword: '/api/profile/password',
    updateNotifications: '/api/profile/notifications',
    uploadPicture: '/api/profile/picture',
    listings: '/api/listings',
    reviews: '/api/reviews',
    savedItems: '/api/saved-items'
};

let cropper = null;
let currentUser = null;

// DOM Elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const profileAvatar = document.getElementById('profileAvatar');
const avatarInput = document.getElementById('avatarInput');
const settingsForm = document.getElementById('settingsForm');
const toast = document.getElementById('toast');

// Initialize on document load
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserData();
    setupEventListeners();
    initializeImageCropper();
    await Promise.all([
        loadListings(),
        loadReviews(),
        loadSavedItems()
    ]);
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

    // Edit Profile Button
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openEditProfile);
    }

    // Settings Form
    const settingsForm = document.querySelector('.settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSaveProfile);
        
        const cancelBtn = settingsForm.querySelector('.btn.secondary');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleCancelEdit();
            });
        }
    }
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
    if (!currentUser) return;

    // Update header info
    const userName = document.getElementById('userName');
    const userUniversity = document.getElementById('userUniversity');
    const universitySelect = document.getElementById('profileUniversity');

    if (userName) userName.textContent = currentUser.name;
    if (userUniversity && universitySelect) {
        userUniversity.textContent = universitySelect.options[
            universitySelect.selectedIndex
        ]?.text || '';
    }
    
    // Update form fields
    const fields = {
        'profileFullName': currentUser.name,
        'profileEmail': currentUser.email,
        'profileUniversity': currentUser.university,
        'profilePhone': currentUser.phone,
        'profileBio': currentUser.bio
    };

    Object.entries(fields).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    });

    // Update avatar
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar && currentUser.avatar) {
        profileAvatar.src = currentUser.avatar;
    }
}

// Load user data
async function loadUserData() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch(API_ENDPOINTS.profile);
        // currentUser = await response.json();
        
        // For now, use minimal user data
        currentUser = {
            name: '',
            email: '',
            university: '',
            phone: '',
            bio: '',
            avatar: '../assets/default-avatar.png'
        };

        updateProfileUI();
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Failed to load user data', 'error');
    }
}

// Load listings
async function loadListings() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch(API_ENDPOINTS.listings);
        // const listings = await response.json();
        const listingsGrid = document.getElementById('listingsGrid');
        if (listingsGrid) {
            listingsGrid.innerHTML = '<p>No listings found</p>';
        }
    } catch (error) {
        console.error('Error loading listings:', error);
        showToast('Failed to load listings', 'error');
    }
}

// Load reviews
async function loadReviews() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch(API_ENDPOINTS.reviews);
        // const reviews = await response.json();
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsList) {
            reviewsList.innerHTML = '<p>No reviews yet</p>';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        showToast('Failed to load reviews', 'error');
    }
}

// Load saved items
async function loadSavedItems() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch(API_ENDPOINTS.savedItems);
        // const savedItems = await response.json();
        const savedItemsGrid = document.getElementById('savedItemsGrid');
        if (savedItemsGrid) {
            savedItemsGrid.innerHTML = '<p>No saved items</p>';
        }
    } catch (error) {
        console.error('Error loading saved items:', error);
        showToast('Failed to load saved items', 'error');
    }
}

// Edit Profile Functions
function openEditProfile() {
    // Switch to settings tab
    const settingsTab = document.querySelector('[data-tab="settings"]');
    if (settingsTab) {
        switchTab('settings');
    }

    // Enable form fields
    const formFields = document.querySelectorAll('.settings-form input, .settings-form select, .settings-form textarea');
    formFields.forEach(field => {
        field.disabled = false;
    });

    // Show action buttons
    const actionButtons = document.querySelector('.settings-action-buttons');
    if (actionButtons) {
        actionButtons.style.display = 'flex';
    }

    // Scroll to form
    const settingsForm = document.querySelector('.settings-form');
    if (settingsForm) {
        settingsForm.scrollIntoView({ behavior: 'smooth' });
    }
}

function handleCancelEdit() {
    // Reset form to original values
    const form = document.querySelector('.settings-form');
    if (form) {
        form.reset();
        populateFormWithUserData();
    }

    // Disable form fields
    const formFields = document.querySelectorAll('.settings-form input, .settings-form select, .settings-form textarea');
    formFields.forEach(field => {
        field.disabled = true;
    });

    // Hide action buttons
    const actionButtons = document.querySelector('.settings-action-buttons');
    if (actionButtons) {
        actionButtons.style.display = 'none';
    }
}

async function handleSaveProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const saveButton = form.querySelector('.btn.primary');
    if (saveButton) {
        saveButton.classList.add('loading');
        saveButton.disabled = true;
    }

    try {
        // TODO: Replace with actual API call
        // const response = await fetch(API_ENDPOINTS.updateProfile, {
        //     method: 'POST',
        //     body: formData
        // });
        // const updatedUser = await response.json();
        
        // Update currentUser data
        currentUser = {
            ...currentUser,
            name: formData.get('fullName'),
            email: formData.get('email'),
            university: formData.get('university'),
            phone: formData.get('phone'),
            bio: formData.get('bio')
        };

        // Update profile display
        updateProfileUI();
        
        showToast('Profile updated successfully!', 'success');
        handleCancelEdit();
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Failed to update profile. Please try again.', 'error');
    } finally {
        if (saveButton) {
            saveButton.classList.remove('loading');
            saveButton.disabled = false;
        }
    }
}

function populateFormWithUserData() {
    const form = document.querySelector('.settings-form');
    if (!form || !currentUser) return;

    const fields = {
        'profileFullName': currentUser.name,
        'profileEmail': currentUser.email,
        'profileUniversity': currentUser.university,
        'profilePhone': currentUser.phone,
        'profileBio': currentUser.bio
    };

    Object.entries(fields).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = value;
        }
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

// Switch tab
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
