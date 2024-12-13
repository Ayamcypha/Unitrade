// Global variables
let currentPage = 1;
let isLoading = false;
let hasMoreListings = true;
let currentFilters = {
    search: '',
    category: '',
    priceRange: '',
    sort: 'newest'
};

// Initialize WebSocket connection for real-time chat
let chatSocket = null;
let currentChatSeller = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize listings
    loadListings();
    
    // Add event listeners for filters
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 500));
    document.getElementById('categoryFilter').addEventListener('change', handleFilters);
    document.getElementById('priceFilter').addEventListener('change', handleFilters);
    document.getElementById('sortFilter').addEventListener('change', handleFilters);
    
    // Load more button
    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreListings);
    
    // Infinite scroll
    window.addEventListener('scroll', handleScroll);
    
    // Chat functionality
    initializeChat();
});

// Debounce function for search input
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

// Handle search input
function handleSearch(event) {
    currentFilters.search = event.target.value;
    resetListings();
}

// Handle filter changes
function handleFilters(event) {
    const { id, value } = event.target;
    switch(id) {
        case 'categoryFilter':
            currentFilters.category = value;
            break;
        case 'priceFilter':
            currentFilters.priceRange = value;
            break;
        case 'sortFilter':
            currentFilters.sort = value;
            break;
    }
    resetListings();
}

// Reset listings when filters change
function resetListings() {
    currentPage = 1;
    hasMoreListings = true;
    const listingsGrid = document.getElementById('listingsGrid');
    listingsGrid.innerHTML = '';
    loadListings();
}

// Load listings from API
async function loadListings() {
    if (isLoading || !hasMoreListings) return;
    
    isLoading = true;
    showLoadingSpinner();
    
    try {
        // TODO: Replace with your actual API endpoint
        const response = await fetch(`/api/listings?page=${currentPage}&${new URLSearchParams(currentFilters)}`);
        const data = await response.json();
        
        if (data.listings.length === 0) {
            hasMoreListings = false;
            hideLoadMoreButton();
        } else {
            renderListings(data.listings);
            currentPage++;
        }
    } catch (error) {
        console.error('Error loading listings:', error);
        showToast('Failed to load listings', 'error');
    } finally {
        isLoading = false;
        hideLoadingSpinner();
    }
}

// Render listings to the grid
function renderListings(listings) {
    const listingsGrid = document.getElementById('listingsGrid');
    
    listings.forEach(listing => {
        const listingCard = document.createElement('div');
        listingCard.className = 'listing-card';
        listingCard.innerHTML = `
            <a href="listing.html?id=${listing.id}" class="listing-link">
                <div class="listing-image">
                    <img src="${listing.images[0]}" alt="${listing.title}">
                </div>
                <div class="listing-details">
                    <h3>${listing.title}</h3>
                    <p class="price">${formatCurrency(listing.price)}</p>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${listing.location}</p>
                </div>
            </a>
            <button class="chat-btn" onclick="openChat('${listing.sellerId}', '${listing.title}')">
                <i class="fas fa-comment"></i> Chat with Seller
            </button>
        `;
        listingsGrid.appendChild(listingCard);
    });
}

// Handle infinite scroll
function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        loadMoreListings();
    }
}

// Load more listings button handler
function loadMoreListings() {
    loadListings();
}

// Show/hide loading spinner
function showLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

// Show/hide load more button
function hideLoadMoreButton() {
    document.getElementById('loadMoreBtn').style.display = 'none';
}

// Initialize real-time chat
function initializeChat() {
    // TODO: Replace with your actual WebSocket endpoint
    chatSocket = new WebSocket('ws://your-websocket-endpoint');
    
    chatSocket.onmessage = function(event) {
        const message = JSON.parse(event.data);
        appendMessage(message);
    };
    
    chatSocket.onerror = function(error) {
        console.error('WebSocket error:', error);
        showToast('Chat connection error', 'error');
    };
    
    // Chat input handler
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.querySelector('.send-btn');
    
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Close chat button
    document.querySelector('.close-chat').addEventListener('click', closeChat);
}

// Open chat with seller
function openChat(sellerId, itemTitle) {
    if (!isAuthenticated()) {
        showToast('Please login to chat with sellers', 'error');
        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 2000);
        return;
    }
    
    currentChatSeller = sellerId;
    document.querySelector('.chat-header h3').textContent = `Chat about: ${itemTitle}`;
    document.getElementById('chatModal').style.display = 'block';
    
    // Load previous messages
    loadChatHistory(sellerId);
}

// Load chat history
async function loadChatHistory(sellerId) {
    try {
        // TODO: Replace with your actual API endpoint
        const response = await fetch(`/api/chat/history/${sellerId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        const messages = await response.json();
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        
        messages.forEach(message => {
            appendMessage(message);
        });
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Error loading chat history:', error);
        showToast('Failed to load chat history', 'error');
    }
}

// Send chat message
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    const messageData = {
        type: 'message',
        recipient: currentChatSeller,
        content: message,
        timestamp: new Date().toISOString()
    };
    
    chatSocket.send(JSON.stringify(messageData));
    messageInput.value = '';
    
    // Optimistically append message
    appendMessage({
        ...messageData,
        sender: 'me'
    });
}

// Append message to chat
function appendMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender === 'me' ? 'sent' : 'received'}`;
    messageDiv.textContent = message.content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Close chat modal
function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
    currentChatSeller = null;
}
