// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navLinks.contains(event.target) && !menuToggle.contains(event.target)) {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // Sample recent listings data
    const sampleListings = [
        {
            title: 'Engineering Textbook',
            price: '$45',
            image: 'assets/sample1.jpg',
            location: 'North Campus'
        },
        {
            title: 'Study Desk',
            price: '$80',
            image: 'assets/sample2.jpg',
            location: 'South Campus'
        },
        {
            title: 'Scientific Calculator',
            price: '$25',
            image: 'assets/sample3.jpg',
            location: 'West Campus'
        },
        {
            title: 'Laptop Stand',
            price: '$15',
            image: 'assets/sample4.jpg',
            location: 'East Campus'
        }
    ];

    // Populate recent listings
    const listingsGrid = document.getElementById('recentListings');
    if (listingsGrid) {
        sampleListings.forEach(listing => {
            const listingCard = document.createElement('div');
            listingCard.className = 'listing-card';
            listingCard.innerHTML = `
                <div class="listing-image">
                    <img src="${listing.image}" alt="${listing.title}">
                </div>
                <div class="listing-details">
                    <h3>${listing.title}</h3>
                    <p class="price">${listing.price}</p>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${listing.location}</p>
                </div>
            `;
            listingsGrid.appendChild(listingCard);
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-container input');
    const searchBtn = document.querySelector('.search-btn');

    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // TODO: Implement search functionality
                console.log('Searching for:', searchTerm);
                // This will be connected to the backend search API
            }
        });
    }

    // Category card click handlers
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.querySelector('h3').textContent;
            // TODO: Implement category filtering
            console.log('Selected category:', category);
            // This will redirect to the browse page with the selected category
        });
    });
});

// Handle image upload preview
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const preview = document.querySelector('.image-preview');
            if (preview) {
                preview.style.backgroundImage = `url(${e.target.result})`;
                preview.style.display = 'block';
            }
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;

    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
