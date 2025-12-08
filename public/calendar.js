const API_BASE_URL = window.location.origin;

// DOM Elements
const eventsContainer = document.getElementById('events-container');

// State for current displayed month
let currentDisplayMonth = new Date();
let allEvents = [];

// Initialize month navigation using event delegation
function initMonthNavigation() {
    // Use event delegation on the events container
    eventsContainer.addEventListener('click', (e) => {
        if (e.target.id === 'prev-month-btn') {
            currentDisplayMonth = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() - 1, 1);
            displayMonthEvents();
        } else if (e.target.id === 'next-month-btn') {
            currentDisplayMonth = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() + 1, 1);
            displayMonthEvents();
        }
    });
}

async function loadEvents() {
    try {
        eventsContainer.innerHTML = '<div class="loading">Loading events...</div>';
        
        const response = await fetch(`${API_BASE_URL}/api/events`);
        allEvents = await response.json();
        
        // Initialize with current month
        currentDisplayMonth = new Date();
        displayMonthEvents();
    } catch (error) {
        eventsContainer.innerHTML = `<div class="empty-state"><p>Error loading events: ${error.message}</p></div>`;
    }
}

function displayMonthEvents() {
    try {
        if (allEvents.length === 0) {
            eventsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No events yet</h3>
                    <p>Check back soon for upcoming events!</p>
                </div>
            `;
            return;
        }
        
        const displayYear = currentDisplayMonth.getFullYear();
        const displayMonth = currentDisplayMonth.getMonth();
        
        // Filter events to only show selected month
        const monthEvents = allEvents.filter(event => {
            // Parse date string (YYYY-MM-DD) without timezone conversion
            const [year, month, day] = event.date.split('-').map(Number);
            const eventDate = new Date(year, month - 1, day);
            return eventDate.getFullYear() === displayYear && 
                   eventDate.getMonth() === displayMonth;
        });
        
        // Get month name
        const monthName = currentDisplayMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        
        // Build HTML - always include navigation
        let html = '';
        html += '<div class="events-section">';
        html += '<div class="month-header-wrapper">';
        html += '<button id="prev-month-btn" class="month-nav-btn" aria-label="Previous month">‹</button>';
        html += `<h2 class="section-header month-header">${monthName.toUpperCase()}</h2>`;
        html += '<button id="next-month-btn" class="month-nav-btn" aria-label="Next month">›</button>';
        html += '</div>';
        
        if (monthEvents.length === 0) {
            html += '<div class="empty-state">';
            html += '<h3>No events this month</h3>';
            html += `<p>Check back soon for upcoming events in ${monthName}!</p>`;
            html += '</div>';
        } else {
            html += '<div class="events-tiles">';
            html += monthEvents.map(event => createEventTile(event)).join('');
            html += '</div>';
        }
        
        html += '</div>';
        
        eventsContainer.innerHTML = html;
    } catch (error) {
        eventsContainer.innerHTML = `<div class="empty-state"><p>Error loading events: ${error.message}</p></div>`;
    }
}

// Helper function to get full image URL (handles both Supabase Storage URLs and local paths)
function getImageUrl(photoPath) {
    if (!photoPath) return '';
    // If it's already a full URL (starts with http:// or https://), use it directly
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
    }
    // Otherwise, prepend API_BASE_URL for local paths
    return `${API_BASE_URL}${photoPath}`;
}

function createEventTile(event) {
    // Parse date string (YYYY-MM-DD) without timezone conversion
    const [year, month, day] = event.date.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const backgroundImage = event.photo
        ? `background-image: url('${getImageUrl(event.photo)}');`
        : '';
    
    const hasImage = event.photo ? 'has-image' : 'no-image';

    // Create badges for event attributes
    const badges = [];
    if (event.outside) badges.push('<span class="event-badge">🌳 Outside</span>');
    if (event.publicEvent) badges.push('<span class="event-badge">🌍 Public</span>');
    if (event.petFriendly) badges.push('<span class="event-badge">🐾 Pet Friendly</span>');
    const badgesHtml = badges.length > 0 ? `<div class="event-badges">${badges.join('')}</div>` : '';

    // Create Google Maps link if location exists
    const locationHtml = event.location && event.location.trim()
        ? (() => {
            // Format address: first part on one line, rest combined with commas on second line
            const addressParts = event.location.split(',').map(part => part.trim()).filter(part => part);
            let formattedAddress;
            if (addressParts.length > 1) {
                const streetAddress = escapeHtml(addressParts[0]);
                const cityStateZip = addressParts.slice(1).map(part => escapeHtml(part)).join(', ');
                formattedAddress = `${streetAddress}<br>${cityStateZip}`;
            } else {
                formattedAddress = escapeHtml(event.location);
            }
            return `<div class="event-tile-location-wrapper">
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}" target="_blank" rel="noopener noreferrer" class="event-tile-location">
                    <span class="location-pin">📍</span>
                    <span class="location-address">${formattedAddress}</span>
                </a>
               </div>`;
          })()
        : '';

    // Create calendar link
    let calendarUrl;
    try {
        // Parse date and time without timezone conversion
        const [year, month, day] = event.date.split('-').map(Number);
        const [hours, minutes] = event.time.split(':').map(Number);
        const eventDateTime = new Date(year, month - 1, day, hours, minutes);
        const eventDateISO = eventDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endDate = new Date(eventDateTime.getTime() + 60 * 60 * 1000); // 1 hour default
        const endDateISO = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${eventDateISO}/${endDateISO}&details=${encodeURIComponent(event.description)}${event.location ? '&location=' + encodeURIComponent(event.location) : ''}`;
    } catch (e) {
        calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&details=${encodeURIComponent(event.description)}${event.location ? '&location=' + encodeURIComponent(event.location) : ''}`;
    }

    return `
        <div class="event-tile ${hasImage}" style="${backgroundImage}">
            <div class="event-tile-overlay"></div>
            <div class="event-tile-content">
                <h3 class="event-tile-title">${escapeHtml(event.title)}</h3>
                <div class="event-tile-date-time">
                    <span class="event-tile-date">${formattedDate}</span>
                    <span class="event-tile-time">${formatTimeRange(event.time, event.endTime)}</span>
                </div>
                <p class="event-tile-description-preview">${escapeHtml(event.description.substring(0, 100))}${event.description.length > 100 ? '...' : ''}</p>
            </div>
            <div class="event-tile-expansion">
                <div class="event-tile-expansion-content">
                    ${badgesHtml}
                    <p class="event-tile-description-full">${escapeHtml(event.description)}</p>
                    ${locationHtml}
                    ${event.eventbriteLink ? `<a href="${escapeHtml(event.eventbriteLink)}" target="_blank" rel="noopener noreferrer" class="find-out-more-link">Find Out More Here</a>` : ''}
                    <a href="${calendarUrl}" target="_blank" rel="noopener noreferrer" class="add-to-calendar-btn">📅 Add to Calendar</a>
                </div>
            </div>
        </div>
    `;
}


function formatTime(time) {
    // Convert 24-hour time to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function formatTimeRange(startTime, endTime) {
    const start = formatTime(startTime);
    if (endTime) {
        const end = formatTime(endTime);
        return `${start} - ${end}`;
    }
    return start;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Carousel scrolling navigation - smooth infinite loop
function initStepScrolling() {
    const navTrack = document.getElementById('nav-track');
    const allItems = document.querySelectorAll('.event-type-name');
    const navBar = document.querySelector('.hero-nav-bar');
    
    if (!navTrack || allItems.length === 0) return;
    
    const scrollDelay = 2000; // 2 seconds between scrolls
    let currentScrollPosition = 0;
    
    // Update active/centered classes - only the centered item is bold
    function updateActiveClass() {
        const navBarWidth = navBar.offsetWidth;
        const centerX = navBarWidth / 2;
        
        allItems.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const navBarRect = navBar.getBoundingClientRect();
            const itemCenterX = rect.left - navBarRect.left + (rect.width / 2);
            const distanceFromCenter = Math.abs(itemCenterX - centerX);
            
            // If item is within 50px of center, make it bold
            if (distanceFromCenter < 50) {
                item.classList.add('slick-current', 'slick-active', 'slick-center');
            } else {
                item.classList.remove('slick-current', 'slick-active', 'slick-center');
            }
        });
    }
    
    // Find the next item to the right and scroll to it
    function scrollToNextItem() {
        const navBarWidth = navBar.offsetWidth;
        const centerX = navBarWidth / 2;
        
        // Get all items with their positions
        const itemsWithPositions = Array.from(allItems).map(item => {
            const rect = item.getBoundingClientRect();
            const navBarRect = navBar.getBoundingClientRect();
            const itemCenterX = rect.left - navBarRect.left + (rect.width / 2);
            return {
                element: item,
                centerX: itemCenterX,
                width: rect.width
            };
        });
        
        // Find the next item to the right of center
        const nextItem = itemsWithPositions.find(item => item.centerX > centerX + 10);
        
        if (nextItem) {
            // Calculate how much to scroll to center this item
            const scrollAmount = nextItem.centerX - centerX;
            currentScrollPosition += scrollAmount;
            
            // Apply the scroll
            navTrack.style.transition = 'transform 0.5s ease-in-out';
            navTrack.style.transform = `translate3d(-${currentScrollPosition}px, 0px, 0px)`;
            
            // Update active classes
            setTimeout(() => {
                updateActiveClass();
            }, 50);
            
            // Check if we need to reset for infinite loop
            setTimeout(() => {
                checkInfiniteLoop();
            }, 550);
        }
        
        // Schedule next scroll
        setTimeout(() => {
            scrollToNextItem();
        }, scrollDelay);
    }
    
    // Reset position for seamless infinite loop
    function checkInfiniteLoop() {
        // Calculate total width of original items (non-cloned)
        const originalItems = Array.from(allItems).filter(item => !item.classList.contains('slick-cloned'));
        let totalWidth = 0;
        originalItems.forEach(item => {
            totalWidth += item.offsetWidth;
        });
        
        // If we've scrolled past the original items, reset seamlessly
        if (currentScrollPosition >= totalWidth) {
            navTrack.style.transition = 'none';
            currentScrollPosition = currentScrollPosition - totalWidth;
            navTrack.style.transform = `translate3d(-${currentScrollPosition}px, 0px, 0px)`;
            
            // Force reflow
            void navTrack.offsetHeight;
            
            // Re-enable transition
            setTimeout(() => {
                navTrack.style.transition = 'transform 0.5s ease-in-out';
            }, 50);
        }
    }
    
    // Continuously update active class based on position
    function updateActiveClassContinuously() {
        if (navBar && navTrack) {
            updateActiveClass();
        }
        requestAnimationFrame(updateActiveClassContinuously);
    }
    
    // Initialize
    setTimeout(() => {
        // Start with first item centered
        currentScrollPosition = 0;
        navTrack.style.transform = `translate3d(0px, 0px, 0px)`;
        updateActiveClass();
        
        // Start continuous active class updates
        updateActiveClassContinuously();
        
        // Start auto-scrolling
        setTimeout(() => {
            scrollToNextItem();
        }, scrollDelay);
    }, 100);
}

// Initialize step scrolling when page loads
window.addEventListener('load', () => {
    initStepScrolling();
    // Initialize month navigation after DOM is loaded
    initMonthNavigation();
});

// Load events on page load
loadEvents();