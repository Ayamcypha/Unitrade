// Listing page functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeListing();
    initializeSaveButton();
});

function initializeListing() {
    // Fetch listing details from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');
    
    if (listingId) {
        fetchListingDetails(listingId);
    } else {
        showError('Listing ID not found');
    }
}

function fetchListingDetails(listingId) {
    // TODO: Replace with actual API call
    const mockListing = {
        id: listingId,
        title: 'Sample Textbook',
        description: 'Like new condition, perfect for first-year students',
        price: 45.99,
        condition: 'Like New',
        category: 'Textbooks',
        location: 'Main Campus',
        seller: {
            id: 'user123',
            name: 'John Doe',
            rating: 4.5,
            joinDate: '2023-01-15'
        },
        images: [
            '/images/placeholder.jpg',
            '/images/placeholder2.jpg'
        ],
        datePosted: '2023-09-15'
    };
    
    renderListingDetails(mockListing);
}

function renderListingDetails(listing) {
    document.getElementById('listingTitle').textContent = listing.title;
    document.getElementById('listingPrice').textContent = formatCurrency(listing.price);
    document.getElementById('listingDescription').textContent = listing.description;
    document.getElementById('listingCondition').textContent = listing.condition;
    document.getElementById('listingCategory').textContent = listing.category;
    document.getElementById('listingLocation').textContent = listing.location;
    
    // Render seller info
    document.getElementById('sellerName').textContent = listing.seller.name;
    document.getElementById('sellerRating').textContent = `${listing.seller.rating}/5.0`;
    document.getElementById('sellerJoinDate').textContent = `Member since ${new Date(listing.seller.joinDate).toLocaleDateString()}`;
    
    // Render images
    const imageGallery = document.getElementById('imageGallery');
    imageGallery.innerHTML = '';
    listing.images.forEach(imageSrc => {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = listing.title;
        imageGallery.appendChild(img);
    });
    
    // Initialize contact buttons
    document.getElementById('chatButton').onclick = () => startChat(listing.seller.id);
    document.getElementById('offerButton').onclick = () => makeOffer(listing.id);
}

function startChat(sellerId) {
    // TODO: Implement chat functionality
    console.log(`Starting chat with seller ${sellerId}`);
}

function makeOffer(listingId) {
    // TODO: Implement offer functionality
    console.log(`Making offer for listing ${listingId}`);
}

function initializeSaveButton() {
    const saveButton = document.getElementById('saveButton');
    if (!saveButton) return;

    // Check if item is already saved
    const listingId = new URLSearchParams(window.location.search).get('id');
    const isSaved = checkIfSaved(listingId);
    updateSaveButtonState(saveButton, isSaved);

    saveButton.addEventListener('click', () => toggleSaveItem(listingId, saveButton));
}

function checkIfSaved(listingId) {
    const savedItems = getSavedItems();
    return savedItems.includes(listingId);
}

function getSavedItems() {
    const savedItems = localStorage.getItem('savedItems');
    return savedItems ? JSON.parse(savedItems) : [];
}

function toggleSaveItem(listingId, button) {
    if (!isLoggedIn()) {
        showToast('Please log in to save items');
        return;
    }

    const savedItems = getSavedItems();
    const isSaved = savedItems.includes(listingId);

    if (isSaved) {
        // Remove from saved items
        const index = savedItems.indexOf(listingId);
        savedItems.splice(index, 1);
        showToast('Item removed from saved items');
    } else {
        // Add to saved items
        savedItems.push(listingId);
        showToast('Item saved successfully');
    }

    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    updateSaveButtonState(button, !isSaved);
}

function updateSaveButtonState(button, isSaved) {
    const icon = button.querySelector('i');
    const text = button.querySelector('span');

    if (isSaved) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        text.textContent = 'Saved';
        button.classList.add('saved');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        text.textContent = 'Save';
        button.classList.remove('saved');
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function isLoggedIn() {
    // TODO: Replace with actual auth check
    return localStorage.getItem('authToken') !== null;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.insertBefore(errorDiv, document.body.firstChild);
}
