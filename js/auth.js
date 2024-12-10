// JWT token management
const TOKEN_KEY = 'unitrade_token';
const USER_KEY = 'unitrade_user';
const API_BASE_URL = 'http://localhost:5000/api'; // Update this with your actual API base URL

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Check if user is authenticated
function isAuthenticated() {
    const token = getToken();
    return !!token;
}

// Redirect if already authenticated
function checkAuthAndRedirect() {
    if (isAuthenticated() && 
        (window.location.pathname === '/pages/login.html' || 
         window.location.pathname === '/pages/register.html')) {
        window.location.href = '/pages/dashboard.html';
    }
}

// Toast message functionality
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000);
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }
    
    if (!password) {
        showToast('Please enter your password', 'error');
        return;
    }
    
    try {
        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        // Store token and user data
        setToken(data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        // Show success message
        showToast('Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = '/pages/dashboard.html';
        }, 1000);
        
    } catch (error) {
        showToast(error.message || 'Login failed', 'error');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
}

// Handle registration form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');

    // Get form values
    const fullName = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const university = document.getElementById('university').value.trim();
    const studentId = document.getElementById('student_id').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Basic validation
    if (!fullName || !email || !university || !studentId || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    // Email validation
    if (!email.includes('@')) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    // Password validation
    if (password.length < 8) {
        showToast('Password must be at least 8 characters long', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    try {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName,
                email,
                password,
                studentId,
                university
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        // Show success message
        showToast('Registration successful! Please log in.', 'success');
        
        // Clear form
        form.reset();
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 2000);
        
    } catch (error) {
        showToast(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Register';
    }
}

// Handle logout
function handleLogout() {
    try {
        // Clear authentication token and user data
        localStorage.removeItem('unitrade_token');
        localStorage.removeItem('unitrade_user');
        
        // Show success message
        showToast('Logged out successfully', 'success');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = '/pages/login.html';
        }, 1500);
    } catch (error) {
        showToast('Error logging out', 'error');
        console.error('Logout error:', error);
    }
}

// Add authentication headers to fetch requests
function authenticatedFetch(url, options = {}) {
    const token = getToken();
    if (!token) {
        window.location.href = '/pages/login.html';
        return;
    }
    
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });
}

// Update UI based on authentication status
function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;
    
    if (isAuthenticated()) {
        const userData = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
        const isProfilePage = window.location.pathname.includes('/pages/profile.html');
        authButtons.innerHTML = `
            <a href="/pages/profile.html" class="profile-btn">
                <i class="fas fa-user"></i>
                <span>${userData.fullName || 'Profile'}</span>
            </a>
            ${isProfilePage ? '<button class="logout-btn" onclick="handleLogout()">Logout</button>' : ''}
        `;
    } else {
        authButtons.innerHTML = `
            <a href="/pages/login.html" class="login-btn">Login</a>
            <a href="/pages/register.html" class="register-btn">Register</a>
        `;
    }
}

// Initialize auth UI and check authentication
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    checkAuthAndRedirect();
});
