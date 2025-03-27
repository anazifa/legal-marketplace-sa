// Core Web Vitals reporting
class PerformanceMetrics {
    constructor() {
        this.metrics = {};
        this.initObserver();
    }

    initObserver() {
        if (!('PerformanceObserver' in window)) return;

        // Observe CLS
        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        this.metrics.cls = (this.metrics.cls || 0) + entry.value;
                    }
                }
            }).observe({ entryTypes: ['layout-shift'] });
        } catch (e) {
            console.error('CLS:', e);
        }

        // Observe FID
        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                }
            }).observe({ entryTypes: ['first-input'] });
        } catch (e) {
            console.error('FID:', e);
        }

        // Observe LCP
        try {
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
            }).observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            console.error('LCP:', e);
        }
    }

    getMetrics() {
        return this.metrics;
    }
}

// Error tracking
class ErrorTracker {
    constructor() {
        this.errors = [];
        this.init();
    }

    init() {
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'runtime',
                message: event.message,
                stack: event.error?.stack,
                url: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled Promise Rejection',
                stack: event.reason?.stack
            });
        });
    }

    logError(error) {
        this.errors.push({
            ...error,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });

        // In a real implementation, you would send this to your error tracking service
        console.error('Tracked Error:', error);
    }

    getErrors() {
        return this.errors;
    }
}

// User behavior tracking
class UserBehaviorTracker {
    constructor() {
        this.events = [];
        this.init();
    }

    init() {
        // Track page views
        this.trackPageView();

        // Track clicks
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button');
            if (target) {
                this.trackEvent('click', {
                    element: target.tagName.toLowerCase(),
                    text: target.textContent?.trim(),
                    href: target.href
                });
            }
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.trackEvent('form_submit', {
                formId: e.target.id || 'unknown'
            });
        });
    }

    trackPageView() {
        this.trackEvent('page_view', {
            path: window.location.pathname,
            referrer: document.referrer
        });
    }

    trackEvent(eventName, data) {
        const event = {
            eventName,
            data,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };

        this.events.push(event);
        // In a real implementation, you would send this to your analytics service
        console.log('Tracked Event:', event);
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now();
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    }

    getEvents() {
        return this.events;
    }
}

// Initialize trackers
const performanceMetrics = new PerformanceMetrics();
const errorTracker = new ErrorTracker();
const userBehaviorTracker = new UserBehaviorTracker();

// Export for use in other files
window.Analytics = {
    performance: performanceMetrics,
    error: errorTracker,
    behavior: userBehaviorTracker
}; 