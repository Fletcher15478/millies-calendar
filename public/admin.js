const API_BASE_URL = window.location.origin;

// Login credentials
const ADMIN_USERNAME = 'support@millieshomemade.com';
const ADMIN_PASSWORD = 'Admin123';

// DOM Elements
const loginSection = document.getElementById('login-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');
const addEventBtn = document.getElementById('add-event-btn');
const eventModal = document.getElementById('event-modal');
const eventForm = document.getElementById('event-form');
const closeModal = document.querySelector('.close');
const cancelBtn = document.getElementById('cancel-btn');
const adminEventsContainer = document.getElementById('admin-events-container');
const photoInput = document.getElementById('event-photo');
const photoPreview = document.getElementById('photo-preview');

// Check if user is already logged in
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (isAuthenticated) {
        showAdminPanel();
    } else {
        showLoginForm();
    }
}

// Show login form
function showLoginForm() {
    loginSection.style.display = 'block';
    adminPanel.style.display = 'none';
}

// Handle login
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminAuthenticated', 'true');
            loginError.style.display = 'none';
            showAdminPanel();
        } else {
            loginError.textContent = 'Invalid username or password';
            loginError.style.display = 'block';
        }
    });
}

// Handle logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminAuthenticated');
        showLoginForm();
        document.getElementById('login-form').reset();
    });
}

// Event Listeners (only set up when admin panel is visible)
function setupAdminEventListeners() {
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => openModal());
    }
    if (closeModal) {
        closeModal.addEventListener('click', () => closeModalWindow());
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModalWindow());
    }
    if (eventModal) {
        window.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                closeModalWindow();
            }
        });
    }
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    if (eventForm) {
        eventForm.addEventListener('submit', handleFormSubmit);
    }
}

// Update showAdminPanel to set up event listeners
function showAdminPanel() {
    loginSection.style.display = 'none';
    adminPanel.style.display = 'block';
    setupAdminEventListeners();
    if (typeof loadEvents === 'function') {
        loadEvents(); // Load events when panel is shown
    }
}

// Event listeners are now set up in setupAdminEventListeners() function

// Functions
function parseTimeToDropdowns(time) {
    // Time format is "HH:MM" (24-hour) or "HH:MM AM/PM" (12-hour)
    if (!time) return { hour: '', minute: '', ampm: 'AM' };
    
    let hour, minute, ampm = 'AM';
    
    if (time.includes('AM') || time.includes('PM')) {
        // 12-hour format
        const parts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (parts) {
            hour = parseInt(parts[1]);
            minute = parts[2];
            ampm = parts[3].toUpperCase();
        }
    } else {
        // 24-hour format
        const [h, m] = time.split(':');
        hour = parseInt(h);
        minute = m;
        if (hour >= 12) {
            ampm = 'PM';
            if (hour > 12) hour = hour - 12;
        }
        if (hour === 0) hour = 12;
    }
    
    return {
        hour: hour.toString().padStart(2, '0'),
        minute: minute || '00',
        ampm: ampm
    };
}

function openModal(event = null) {
    document.getElementById('modal-title').textContent = event ? 'Edit Event' : 'Add New Event';
    document.getElementById('event-id').value = event ? event.id : '';
    
    if (event) {
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-date').value = event.date;
        document.getElementById('event-description').value = event.description;
        document.getElementById('event-location').value = event.location || '';
        document.getElementById('event-featured').checked = event.featured || false;
        document.getElementById('event-outside').checked = event.outside || false;
        document.getElementById('event-public').checked = event.publicEvent || false;
        document.getElementById('event-pet-friendly').checked = event.petFriendly || false;
        
        // Parse time into dropdowns
        const timeParts = parseTimeToDropdowns(event.time);
        document.getElementById('event-hour').value = timeParts.hour;
        document.getElementById('event-minute').value = timeParts.minute;
        document.getElementById('event-ampm').value = timeParts.ampm;
        
        if (event.photo) {
            photoPreview.innerHTML = `<img src="${API_BASE_URL}${event.photo}" alt="Current photo">`;
        } else {
            photoPreview.innerHTML = '';
        }
    } else {
        eventForm.reset();
        photoPreview.innerHTML = '';
        document.getElementById('event-featured').checked = false;
        document.getElementById('event-outside').checked = false;
        document.getElementById('event-public').checked = false;
        document.getElementById('event-pet-friendly').checked = false;
    }
    
    eventModal.style.display = 'block';
}

function closeModalWindow() {
    eventModal.style.display = 'none';
    eventForm.reset();
    photoPreview.innerHTML = '';
    document.getElementById('event-id').value = '';
}

function getTimeFromDropdowns() {
    const hour = document.getElementById('event-hour').value;
    const minute = document.getElementById('event-minute').value;
    const ampm = document.getElementById('event-ampm').value;
    
    if (!hour || !minute) return '';
    
    // Convert to 24-hour format for storage
    let hour24 = parseInt(hour);
    if (ampm === 'PM' && hour24 !== 12) {
        hour24 += 12;
    } else if (ampm === 'AM' && hour24 === 12) {
        hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minute}`;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const eventId = document.getElementById('event-id').value;
    const formData = new FormData();
    
    formData.append('title', document.getElementById('event-title').value);
    formData.append('date', document.getElementById('event-date').value);
    formData.append('time', getTimeFromDropdowns());
    formData.append('description', document.getElementById('event-description').value);
    formData.append('location', document.getElementById('event-location').value);
    formData.append('featured', document.getElementById('event-featured').checked ? 'true' : 'false');
    formData.append('outside', document.getElementById('event-outside').checked ? 'true' : 'false');
    formData.append('publicEvent', document.getElementById('event-public').checked ? 'true' : 'false');
    formData.append('petFriendly', document.getElementById('event-pet-friendly').checked ? 'true' : 'false');
    
    if (photoInput.files[0]) {
        formData.append('photo', photoInput.files[0]);
    }
    
    try {
        let response;
        if (eventId) {
            // Update existing event
            response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
                method: 'PUT',
                body: formData
            });
        } else {
            // Create new event
            response = await fetch(`${API_BASE_URL}/api/events`, {
                method: 'POST',
                body: formData
            });
        }
        
        if (response.ok) {
            closeModalWindow();
            loadEvents();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error || 'Failed to save event'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Update stats
function updateStats(events) {
    const totalEvents = events.length;
    const featuredEvents = events.filter(e => e.featured).length;
    
    const totalEventsEl = document.getElementById('total-events');
    const featuredEventsEl = document.getElementById('featured-events');
    
    if (totalEventsEl) {
        totalEventsEl.textContent = totalEvents;
    }
    if (featuredEventsEl) {
        featuredEventsEl.textContent = featuredEvents;
    }
}

async function loadEvents() {
    try {
        adminEventsContainer.innerHTML = '<div class="loading">Loading events...</div>';
        
        const response = await fetch(`${API_BASE_URL}/api/events`);
        const events = await response.json();
        
        // Update stats
        updateStats(events);
        
        if (events.length === 0) {
            adminEventsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No events yet</h3>
                    <p>Click "Add New Event" to create your first event!</p>
                </div>
            `;
            return;
        }
        
        adminEventsContainer.innerHTML = events.map(event => createEventCard(event)).join('');
        
        // Add event listeners to edit and delete buttons
        events.forEach(event => {
            const editBtn = document.getElementById(`edit-${event.id}`);
            const deleteBtn = document.getElementById(`delete-${event.id}`);
            
            if (editBtn) {
                editBtn.addEventListener('click', () => openModal(event));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => deleteEvent(event.id));
            }
        });
    } catch (error) {
        adminEventsContainer.innerHTML = `<div class="empty-state"><p>Error loading events: ${error.message}</p></div>`;
    }
}

function createEventCard(event) {
    const date = new Date(event.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const imageHtml = event.photo 
        ? `<img src="${API_BASE_URL}${event.photo}" alt="${event.title}" class="event-image">`
        : '';
    
    const featuredBadge = event.featured 
        ? '<span class="featured-badge">⭐ Featured</span>' 
        : '';
    
    return `
        <div class="event-card ${event.featured ? 'featured-event' : ''}">
            ${imageHtml}
            <div class="event-content">
                <div class="event-header">
                    <div>
                        <h3 class="event-title">
                            ${escapeHtml(event.title)}
                            ${featuredBadge}
                        </h3>
                        <div class="event-date-time">
                            <strong>${formattedDate}</strong> at ${formatTime(event.time)}
                        </div>
                    </div>
                </div>
                <p class="event-description">${escapeHtml(event.description)}</p>
                <div class="event-actions">
                    <button class="btn-primary" id="edit-${event.id}">Edit</button>
                    <button class="btn-danger" id="delete-${event.id}">Delete</button>
                </div>
            </div>
        </div>
    `;
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadEvents();
        } else {
            alert('Error deleting event');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize - check authentication on page load
checkAuth();

