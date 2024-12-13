// API endpoints
const API_ENDPOINTS = {
    stats: '/api/dashboard/stats',
    notifications: '/api/dashboard/notifications',
    markRead: '/api/dashboard/notifications/read',
    recentActivity: '/api/dashboard/recent-activity'
};

// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('unitrade_token');
    if (!token) {
        window.location.href = '/pages/login.html';
        return null;
    }
    return token;
}

// Get user data
function getUserData() {
    const userData = localStorage.getItem('unitrade_user');
    return userData ? JSON.parse(userData) : null;
}

// Fetch dashboard statistics
async function fetchDashboardStats() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(API_ENDPOINTS.stats, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            updateStatistics(data.data);
        } else {
            console.error('Failed to fetch dashboard stats:', data.error);
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

// Fetch notifications
async function fetchNotifications() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(API_ENDPOINTS.notifications, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            updateNotifications(data.data);
        } else {
            console.error('Failed to fetch notifications:', data.error);
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

// Fetch recent activity
async function fetchRecentActivity() {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(API_ENDPOINTS.recentActivity, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (data.success) {
            updateRecentActivity(data.data);
        } else {
            console.error('Failed to fetch recent activity:', data.error);
        }
    } catch (error) {
        console.error('Error fetching recent activity:', error);
    }
}

// Mark notifications as read
async function markNotificationsAsRead(notificationIds = []) {
    const token = checkAuth();
    if (!token) return;

    try {
        const response = await fetch(API_ENDPOINTS.markRead, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notification_ids: notificationIds })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await fetchNotifications(); // Refresh notifications
        } else {
            console.error('Failed to mark notifications as read:', data.error);
        }
    } catch (error) {
        console.error('Error marking notifications as read:', error);
    }
}

// Update statistics in the UI
function updateStatistics(stats) {
    document.querySelectorAll('.stat-value').forEach(element => {
        const key = element.parentElement.querySelector('h3').textContent.toLowerCase().replace(/\s+/g, '');
        if (key in stats) {
            if (key === 'rating') {
                element.textContent = stats[key].toFixed(1) + '/5.0';
            } else if (key === 'totalSales') {
                element.textContent = formatCurrency(stats[key]);
            } else {
                element.textContent = formatNumber(stats[key]);
            }
        }
    });
}

// Update notifications in the UI
function updateNotifications(notifications) {
    const notificationList = document.querySelector('.notification-list');
    notificationList.innerHTML = '';

    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        notificationItem.innerHTML = `
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${formatTimeAgo(notification.time)}</div>
            </div>
        `;
        notificationList.appendChild(notificationItem);
    });

    // Update notification count
    const unreadCount = notifications.filter(n => !n.read).length;
    const countElement = document.querySelector('.notification-count');
    
    if (unreadCount > 0) {
        countElement.style.display = 'block';
        countElement.textContent = unreadCount;
    } else {
        countElement.style.display = 'none';
    }
}

// Update recent activity in the UI
function updateRecentActivity(activities) {
    const activityList = document.querySelector('.activity-list');
    activityList.innerHTML = '';

    activities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        let iconClass = '';
        if (activity.type === 'transaction') {
            iconClass = activity.action === 'bought' ? 'shopping-cart' : 'tag';
        } else {
            iconClass = 'list';
        }

        activityItem.innerHTML = `
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${iconClass}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-title">
                    ${activity.type === 'transaction' 
                        ? `${activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} ${activity.item}`
                        : `Listed ${activity.item}`}
                </div>
                <div class="activity-desc">
                    ${activity.type === 'transaction'
                        ? `${formatCurrency(activity.amount)} - ${activity.status}`
                        : `${formatCurrency(activity.price)} - ${activity.status}`}
                </div>
                <div class="activity-time">${formatTimeAgo(activity.date)}</div>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

// Format time ago
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';
    }
    
    return 'just now';
}

// Format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Format currency
function formatCurrency(amount) {
    return '£' + amount.toFixed(2);
}

// Initialize dashboard
async function initializeDashboard() {
    const token = checkAuth();
    if (!token) return;

    const userData = getUserData();
    if (userData) {
        document.getElementById('userName').textContent = userData.fullName || 'User';
    }

    await Promise.all([
        fetchDashboardStats(),
        fetchNotifications(),
        fetchRecentActivity()
    ]);

    // Refresh data periodically
    setInterval(fetchDashboardStats, 60000); // Every minute
    setInterval(fetchNotifications, 30000); // Every 30 seconds
    setInterval(fetchRecentActivity, 60000); // Every minute
}

// Event listener for page load
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle?.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    const notificationBell = document.querySelector('.notification-bell');
    const userDropdown = document.querySelector('.user-dropdown');

    if (notificationBell && !notificationBell.contains(e.target)) {
        const dropdown = document.querySelector('.notification-dropdown');
        if (dropdown) dropdown.style.display = 'none';
    }

    if (userDropdown && !userDropdown.contains(e.target)) {
        const dropdown = document.querySelector('.dropdown-menu');
        if (dropdown) dropdown.style.display = 'none';
    }
});

// Event listener for mark all as read button
document.querySelector('.mark-all-read')?.addEventListener('click', () => {
    markNotificationsAsRead();
});
