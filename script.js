// DOM Elements
const searchInput = document.getElementById('searchInput');
const navLinks = document.querySelectorAll('.nav-link');
const contentSections = document.querySelectorAll('.content-section');
const sidebar = document.querySelector('.sidebar');

// State Management
let currentActiveSection = '';
let searchHighlights = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeSearch();
    initializeScrollSpy();
    initializeMobileMenu();
    initializeAccessibility();
});

// Navigation Functions
function initializeNavigation() {
    // Add smooth scrolling to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                scrollToSection(targetSection);
                updateActiveNavLink(this);
                
                // Close mobile menu if open
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            }
        });
    });
}

function scrollToSection(section) {
    const navbarHeight = document.querySelector('.navbar').offsetHeight;
    const yOffset = -navbarHeight - 20;
    const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
    
    window.scrollTo({
        top: y,
        behavior: 'smooth'
    });
}

function updateActiveNavLink(activeLink) {
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

// Search Functionality
function initializeSearch() {
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = this.value.trim().toLowerCase();
            if (query.length >= 2) {
                performSearch(query);
            } else {
                clearSearch();
            }
        }, 300);
    });
    
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = this.value.trim().toLowerCase();
            if (query.length >= 2) {
                performSearch(query);
                navigateToFirstResult();
            }
        }
        
        if (e.key === 'Escape') {
            clearSearch();
            this.blur();
        }
    });
    
    // Add clear button event listener
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            clearSearch();
            searchInput.focus();
        });
    }
}

function performSearch(query) {
    clearSearch();
    
    if (!query) return;
    
    const results = [];
    const searchTerms = query.split(' ').filter(term => term.length > 1);
    
    contentSections.forEach(section => {
        const sectionResults = searchInSection(section, searchTerms);
        if (sectionResults.length > 0) {
            results.push({
                section: section,
                matches: sectionResults
            });
        }
    });
    
    displaySearchResults(results);
    highlightSearchTerms(searchTerms);
}

function searchInSection(section, searchTerms) {
    const matches = [];
    const textContent = section.textContent.toLowerCase();
    
    searchTerms.forEach(term => {
        if (textContent.includes(term)) {
            // Find specific elements containing the term
            const elements = section.querySelectorAll('h2, h3, h4, h5, p, li, td, .examples');
            elements.forEach(element => {
                if (element.textContent.toLowerCase().includes(term)) {
                    matches.push({
                        element: element,
                        term: term,
                        snippet: createSnippet(element.textContent, term)
                    });
                }
            });
        }
    });
    
    return matches;
}

function createSnippet(text, term) {
    const index = text.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) return text.substring(0, 100) + '...';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + 50);
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
}

function highlightSearchTerms(searchTerms) {
    searchHighlights = [];
    
    contentSections.forEach(section => {
        const walker = document.createTreeWalker(
            section,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(textNode => {
            let content = textNode.textContent;
            let modified = false;
            
            searchTerms.forEach(term => {
                const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
                if (content.match(regex)) {
                    content = content.replace(regex, '<mark class="search-highlight">$1</mark>');
                    modified = true;
                }
            });
            
            if (modified) {
                const span = document.createElement('span');
                span.innerHTML = content;
                textNode.parentNode.replaceChild(span, textNode);
                searchHighlights.push(span);
            }
        });
    });
}

function displaySearchResults(results) {
    // Remove existing search results display
    const existingResults = document.querySelector('.search-results');
    if (existingResults) {
        existingResults.remove();
    }
    
    if (results.length === 0) {
        showNoResults();
        return;
    }
    
    // Create search results display
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results';
    
    const resultsHeader = document.createElement('div');
    resultsHeader.className = 'search-results-header';
    resultsHeader.innerHTML = `
        <h3>Sökresultat (${results.length} ${results.length === 1 ? 'sektion' : 'sektioner'})</h3>
        <button onclick="clearSearch()" class="close-search">×</button>
    `;
    resultsContainer.appendChild(resultsHeader);
    
    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        
        const sectionTitle = result.section.querySelector('h2').textContent;
        const sectionId = result.section.id;
        
        resultItem.innerHTML = `
            <h4><a href="#${sectionId}" class="result-link">${sectionTitle}</a></h4>
            <p class="result-summary">${result.matches.length} ${result.matches.length === 1 ? 'träff' : 'träffar'} i denna sektion</p>
        `;
        
        resultItem.querySelector('.result-link').addEventListener('click', function(e) {
            e.preventDefault();
            scrollToSection(result.section);
            updateActiveNavLink(document.querySelector(`[href="#${sectionId}"]`));
        });
        
        resultsContainer.appendChild(resultItem);
    });
    
    // Insert results after the main header
    const contentHeader = document.querySelector('.content-header');
    contentHeader.insertAdjacentElement('afterend', resultsContainer);
}

function showNoResults() {
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results no-results';
    resultsContainer.innerHTML = `
        <div class="search-results-header">
            <h3>Inga resultat hittades</h3>
            <button onclick="clearSearch()" class="close-search">×</button>
        </div>
        <p>Prova med andra sökord eller kontrollera stavningen.</p>
    `;
    
    const contentHeader = document.querySelector('.content-header');
    contentHeader.insertAdjacentElement('afterend', resultsContainer);
}

function navigateToFirstResult() {
    const firstResult = document.querySelector('.search-result-item .result-link');
    if (firstResult) {
        firstResult.click();
    }
}

function clearSearch() {
    // Clear search input
    searchInput.value = '';
    
    // Remove search results display
    const existingResults = document.querySelector('.search-results');
    if (existingResults) {
        existingResults.remove();
    }
    
    // Remove highlights
    searchHighlights.forEach(highlight => {
        const parent = highlight.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
            parent.normalize();
        }
    });
    searchHighlights = [];
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
}

// Scroll Spy Functionality
function initializeScrollSpy() {
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                const navLink = document.querySelector(`[href="#${id}"]`);
                if (navLink && currentActiveSection !== id) {
                    updateActiveNavLink(navLink);
                    currentActiveSection = id;
                }
            }
        });
    }, observerOptions);
    
    contentSections.forEach(section => {
        observer.observe(section);
    });
}

// Mobile Menu Functionality
function initializeMobileMenu() {
    // Add mobile menu toggle button
    const navbar = document.querySelector('.navbar .nav-container');
    const menuToggle = document.createElement('button');
    menuToggle.className = 'mobile-menu-toggle';
    menuToggle.innerHTML = '☰';
    menuToggle.setAttribute('aria-label', 'Öppna meny');
    
    // Insert menu toggle before search (or at the end if no search)
    const searchContainer = document.querySelector('.nav-search');
    if (searchContainer) {
        navbar.insertBefore(menuToggle, searchContainer);
    } else {
        navbar.appendChild(menuToggle);
    }
    
    // Toggle sidebar on mobile
    menuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        const isOpen = sidebar.classList.contains('open');
        this.setAttribute('aria-label', isOpen ? 'Stäng meny' : 'Öppna meny');
        this.innerHTML = isOpen ? '×' : '☰';
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
                menuToggle.innerHTML = '☰';
                menuToggle.setAttribute('aria-label', 'Öppna meny');
            }
        }
    });
    
    // Handle resize events
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
            menuToggle.innerHTML = '☰';
            menuToggle.setAttribute('aria-label', 'Öppna meny');
        }
    });
}

// Accessibility Features
function initializeAccessibility() {
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Hoppa till huvudinnehåll';
    skipLink.className = 'skip-link';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // Alt + S to focus search
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Escape to close mobile menu
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            const menuToggle = document.querySelector('.mobile-menu-toggle');
            if (menuToggle) {
                menuToggle.innerHTML = '☰';
                menuToggle.setAttribute('aria-label', 'Öppna meny');
            }
        }
    });
    
    // Add focus management for navigation
    navLinks.forEach(link => {
        link.addEventListener('focus', function() {
            this.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        });
    });
}

// Table Enhancement
function enhanceTables() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        // Make tables responsive
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
        
        // Add sort functionality for verb tables
        if (table.closest('.verb-groups-table')) {
            addTableSorting(table);
        }
    });
}

function addTableSorting(table) {
    const headers = table.querySelectorAll('th');
    headers.forEach((header, index) => {
        if (index > 0) { // Skip first column (verb group descriptions)
            header.style.cursor = 'pointer';
            header.addEventListener('click', function() {
                sortTable(table, index);
            });
        }
    });
}

function sortTable(table, columnIndex) {
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const isAscending = table.getAttribute('data-sort-direction') !== 'asc';
    
    rows.sort((a, b) => {
        const aText = a.cells[columnIndex]?.textContent.trim() || '';
        const bText = b.cells[columnIndex]?.textContent.trim() || '';
        
        return isAscending ? 
            aText.localeCompare(bText, 'sv') : 
            bText.localeCompare(aText, 'sv');
    });
    
    const tbody = table.querySelector('tbody');
    rows.forEach(row => tbody.appendChild(row));
    
    table.setAttribute('data-sort-direction', isAscending ? 'asc' : 'desc');
}

// Content Enhancement
function enhanceContent() {
    // Add copy buttons to example blocks
    const exampleBlocks = document.querySelectorAll('.examples');
    exampleBlocks.forEach(block => {
        const copyButton = document.createElement('button');
        copyButton.textContent = 'Kopiera';
        copyButton.className = 'copy-button';
        copyButton.onclick = function() {
            navigator.clipboard.writeText(block.textContent).then(() => {
                copyButton.textContent = 'Kopierat!';
                setTimeout(() => {
                    copyButton.textContent = 'Kopiera';
                }, 2000);
            });
        };
        
        block.style.position = 'relative';
        block.appendChild(copyButton);
    });
    
    // Add expand/collapse for large tables
    const largeTables = document.querySelectorAll('.verb-groups-table table, .time-usage-table table');
    largeTables.forEach(table => {
        if (table.rows.length > 6) {
            addTableCollapseFeature(table);
        }
    });
}

function addTableCollapseFeature(table) {
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const visibleRows = 5;
    
    if (rows.length <= visibleRows) return;
    
    // Hide rows beyond the visible limit
    rows.slice(visibleRows).forEach(row => {
        row.style.display = 'none';
        row.setAttribute('data-hidden', 'true');
    });
    
    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = `Visa fler (${rows.length - visibleRows} till)`;
    toggleButton.className = 'table-toggle';
    
    toggleButton.onclick = function() {
        const hiddenRows = table.querySelectorAll('[data-hidden="true"]');
        const isExpanded = hiddenRows.length === 0;
        
        if (isExpanded) {
            // Collapse
            rows.slice(visibleRows).forEach(row => {
                row.style.display = 'none';
                row.setAttribute('data-hidden', 'true');
            });
            this.textContent = `Visa fler (${rows.length - visibleRows} till)`;
        } else {
            // Expand
            hiddenRows.forEach(row => {
                row.style.display = '';
                row.removeAttribute('data-hidden');
            });
            this.textContent = 'Visa färre';
        }
    };
    
    table.parentNode.insertBefore(toggleButton, table.nextSibling);
}

// Theme and Settings
function initializeThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.textContent = '🌙';
    themeToggle.className = 'theme-toggle';
    themeToggle.setAttribute('aria-label', 'Växla mörkt tema');
    
    const navSearch = document.querySelector('.nav-search');
    if (navSearch) {
        navSearch.appendChild(themeToggle);
    }
    
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        this.textContent = isDark ? '☀️' : '🌙';
        this.setAttribute('aria-label', isDark ? 'Växla ljust tema' : 'Växla mörkt tema');
        
        // Save preference
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
        themeToggle.setAttribute('aria-label', 'Växla ljust tema');
    }
}

// Initialize enhanced features when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        enhanceTables();
        enhanceContent();
        initializeThemeToggle();
    }, 100);
});

// Performance optimization
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

// Lazy loading for images (if any are added later)
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('An error occurred:', e.error);
    // Could add user-friendly error messaging here
});

// Export functions for potential external use
window.KGC = {
    clearSearch,
    performSearch,
    scrollToSection,
    enhanceTables,
    enhanceContent
};