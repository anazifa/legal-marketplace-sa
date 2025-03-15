// Search and Filter Module
class Search {
    constructor() {
        this.filters = {
            expertise: [],
            location: [],
            experience: [],
            rating: null,
            priceRange: {
                min: null,
                max: null
            },
            availability: null,
            language: []
        };
        this.searchResults = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalResults = 0;
        this.initSearch();
    }

    initSearch() {
        // Initialize search UI elements
        this.searchInput = document.querySelector('#search-input');
        this.filterForm = document.querySelector('#filter-form');
        this.resultsContainer = document.querySelector('#search-results');
        this.paginationContainer = document.querySelector('#pagination');

        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
        }

        if (this.filterForm) {
            this.filterForm.addEventListener('change', this.handleFilterChange.bind(this));
        }

        // Handle URL parameters for initial search
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('q')) {
            this.searchInput.value = urlParams.get('q');
            this.handleSearch();
        }
    }

    async handleSearch() {
        const query = this.searchInput.value.trim();
        if (query.length < 2) return;

        try {
            // Update URL without reloading
            const url = new URL(window.location);
            url.searchParams.set('q', query);
            window.history.pushState({}, '', url);

            // Show loading state
            this.showLoadingState();

            // Perform search
            const results = await this.performSearch(query);
            this.searchResults = results.items;
            this.totalResults = results.total;

            // Update UI
            this.updateResults();
            this.updatePagination();

            // Track search
            window.Analytics.behavior.trackEvent('search_performed', {
                query,
                results_count: results.total,
                filters: this.filters
            });
        } catch (error) {
            this.handleError(error);
        } finally {
            this.hideLoadingState();
        }
    }

    async performSearch(query) {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                filters: this.filters,
                page: this.currentPage,
                itemsPerPage: this.itemsPerPage
            })
        });

        if (!response.ok) {
            throw new Error('Search failed');
        }

        return response.json();
    }

    handleFilterChange(event) {
        const target = event.target;
        const filterType = target.dataset.filterType;
        const filterValue = target.value;

        if (!filterType) return;

        if (target.type === 'checkbox') {
            if (target.checked) {
                this.filters[filterType].push(filterValue);
            } else {
                this.filters[filterType] = this.filters[filterType]
                    .filter(value => value !== filterValue);
            }
        } else if (target.type === 'radio') {
            this.filters[filterType] = filterValue;
        } else if (filterType === 'priceRange') {
            const range = target.dataset.range;
            this.filters.priceRange[range] = parseFloat(filterValue);
        }

        // Perform search with updated filters
        this.currentPage = 1; // Reset to first page
        this.handleSearch();
    }

    updateResults() {
        if (!this.resultsContainer) return;

        if (this.searchResults.length === 0) {
            this.resultsContainer.innerHTML = this.getNoResultsTemplate();
            return;
        }

        this.resultsContainer.innerHTML = this.searchResults
            .map(result => this.getResultTemplate(result))
            .join('');

        // Initialize lazy loading for images
        this.initLazyLoading();
    }

    updatePagination() {
        if (!this.paginationContainer) return;

        const totalPages = Math.ceil(this.totalResults / this.itemsPerPage);
        if (totalPages <= 1) {
            this.paginationContainer.innerHTML = '';
            return;
        }

        this.paginationContainer.innerHTML = this.getPaginationTemplate(totalPages);
        this.initPaginationHandlers();
    }

    getResultTemplate(result) {
        return `
            <div class="result-card bg-white rounded-lg shadow-md p-6 mb-4" data-result-id="${result.id}">
                <div class="flex items-start">
                    <img src="${result.avatar}" 
                         alt="${result.name}" 
                         class="w-16 h-16 rounded-full lazy"
                         loading="lazy"
                         data-src="${result.avatar}">
                    <div class="ml-4 flex-grow">
                        <h3 class="text-xl font-semibold">
                            <a href="/profile/${result.id}" class="hover:text-blue-600">${result.name}</a>
                        </h3>
                        <p class="text-gray-600">${result.title}</p>
                        <div class="flex items-center mt-2">
                            <div class="flex items-center">
                                <span class="text-yellow-400">★</span>
                                <span class="ml-1">${result.rating}</span>
                            </div>
                            <span class="mx-2">•</span>
                            <span>${result.successRate}% Success rate</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-semibold">${result.hourlyRate}/hr</div>
                        <div class="text-sm text-gray-600">Total earned: ${result.totalEarned}</div>
                    </div>
                </div>
                <p class="mt-4 text-gray-700">${result.description}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                    ${result.skills.map(skill => `
                        <span class="px-3 py-1 bg-gray-100 rounded-full text-sm">${skill}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getNoResultsTemplate() {
        return `
            <div class="text-center py-12">
                <h3 class="text-xl font-semibold text-gray-900">No results found</h3>
                <p class="mt-2 text-gray-600">Try adjusting your search or filters</p>
            </div>
        `;
    }

    getPaginationTemplate(totalPages) {
        let pages = [];
        const current = this.currentPage;

        // Always show first page
        pages.push(1);

        // Add ellipsis and pages around current page
        if (current > 3) pages.push('...');
        for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
            pages.push(i);
        }
        if (current < totalPages - 2) pages.push('...');

        // Always show last page
        if (totalPages > 1) pages.push(totalPages);

        return `
            <div class="flex justify-center items-center space-x-2">
                <button class="pagination-btn" 
                        data-page="${current - 1}"
                        ${current === 1 ? 'disabled' : ''}>
                    Previous
                </button>
                ${pages.map(page => `
                    ${page === '...' 
                        ? `<span class="px-3 py-2">...</span>`
                        : `<button class="pagination-btn ${page === current ? 'active' : ''}"
                                   data-page="${page}">
                                ${page}
                           </button>`}
                `).join('')}
                <button class="pagination-btn"
                        data-page="${current + 1}"
                        ${current === totalPages ? 'disabled' : ''}>
                    Next
                </button>
            </div>
        `;
    }

    initPaginationHandlers() {
        this.paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.handleSearch();
                    // Scroll to top of results
                    this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    initLazyLoading() {
        const lazyImages = document.querySelectorAll('img.lazy');
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            lazyImages.forEach(img => imageObserver.observe(img));
        }
    }

    showLoadingState() {
        if (!this.resultsContainer) return;
        this.resultsContainer.innerHTML = `
            <div class="loading-skeleton">
                ${Array(5).fill().map(() => `
                    <div class="h-32 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
                `).join('')}
            </div>
        `;
    }

    hideLoadingState() {
        // Loading state is automatically replaced when results are updated
    }

    handleError(error) {
        window.Analytics.error.logError({
            type: 'search_error',
            message: error.message,
            stack: error.stack
        });

        if (!this.resultsContainer) return;
        this.resultsContainer.innerHTML = `
            <div class="text-center py-12">
                <h3 class="text-xl font-semibold text-red-600">Error</h3>
                <p class="mt-2 text-gray-600">Failed to perform search. Please try again.</p>
            </div>
        `;
    }

    debounce(func, wait) {
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
}

// Initialize search
window.Search = new Search(); 