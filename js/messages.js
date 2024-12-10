// Connect to WebSocket server
const socket = io('http://localhost:5000', {
    auth: {
        token: getToken()
    }
});

// DOM Elements
const conversationsList = document.getElementById('conversationsList');
const conversationSearch = document.getElementById('conversationSearch');
const noChatSelected = document.getElementById('noChatSelected');
const activeChat = document.getElementById('activeChat');
const chatMessages = document.getElementById('chatMessages');
const messageForm = document.getElementById('messageForm');
const messageText = document.getElementById('messageText');
const chatUserName = document.getElementById('chatUserName');
const chatUserStatus = document.getElementById('chatUserStatus');
const chatUserAvatar = document.getElementById('chatUserAvatar');
const viewListingBtn = document.getElementById('viewListingBtn');

// State
let currentConversation = null;
let conversations = [];
let messages = [];

// Socket event listeners
socket.on('connect', () => {
    console.log('Connected to chat server');
    loadConversations();
});

socket.on('disconnect', () => {
    console.log('Disconnected from chat server');
    showToast('Lost connection to chat server', 'error');
});

socket.on('message', (message) => {
    if (currentConversation && message.conversationId === currentConversation.id) {
        appendMessage(message);
        scrollToBottom();
    }
    updateConversationPreview(message);
});

socket.on('typing', ({ conversationId, user }) => {
    if (currentConversation && conversationId === currentConversation.id) {
        chatUserStatus.textContent = `${user.name} is typing...`;
        setTimeout(() => {
            chatUserStatus.textContent = 'Online';
        }, 3000);
    }
});

// Event Listeners
messageForm.addEventListener('submit', handleMessageSubmit);
conversationSearch.addEventListener('input', handleConversationSearch);
messageText.addEventListener('input', handleTyping);

// Load conversations
async function loadConversations() {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load conversations');
        
        conversations = await response.json();
        renderConversations(conversations);
    } catch (error) {
        console.error('Error loading conversations:', error);
        showToast('Failed to load conversations', 'error');
    }
}

// Render conversations list
function renderConversations(conversations) {
    conversationsList.innerHTML = '';
    
    conversations.forEach(conversation => {
        const div = document.createElement('div');
        div.className = `conversation-item${currentConversation?.id === conversation.id ? ' active' : ''}`;
        div.onclick = () => selectConversation(conversation);
        
        div.innerHTML = `
            <img src="${conversation.otherUser.avatar || '../images/default-avatar.png'}" 
                 alt="${conversation.otherUser.name}" 
                 class="conversation-avatar">
            <div class="conversation-info">
                <div class="conversation-header">
                    <span class="conversation-name">${conversation.otherUser.name}</span>
                    <span class="conversation-time">${formatTime(conversation.lastMessage?.timestamp)}</span>
                </div>
                <div class="conversation-preview">
                    ${conversation.lastMessage?.content || 'No messages yet'}
                    ${conversation.unreadCount ? `<span class="conversation-badge">${conversation.unreadCount}</span>` : ''}
                </div>
            </div>
        `;
        
        conversationsList.appendChild(div);
    });
}

// Select conversation
async function selectConversation(conversation) {
    currentConversation = conversation;
    noChatSelected.classList.add('hidden');
    activeChat.classList.remove('hidden');
    
    // Update chat header
    chatUserName.textContent = conversation.otherUser.name;
    chatUserStatus.textContent = conversation.otherUser.isOnline ? 'Online' : 'Offline';
    chatUserAvatar.src = conversation.otherUser.avatar || '../assets/default-avatar.png';
    
    // Set up view listing button
    if (conversation.listingId) {
        viewListingBtn.style.display = 'flex';
        viewListingBtn.onclick = () => {
            window.location.href = `listing.html?id=${conversation.listingId}`;
        };
    } else {
        viewListingBtn.style.display = 'none';
    }

    // Load and render messages
    loadMessages(conversation.id);
    scrollToBottom();
}

// Load messages
async function loadMessages(conversationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load messages');
        
        messages = await response.json();
        renderMessages(messages);
        
        // Mark conversation as read
        if (currentConversation.unreadCount > 0) {
            await fetch(`${API_BASE_URL}/conversations/${conversationId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });
        }
    } catch (error) {
        console.error('Error loading messages:', error);
        showToast('Failed to load messages', 'error');
    }
}

// Render messages
function renderMessages(messages) {
    chatMessages.innerHTML = '';
    
    messages.forEach(message => {
        appendMessage(message);
    });
}

// Append a single message
function appendMessage(message) {
    const div = document.createElement('div');
    div.className = `message${message.senderId === getUserId() ? ' sent' : ''}`;
    
    div.innerHTML = `
        <img src="${message.sender.avatar || '../images/default-avatar.png'}" 
             alt="${message.sender.name}" 
             class="message-avatar">
        <div class="message-bubble">
            <div class="message-content">${message.content}</div>
            <div class="message-time">${formatTime(message.timestamp)}</div>
        </div>
    `;
    
    chatMessages.appendChild(div);
}

// Handle message submission
async function handleMessageSubmit(event) {
    event.preventDefault();
    
    const content = messageText.value.trim();
    if (!content || !currentConversation) return;
    
    messageText.value = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/conversations/${currentConversation.id}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        
        const message = await response.json();
        appendMessage(message);
        scrollToBottom();
        updateConversationPreview(message);
    } catch (error) {
        console.error('Error sending message:', error);
        showToast('Failed to send message', 'error');
    }
}

// Handle conversation search
function handleConversationSearch(event) {
    const query = event.target.value.toLowerCase();
    const filtered = conversations.filter(conversation => 
        conversation.otherUser.name.toLowerCase().includes(query)
    );
    renderConversations(filtered);
}

// Handle typing indicator
let typingTimeout;
function handleTyping() {
    if (!currentConversation) return;
    
    socket.emit('typing', { conversationId: currentConversation.id });
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stopTyping', { conversationId: currentConversation.id });
    }, 3000);
}

// Update conversation preview
function updateConversationPreview(message) {
    const conversation = conversations.find(c => c.id === message.conversationId);
    if (!conversation) return;
    
    conversation.lastMessage = message;
    if (currentConversation?.id !== message.conversationId) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    }
    
    conversations.sort((a, b) => 
        (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
    );
    
    renderConversations(conversations);
}

// Scroll chat to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format timestamp
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Get current user ID
function getUserId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id;
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
});
