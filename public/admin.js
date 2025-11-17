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
const importCsvBtn = document.getElementById('import-csv-btn');
const csvImportModal = document.getElementById('csv-import-modal');
const csvImportForm = document.getElementById('csv-import-form');
const csvFileInput = document.getElementById('csv-file');
const csvCloseBtn = document.querySelector('.csv-close');
const cancelCsvBtn = document.getElementById('cancel-csv-btn');
const csvImportProgress = document.getElementById('csv-import-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const csvImportResults = document.getElementById('csv-import-results');

// Check if user is already logged in
async function checkAuth() {
    // Check for Google auth first
    try {
        const response = await fetch('/api/auth/status', {
            credentials: 'include' // Include cookies
        });
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                sessionStorage.setItem('adminAuthenticated', 'true');
                sessionStorage.setItem('authMethod', 'google');
                if (data.user) {
                    sessionStorage.setItem('userEmail', data.user.email);
                    sessionStorage.setItem('userName', data.user.name || '');
                }
                showAdminPanel();
                return;
            }
        }
    } catch (error) {
        console.log('Google auth not available or error:', error);
    }
    
    // Fall back to regular auth
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (isAuthenticated) {
        showAdminPanel();
    } else {
        showLoginForm();
    }
    
    // Check for Google auth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('googleAuth') === 'success') {
        // Clear the URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
        // Refresh auth status
        checkAuth();
    } else if (urlParams.get('error') === 'unauthorized') {
        loginError.textContent = 'Your email is not authorized to access the admin panel.';
        loginError.style.display = 'block';
        window.history.replaceState({}, document.title, window.location.pathname);
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
    logoutBtn.addEventListener('click', async () => {
        const authMethod = sessionStorage.getItem('authMethod');
        
        if (authMethod === 'google') {
            // Logout from Google auth
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        
        // Clear all session storage
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('authMethod');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userName');
        
        showLoginForm();
        document.getElementById('login-form').reset();
    });
}

// Event Listeners (only set up when admin panel is visible)
function setupAdminEventListeners() {
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => openModal());
    }
    if (importCsvBtn) {
        importCsvBtn.addEventListener('click', () => openCsvModal());
    }
    if (closeModal) {
        closeModal.addEventListener('click', () => closeModalWindow());
    }
    if (csvCloseBtn) {
        csvCloseBtn.addEventListener('click', () => closeCsvModal());
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModalWindow());
    }
    if (cancelCsvBtn) {
        cancelCsvBtn.addEventListener('click', () => closeCsvModal());
    }
    if (eventModal) {
        window.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                closeModalWindow();
            }
        });
    }
    if (csvImportModal) {
        window.addEventListener('click', (e) => {
            if (e.target === csvImportModal) {
                closeCsvModal();
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
    if (csvImportForm) {
        csvImportForm.addEventListener('submit', handleCsvImport);
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
    // Parse date string (YYYY-MM-DD) without timezone conversion
    const [year, month, day] = event.date.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
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

// CSV Import Functions
function openCsvModal() {
    csvImportModal.style.display = 'block';
    csvImportForm.reset();
    csvImportProgress.style.display = 'none';
    csvImportResults.style.display = 'none';
}

function closeCsvModal() {
    csvImportModal.style.display = 'none';
    csvImportForm.reset();
    csvImportProgress.style.display = 'none';
    csvImportResults.style.display = 'none';
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['title', 'date', 'time', 'description'];
    
    // Check for required headers
    for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
            throw new Error(`Missing required column: ${required}`);
        }
    }
    
    const events = [];
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        // Parse CSV line handling quoted values
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        if (values.length !== headers.length) {
            console.warn(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}, skipping`);
            continue;
        }
        
        const event = {};
        headers.forEach((header, index) => {
            event[header] = values[index] || '';
        });
        
        events.push(event);
    }
    
    return events;
}

function validateEventData(event, rowNumber) {
    const errors = [];
    
    if (!event.title || !event.title.trim()) {
        errors.push('Title is required');
    }
    
    if (!event.date || !event.date.trim()) {
        errors.push('Date is required');
    } else {
        // Validate date format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(event.date)) {
            errors.push('Date must be in YYYY-MM-DD format');
        } else {
            const date = new Date(event.date);
            if (isNaN(date.getTime())) {
                errors.push('Invalid date');
            }
        }
    }
    
    if (!event.time || !event.time.trim()) {
        errors.push('Time is required');
    } else {
        // Validate time format HH:MM
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(event.time)) {
            errors.push('Time must be in HH:MM format (24-hour)');
        }
    }
    
    if (!event.description || !event.description.trim()) {
        errors.push('Description is required');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors,
        rowNumber: rowNumber
    };
}

async function handleCsvImport(e) {
    e.preventDefault();
    
    const file = csvFileInput.files[0];
    if (!file) {
        alert('Please select a CSV file');
        return;
    }
    
    try {
        // Read CSV file
        const text = await file.text();
        
        // Parse CSV
        const events = parseCSV(text);
        
        if (events.length === 0) {
            alert('No events found in CSV file');
            return;
        }
        
        // Validate all events
        const validationResults = events.map((event, index) => validateEventData(event, index + 2)); // +2 because row 1 is header
        const invalidEvents = validationResults.filter(r => !r.valid);
        
        if (invalidEvents.length > 0) {
            const errorMessages = invalidEvents.map(r => 
                `Row ${r.rowNumber}: ${r.errors.join(', ')}`
            ).join('\n');
            alert(`Please fix the following errors:\n\n${errorMessages}`);
            return;
        }
        
        // Show progress
        csvImportProgress.style.display = 'block';
        csvImportResults.style.display = 'none';
        progressFill.style.width = '0%';
        progressText.textContent = `Importing ${events.length} events...`;
        
        // Import events
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            const progress = ((i + 1) / events.length) * 100;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Importing event ${i + 1} of ${events.length}...`;
            
            try {
                // Handle both camelCase and lowercase column names
                const getValue = (obj, ...keys) => {
                    for (const key of keys) {
                        if (obj[key] !== undefined && obj[key] !== '') {
                            return obj[key];
                        }
                    }
                    return '';
                };
                
                const eventData = {
                    title: event.title.trim(),
                    date: event.date.trim(),
                    time: event.time.trim(),
                    description: event.description.trim(),
                    location: getValue(event, 'location') ? getValue(event, 'location').trim() : '',
                    featured: getValue(event, 'featured') === 'true' || getValue(event, 'featured') === true,
                    outside: getValue(event, 'outside') === 'true' || getValue(event, 'outside') === true,
                    publicEvent: getValue(event, 'publicevent', 'publicEvent') === 'true' || getValue(event, 'publicevent', 'publicEvent') === true,
                    petFriendly: getValue(event, 'petfriendly', 'petFriendly') === 'true' || getValue(event, 'petfriendly', 'petFriendly') === true
                };
                
                const response = await fetch(`${API_BASE_URL}/api/events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });
                
                if (response.ok) {
                    successCount++;
                } else {
                    const error = await response.json();
                    errorCount++;
                    errors.push(`Row ${i + 2}: ${error.error || 'Failed to import'}`);
                }
            } catch (error) {
                errorCount++;
                errors.push(`Row ${i + 2}: ${error.message}`);
            }
        }
        
        // Show results
        progressFill.style.width = '100%';
        progressText.textContent = 'Import complete!';
        
        let resultsHtml = `
            <div class="csv-results-summary">
                <h3>Import Results</h3>
                <p><strong>Successfully imported:</strong> ${successCount} events</p>
                <p><strong>Failed:</strong> ${errorCount} events</p>
            </div>
        `;
        
        if (errors.length > 0) {
            resultsHtml += `
                <div class="csv-errors">
                    <h4>Errors:</h4>
                    <ul>
                        ${errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        csvImportResults.innerHTML = resultsHtml;
        csvImportResults.style.display = 'block';
        
        // Reload events if any were successful
        if (successCount > 0) {
            setTimeout(() => {
                loadEvents();
            }, 1000);
        }
        
    } catch (error) {
        alert('Error processing CSV file: ' + error.message);
        csvImportProgress.style.display = 'none';
    }
}

// Initialize - check authentication on page load
checkAuth();

