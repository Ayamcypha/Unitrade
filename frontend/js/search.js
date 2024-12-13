// Search page functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
});

// Mock data for testing
const mockListings = [
    {
        id: 1,
        title: "Calculus Textbook",
        price: 150,
        category: "textbooks",
        condition: "good",
        description: "Calculus: Early Transcendentals 8th Edition",
        image: "../assets/images/calculus-book.jpg",
        location: "Science Building",
        seller: {
            name: "John Doe",
            rating: 4.5,
            joinDate: "2023"
        },
        datePosted: "2024-01-15"
    },
    {
        id: 2,
        title: "HP Laptop",
        price: 1200,
        category: "electronics",
        condition: "like-new",
        description: "HP Pavilion 15, 16GB RAM, 512GB SSD",
        image: "../assets/images/laptop.jpg",
        location: "Engineering Block",
        seller: {
            name: "Jane Smith",
            rating: 4.8,
            joinDate: "2022"
        },
        datePosted: "2024-01-14"
    },
    // Add more mock listings as needed
];

// State management
let currentState = {
    search: "",
    filters: {
        categories: [],
        minPrice: null,
        maxPrice: null,
        condition: []
    },
    sort: "relevance",
    page: 1,
    itemsPerPage: 12
};

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsGrid = document.getElementById("resultsGrid");
const resultCount = document.getElementById("resultCount");
const sortSelect = document.getElementById("sortSelect");
const loadingSpinner = document.getElementById("loadingSpinner");
const noResults = document.getElementById("noResults");
const categoryCheckboxes = document.querySelectorAll('input[type="checkbox"][value]');
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");
const applyFiltersBtn = document.getElementById("applyFilters");
const clearFiltersBtn = document.getElementById("clearFilters");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageNumbers = document.getElementById("pageNumbers");

// Event Listeners
searchInput.addEventListener("input", debounce(handleSearch, 500));
searchBtn.addEventListener("click", handleSearch);
sortSelect.addEventListener("change", handleSort);
applyFiltersBtn.addEventListener("click", applyFilters);
clearFiltersBtn.addEventListener("click", clearFilters);
prevPageBtn.addEventListener("click", () => changePage(currentState.page - 1));
nextPageBtn.addEventListener("click", () => changePage(currentState.page + 1));

// Initialize from URL params
initializeFromURL();

// Functions
function initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get("q");
    if (searchQuery) {
        searchInput.value = searchQuery;
        currentState.search = searchQuery;
        handleSearch();
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleSearch() {
    currentState.search = searchInput.value.trim();
    currentState.page = 1;
    updateResults();
}

function handleSort() {
    currentState.sort = sortSelect.value;
    updateResults();
}

function applyFilters() {
    currentState.filters.categories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    currentState.filters.minPrice = minPriceInput.value ? parseFloat(minPriceInput.value) : null;
    currentState.filters.maxPrice = maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;
    
    currentState.page = 1;
    updateResults();
}

function clearFilters() {
    categoryCheckboxes.forEach(cb => cb.checked = false);
    minPriceInput.value = "";
    maxPriceInput.value = "";
    currentState.filters = {
        categories: [],
        minPrice: null,
        maxPrice: null,
        condition: []
    };
    updateResults();
}

function filterListings(listings) {
    return listings.filter(listing => {
        const matchesSearch = !currentState.search || 
            listing.title.toLowerCase().includes(currentState.search.toLowerCase()) ||
            listing.description.toLowerCase().includes(currentState.search.toLowerCase());

        const matchesCategory = currentState.filters.categories.length === 0 || 
            currentState.filters.categories.includes(listing.category);

        const matchesPrice = (!currentState.filters.minPrice || listing.price >= currentState.filters.minPrice) &&
            (!currentState.filters.maxPrice || listing.price <= currentState.filters.maxPrice);

        return matchesSearch && matchesCategory && matchesPrice;
    });
}

function sortListings(listings) {
    const sortedListings = [...listings];
    switch (currentState.sort) {
        case "price-low":
            return sortedListings.sort((a, b) => a.price - b.price);
        case "price-high":
            return sortedListings.sort((a, b) => b.price - a.price);
        case "newest":
            return sortedListings.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
        default: // relevance
            return sortedListings;
    }
}

function updateResults() {
    showLoading(true);

    // Simulate API call
    setTimeout(() => {
        let filteredListings = filterListings(mockListings);
        filteredListings = sortListings(filteredListings);

        const totalResults = filteredListings.length;
        const totalPages = Math.ceil(totalResults / currentState.itemsPerPage);
        const start = (currentState.page - 1) * currentState.itemsPerPage;
        const end = start + currentState.itemsPerPage;
        const paginatedListings = filteredListings.slice(start, end);

        updateResultCount(totalResults);
        updatePagination(totalPages);
        renderListings(paginatedListings);
        showLoading(false);
    }, 500);
}

function renderListings(listings) {
    if (listings.length === 0) {
        showNoResults(true);
        return;
    }

    showNoResults(false);
    resultsGrid.innerHTML = listings.map(listing => `
        <div class="listing-card">
            <img src="${listing.image}" alt="${listing.title}" class="listing-image">
            <div class="listing-details">
                <h3 class="listing-title">${listing.title}</h3>
                <p class="listing-price">GH₵ ${listing.price.toFixed(2)}</p>
                <p class="listing-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${listing.location}
                </p>
                <div class="listing-seller">
                    <span class="seller-name">${listing.seller.name}</span>
                    <span class="seller-rating">
                        <i class="fas fa-star"></i>
                        ${listing.seller.rating}
                    </span>
                </div>
                <button class="view-details-btn" onclick="window.location.href='/pages/listing.html?id=${listing.id}'">
                    View Details
                </button>
            </div>
        </div>
    `).join("");
}

function updateResultCount(count) {
    resultCount.textContent = count;
}

function updatePagination(totalPages) {
    prevPageBtn.disabled = currentState.page === 1;
    nextPageBtn.disabled = currentState.page === totalPages;

    // Update page numbers
    pageNumbers.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.classList.toggle("active", i === currentState.page);
        button.addEventListener("click", () => changePage(i));
        pageNumbers.appendChild(button);
    }
}

function changePage(page) {
    currentState.page = page;
    updateResults();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showLoading(show) {
    loadingSpinner.classList.toggle("hidden", !show);
    resultsGrid.classList.toggle("hidden", show);
}

function showNoResults(show) {
    noResults.classList.toggle("hidden", !show);
    resultsGrid.classList.toggle("hidden", show);
}

function initializeSearch() {
    // Initialize event listeners
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    document.getElementById('sortBy').addEventListener('change', sortResults);
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
        document.getElementById('searchInput').value = query;
        performSearch();
    }
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    // Update URL without reloading
    const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // Show loading state
    document.getElementById('resultsGrid').innerHTML = '<div class="loading">Searching...</div>';

    try {
        // TODO: Replace with actual API call
        const mockResults = await getMockSearchResults(query);
        currentSearchResults = mockResults;
        currentPage = 1;
        applyFilters();
    } catch (error) {
        console.error('Search failed:', error);
        document.getElementById('resultsGrid').innerHTML = 
            '<div class="error">An error occurred while searching. Please try again.</div>';
    }
}

function applyFilters() {
    // Gather filter values
    activeFilters.categories = Array.from(document.querySelectorAll('.filter-options input[type="checkbox"]:checked'))
        .filter(cb => cb.closest('.filter-section').querySelector('h4').textContent === 'Category')
        .map(cb => cb.value);

    activeFilters.conditions = Array.from(document.querySelectorAll('.filter-options input[type="checkbox"]:checked'))
        .filter(cb => cb.closest('.filter-section').querySelector('h4').textContent === 'Condition')
        .map(cb => cb.value);

    activeFilters.minPrice = document.getElementById('minPrice').value ? 
        parseFloat(document.getElementById('minPrice').value) : null;
    activeFilters.maxPrice = document.getElementById('maxPrice').value ? 
        parseFloat(document.getElementById('maxPrice').value) : null;

    // Filter results
    let filteredResults = currentSearchResults.filter(item => {
        const categoryMatch = activeFilters.categories.length === 0 || 
            activeFilters.categories.includes(item.category.toLowerCase());
        const conditionMatch = activeFilters.conditions.length === 0 || 
            activeFilters.conditions.includes(item.condition.toLowerCase());
        const priceMatch = (!activeFilters.minPrice || item.price >= activeFilters.minPrice) && 
            (!activeFilters.maxPrice || item.price <= activeFilters.maxPrice);

        return categoryMatch && conditionMatch && priceMatch;
    });

    // Apply current sort
    const sortBy = document.getElementById('sortBy').value;
    sortResults(filteredResults, sortBy);

    // Update display
    updateResultsDisplay(filteredResults);
}

function clearFilters() {
    // Clear checkboxes
    document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Clear price inputs
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    
    // Reset sort
    document.getElementById('sortBy').value = 'relevance';
    
    // Clear active filters
    activeFilters = {
        categories: [],
        minPrice: null,
        maxPrice: null,
        conditions: []
    };
    
    // Update display with all results
    updateResultsDisplay(currentSearchResults);
}

function sortResults(results = currentSearchResults, sortBy = document.getElementById('sortBy').value) {
    let sortedResults = [...results];
    
    switch (sortBy) {
        case 'priceLow':
            sortedResults.sort((a, b) => a.price - b.price);
            break;
        case 'priceHigh':
            sortedResults.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            sortedResults.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
            break;
        // 'relevance' is default, no sorting needed
    }
    
    updateResultsDisplay(sortedResults);
}

function updateResultsDisplay(results) {
    const resultsGrid = document.getElementById('resultsGrid');
    const noResults = document.getElementById('noResults');
    const totalPages = Math.ceil(results.length / itemsPerPage);
    
    if (results.length === 0) {
        resultsGrid.innerHTML = '';
        noResults.classList.remove('hidden');
        updatePagination(0);
        return;
    }
    
    noResults.classList.add('hidden');
    
    // Calculate page slice
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageResults = results.slice(start, end);
    
    // Generate results HTML
    resultsGrid.innerHTML = pageResults.map(item => `
        <div class="result-card" onclick="window.location.href='listing.html?id=${item.id}'">
            <img src="${item.image}" alt="${item.title}" class="result-image">
            <div class="result-details">
                <div class="result-title">${item.title}</div>
                <div class="result-price">${formatCurrency(item.price)}</div>
                <div class="result-location">
                    <i class="fas fa-map-marker-alt"></i> ${item.location}
                </div>
            </div>
        </div>
    `).join('');
    
    updatePagination(totalPages);
}

function updatePagination(totalPages) {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const currentPageSpan = document.getElementById('currentPage');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    currentPageSpan.textContent = totalPages > 0 ? 
        `Page ${currentPage} of ${totalPages}` : 'No results';
}

function changePage(delta) {
    currentPage += delta;
    applyFilters();
}

// Mock data function - Replace with actual API call
async function getMockSearchResults(query) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
        {
            id: 1,
            title: 'Calculus Textbook',
            price: 45.99,
            location: 'Main Campus',
            category: 'textbooks',
            condition: 'good',
            image: '../images/placeholder.jpg',
            datePosted: '2023-09-15'
        },
        {
            id: 2,
            title: 'MacBook Pro 2019',
            price: 899.99,
            location: 'Student Center',
            category: 'electronics',
            condition: 'likeNew',
            image: '../images/placeholder.jpg',
            datePosted: '2023-09-14'
        },
        // Add more mock items as needed
    ];
}
