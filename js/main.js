// Shared functionality for all pages

// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        const menuIcon = mobileMenuButton.querySelector('svg:first-child');
        const closeIcon = mobileMenuButton.querySelector('svg:last-child');

        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            menuIcon.classList.toggle('hidden');
            closeIcon.classList.toggle('hidden');
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
        });
    }
}

// Search functionality
function initSearch() {
    const searchButton = document.querySelector('.search-button');
    const searchModal = document.getElementById('search-modal');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const closeSearch = document.querySelector('.close-search');
    
    if (searchButton && searchModal) {
        // Open search modal
        searchButton.addEventListener('click', () => {
            searchModal.classList.remove('hidden');
            searchInput.focus();
        });

        // Close search modal
        closeSearch.addEventListener('click', () => {
            searchModal.classList.add('hidden');
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
                searchModal.classList.add('hidden');
            }
        });

        // Handle search input
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }

            searchTimeout = setTimeout(() => {
                // Simulate search results (replace with actual API call)
                const results = [
                    { title: 'Find a Lawyer', url: '/find-lawyer.html' },
                    { title: 'Post a Request', url: '/post-request.html' },
                    { title: 'Legal Services', url: '/services.html' },
                    { title: 'About Us', url: '/about.html' }
                ].filter(item => 
                    item.title.toLowerCase().includes(query.toLowerCase())
                );

                displaySearchResults(results);
            }, 300);
        });
    }
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="p-4 text-gray-500">
                No results found
            </div>
        `;
        return;
    }

    searchResults.innerHTML = results.map(result => `
        <a href="${result.url}" class="block p-4 hover:bg-gray-50">
            <h3 class="text-lg font-medium text-gray-900">${result.title}</h3>
            <p class="text-sm text-gray-500">${result.url}</p>
        </a>
    `).join('');
}

// Cookie consent banner
function initCookieConsent() {
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptCookies = document.getElementById('accept-cookies');
    const declineCookies = document.getElementById('decline-cookies');
    
    if (cookieBanner && !localStorage.getItem('cookiesAccepted')) {
        cookieBanner.classList.remove('hidden');
        
        acceptCookies.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            cookieBanner.classList.add('hidden');
            showToast('Cookie preferences saved', 'success');
        });
        
        declineCookies.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'false');
            cookieBanner.classList.add('hidden');
            showToast('Cookie preferences saved', 'success');
        });
    }
}

// Back to top button functionality
function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    
    if (backToTopButton) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.remove('opacity-0');
            } else {
                backToTopButton.classList.add('opacity-0');
            }
        });

        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Form validation
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('border-red-500');
                    
                    // Add error message
                    const errorMessage = document.createElement('p');
                    errorMessage.className = 'text-red-500 text-sm mt-1';
                    errorMessage.textContent = 'This field is required';
                    field.parentNode.appendChild(errorMessage);
                } else {
                    field.classList.remove('border-red-500');
                    const errorMessage = field.parentNode.querySelector('.text-red-500');
                    if (errorMessage) {
                        errorMessage.remove();
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                // Scroll to first error
                const firstError = form.querySelector('.border-red-500');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });
}

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } z-50 transform transition-all duration-300 translate-y-0 opacity-100`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('translate-y-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Testimonials functionality
function initTestimonials() {
    const track = document.querySelector('.testimonials-track');
    const cards = document.querySelectorAll('.testimonial-card');
    const prevButton = document.querySelector('.carousel-nav.prev');
    const nextButton = document.querySelector('.carousel-nav.next');
    const filterButtons = document.querySelectorAll('.testimonial-filter');
    const writeReviewBtn = document.getElementById('write-review-btn');
    
    let currentIndex = 0;
    const cardWidth = cards[0].offsetWidth;
    const containerWidth = document.querySelector('.testimonials-container').offsetWidth;
    const maxIndex = cards.length - Math.floor(containerWidth / cardWidth);

    // Carousel navigation
    function updateCarousel() {
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }

    prevButton.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
        }
    });

    // Category filtering
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            
            // Update active filter button
            filterButtons.forEach(btn => {
                btn.classList.remove('bg-blue-100', 'text-blue-800');
                btn.classList.add('bg-gray-100', 'text-gray-800');
            });
            button.classList.remove('bg-gray-100', 'text-gray-800');
            button.classList.add('bg-blue-100', 'text-blue-800');

            // Filter testimonials
            cards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.5s ease-in-out';
                } else {
                    card.style.display = 'none';
                }
            });

            // Reset carousel position
            currentIndex = 0;
            updateCarousel();
        });
    });

    // Write Review button
    writeReviewBtn.addEventListener('click', () => {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
            showToast('Please log in to write a review', 'error');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return;
        }

        // Show review form modal
        showReviewForm();
    });

    // Add intersection observer for fade-in animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
        observer.observe(card);
    });
}

// Review form modal
function showReviewForm() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 overflow-y-auto';
    modal.innerHTML = `
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div class="absolute right-0 top-0 pr-4 pt-4">
                    <button type="button" class="close-review-modal rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        <span class="sr-only">Close</span>
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="sm:flex sm:items-start">
                    <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 class="text-lg font-semibold leading-6 text-gray-900">Write a Review</h3>
                        <form id="review-form" class="mt-4 space-y-4">
                            <div>
                                <label for="rating" class="block text-sm font-medium text-gray-700">Rating</label>
                                <div class="flex items-center mt-1">
                                    ${[1, 2, 3, 4, 5].map(num => `
                                        <button type="button" class="rating-star text-gray-300 hover:text-yellow-400 focus:outline-none" data-rating="${num}">
                                            <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </button>
                                    `).join('')}
                                </div>
                                <input type="hidden" id="rating" name="rating" required>
                            </div>
                            <div>
                                <label for="review-text" class="block text-sm font-medium text-gray-700">Your Review</label>
                                <textarea id="review-text" name="review-text" rows="4" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required></textarea>
                            </div>
                            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                <button type="submit" class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto">Submit Review</button>
                                <button type="button" class="close-review-modal mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle rating selection
    const ratingStars = modal.querySelectorAll('.rating-star');
    const ratingInput = modal.querySelector('#rating');
    
    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            ratingInput.value = rating;
            
            ratingStars.forEach(s => {
                const starRating = parseInt(s.dataset.rating);
                if (starRating <= rating) {
                    s.classList.remove('text-gray-300');
                    s.classList.add('text-yellow-400');
                } else {
                    s.classList.remove('text-yellow-400');
                    s.classList.add('text-gray-300');
                }
            });
        });
    });

    // Handle form submission
    const reviewForm = modal.querySelector('#review-form');
    reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rating = ratingInput.value;
        const reviewText = modal.querySelector('#review-text').value;

        // Here you would typically send this to your backend
        console.log('Review submitted:', { rating, reviewText });
        
        showToast('Thank you for your review!', 'success');
        modal.remove();
    });

    // Handle modal closing
    const closeButtons = modal.querySelectorAll('.close-review-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.remove();
        });
    });
}

// Language switching functionality
function initLanguageSwitcher() {
    const languageSwitcher = document.getElementById('language-switcher');
    const languageDropdown = document.getElementById('language-dropdown');
    const currentLang = localStorage.getItem('language') || 'en';
    
    // Set initial language
    document.documentElement.lang = currentLang;
    updateLanguageUI(currentLang);
    
    // Loading state class
    const LOADING_CLASS = 'language-switching';
    
    // Language translations
    const translations = {
        en: {
            // Navigation
            'home': 'Home',
            'about': 'About Us',
            'how-it-works': 'How It Works',
            'pricing': 'Pricing',
            'contact': 'Contact',
            'login': 'Login',
            'sign-up': 'Sign Up',
            'search': 'Search',
            
            // Hero Section
            'hero-title': 'About Us',
            'hero-subtitle': 'Revolutionizing legal services through technology',
            
            // Mission Section
            'mission-title': 'Our Mission',
            'mission-heading': 'Making Legal Services Accessible to All',
            'mission-text': 'We believe that everyone deserves access to quality legal representation. Our platform connects clients with experienced lawyers, making legal services more accessible, transparent, and efficient.',
            
            // Values Section
            'values-title': 'Our Values',
            'values-heading': 'What We Stand For',
            'transparency': 'Transparency',
            'transparency-text': 'We believe in clear communication and honest pricing for all legal services.',
            'accessibility': 'Accessibility',
            'accessibility-text': 'Making legal services available to everyone, regardless of their background or location.',
            'quality': 'Quality',
            'quality-text': 'Ensuring high standards in both our platform and the legal professionals we connect you with.',
            
            // Team Section
            'team-title': 'Our Team',
            'team-heading': 'Meet the People Behind Legal Marketplace',
            
            // Testimonials Section
            'testimonials-title': 'Testimonials',
            'testimonials-heading': 'What Our Clients Say',
            'all': 'All',
            'business': 'Business',
            'individual': 'Individual',
            'startup': 'Startup',
            'write-review': 'Write a Review',
            
            // Footer
            'footer-tagline': 'Connecting clients with trusted legal professionals',
            'quick-links': 'Quick Links',
            'legal': 'Legal',
            'terms': 'Terms of Service',
            'privacy': 'Privacy Policy',
            'cookies': 'Cookie Policy',
            'connect': 'Connect With Us',
            'copyright': '© 2024 Legal Marketplace. All rights reserved.',
            
            // Language Names
            'english': 'English',
            'arabic': 'Arabic'
        },
        ar: {
            // Navigation
            'home': 'الرئيسية',
            'about': 'من نحن',
            'how-it-works': 'كيف يعمل',
            'pricing': 'التسعير',
            'contact': 'اتصل بنا',
            'login': 'تسجيل الدخول',
            'sign-up': 'إنشاء حساب',
            'search': 'بحث',
            
            // Hero Section
            'hero-title': 'من نحن',
            'hero-subtitle': 'ثورة في الخدمات القانونية من خلال التكنولوجيا',
            
            // Mission Section
            'mission-title': 'مهمتنا',
            'mission-heading': 'جعل الخدمات القانونية متاحة للجميع',
            'mission-text': 'نؤمن بأن الجميع يستحق الوصول إلى تمثيل قانوني عالي الجودة. تربط منصتنا العملاء بمحامين ذوي خبرة، مما يجعل الخدمات القانونية أكثر سهولة وشفافية وكفاءة.',
            
            // Values Section
            'values-title': 'قيمنا',
            'values-heading': 'ما نقف من أجله',
            'transparency': 'الشفافية',
            'transparency-text': 'نؤمن بالتواصل الواضح والتسعير الصادق لجميع الخدمات القانونية.',
            'accessibility': 'سهولة الوصول',
            'accessibility-text': 'جعل الخدمات القانونية متاحة للجميع، بغض النظر عن خلفيتهم أو موقعهم.',
            'quality': 'الجودة',
            'quality-text': 'ضمان معايير عالية في منصتنا والمحامين الذين نربطك بهم.',
            
            // Team Section
            'team-title': 'فريقنا',
            'team-heading': 'تعرف على الأشخاص وراء المنصة القانونية',
            
            // Testimonials Section
            'testimonials-title': 'آراء العملاء',
            'testimonials-heading': 'ماذا يقول عملاؤنا',
            'all': 'الكل',
            'business': 'الأعمال',
            'individual': 'الأفراد',
            'startup': 'الشركات الناشئة',
            'write-review': 'اكتب مراجعة',
            
            // Footer
            'footer-tagline': 'ربط العملاء بمحامين موثوقين',
            'quick-links': 'روابط سريعة',
            'legal': 'قانوني',
            'terms': 'شروط الاستخدام',
            'privacy': 'سياسة الخصوصية',
            'cookies': 'سياسة ملفات تعريف الارتباط',
            'connect': 'تواصل معنا',
            'copyright': '© 2024 المنصة القانونية. جميع الحقوق محفوظة.',
            
            // Language Names
            'english': 'English',
            'arabic': 'العربية'
        }
    };

    // Function to show loading state
    function showLoadingState() {
        document.body.classList.add(LOADING_CLASS);
        languageSwitcher.setAttribute('aria-busy', 'true');
        languageSwitcher.disabled = true;
    }

    // Function to hide loading state
    function hideLoadingState() {
        document.body.classList.remove(LOADING_CLASS);
        languageSwitcher.setAttribute('aria-busy', 'false');
        languageSwitcher.disabled = false;
    }

    // Function to handle translation errors
    function handleTranslationError(key, lang) {
        console.error(`Missing translation for key: ${key} in language: ${lang}`);
        return `[${key}]`; // Fallback text
    }

    // Function to update UI with new language
    async function updateLanguageUI(lang) {
        try {
            showLoadingState();
            
            // Update HTML lang attribute with animation
            document.documentElement.lang = lang;
            document.documentElement.classList.add('language-transition');
            
            // Update language switcher text
            const langText = document.querySelector('#language-switcher span');
            langText.textContent = lang.toUpperCase();
            
            // Update RTL/LTR direction with animation
            const newDir = lang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.dir = newDir;
            
            // Update all translatable elements with fade animation
            const elements = document.querySelectorAll('[data-translate]');
            for (const element of elements) {
                const key = element.getAttribute('data-translate');
                const translation = translations[lang][key] || handleTranslationError(key, lang);
                
                // Add fade out animation
                element.style.opacity = '0';
                element.style.transition = 'opacity 0.3s ease-in-out';
                
                // Wait for fade out
                await new Promise(resolve => setTimeout(resolve, 150));
                
                // Update content
                element.textContent = translation;
                
                // Add fade in animation
                element.style.opacity = '1';
            }
            
            // Update placeholder texts
            document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
                const key = element.getAttribute('data-translate-placeholder');
                element.placeholder = translations[lang][key] || handleTranslationError(key, lang);
            });
            
            // Update button texts
            document.querySelectorAll('[data-translate-button]').forEach(element => {
                const key = element.getAttribute('data-translate-button');
                element.textContent = translations[lang][key] || handleTranslationError(key, lang);
            });
            
            // Update alt texts
            document.querySelectorAll('[data-translate-alt]').forEach(element => {
                const key = element.getAttribute('data-translate-alt');
                element.alt = translations[lang][key] || handleTranslationError(key, lang);
            });

            // Update active state in dropdown with animation
            document.querySelectorAll('.language-option').forEach(option => {
                if (option.dataset.lang === lang) {
                    option.classList.add('bg-gray-100', 'scale-105');
                } else {
                    option.classList.remove('bg-gray-100', 'scale-105');
                }
            });

            // Update language names in dropdown
            document.querySelectorAll('.language-option').forEach(option => {
                const langKey = option.dataset.lang;
                const langName = translations[langKey][langKey === 'en' ? 'english' : 'arabic'] || 
                               handleTranslationError(langKey === 'en' ? 'english' : 'arabic', langKey);
                option.querySelector('span:last-child').textContent = langName;
            });

            // Wait for animations to complete
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Remove transition class
            document.documentElement.classList.remove('language-transition');
            
            // Announce language change to screen readers
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'sr-only';
            announcement.textContent = lang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English';
            document.body.appendChild(announcement);
            setTimeout(() => announcement.remove(), 1000);
            
        } catch (error) {
            console.error('Error updating language:', error);
            showToast('Error changing language. Please try again.', 'error');
        } finally {
            hideLoadingState();
        }
    }

    // Toggle dropdown with animation
    languageSwitcher.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = languageDropdown.classList.contains('hidden');
        languageDropdown.classList.toggle('hidden');
        languageSwitcher.setAttribute('aria-expanded', !isExpanded);
        
        if (!isExpanded) {
            // Add entrance animation
            languageDropdown.style.transform = 'scale(0.95)';
            languageDropdown.style.opacity = '0';
            requestAnimationFrame(() => {
                languageDropdown.style.transform = 'scale(1)';
                languageDropdown.style.opacity = '1';
            });
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!languageSwitcher.contains(e.target) && !languageDropdown.contains(e.target)) {
            languageDropdown.classList.add('hidden');
            languageSwitcher.setAttribute('aria-expanded', 'false');
        }
    });

    // Handle language selection
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', async () => {
            const newLang = option.dataset.lang;
            
            // Update language in localStorage
            localStorage.setItem('language', newLang);
            
            // Update UI
            await updateLanguageUI(newLang);
            
            // Hide dropdown with animation
            languageDropdown.style.transform = 'scale(0.95)';
            languageDropdown.style.opacity = '0';
            setTimeout(() => {
                languageDropdown.classList.add('hidden');
                languageSwitcher.setAttribute('aria-expanded', 'false');
            }, 150);
            
            // Show success message
            showToast(newLang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language changed to English', 'success');
        });
    });

    // Handle keyboard navigation
    languageSwitcher.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            languageDropdown.classList.toggle('hidden');
            languageSwitcher.setAttribute('aria-expanded', languageDropdown.classList.contains('hidden') ? 'false' : 'true');
        }
        if (e.key === 'Escape') {
            languageDropdown.classList.add('hidden');
            languageSwitcher.setAttribute('aria-expanded', 'false');
        }
    });

    // Handle keyboard navigation in dropdown
    languageDropdown.addEventListener('keydown', (e) => {
        const options = Array.from(document.querySelectorAll('.language-option'));
        const currentIndex = options.findIndex(option => option.classList.contains('bg-gray-100'));

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % options.length;
                options[nextIndex].focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + options.length) % options.length;
                options[prevIndex].focus();
                break;
            case 'Escape':
                languageDropdown.classList.add('hidden');
                languageSwitcher.setAttribute('aria-expanded', 'false');
                languageSwitcher.focus();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                const focusedOption = document.activeElement;
                if (focusedOption.classList.contains('language-option')) {
                    focusedOption.click();
                }
                break;
        }
    });

    // Add focus management
    languageSwitcher.addEventListener('focus', () => {
        languageSwitcher.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
    });

    languageSwitcher.addEventListener('blur', () => {
        languageSwitcher.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
    });

    // Add hover effects
    languageSwitcher.addEventListener('mouseenter', () => {
        languageSwitcher.classList.add('bg-gray-50');
    });

    languageSwitcher.addEventListener('mouseleave', () => {
        if (!languageDropdown.classList.contains('hidden')) return;
        languageSwitcher.classList.remove('bg-gray-50');
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initSearch();
    initCookieConsent();
    initBackToTop();
    initFormValidation();
    initTestimonials();
    initLanguageSwitcher();
}); 